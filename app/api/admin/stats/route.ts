import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  }
  return createClient(url, serviceKey);
}

async function verifyAdmin(request?: NextRequest): Promise<boolean> {
  // 비밀번호 헤더로 인증
  if (request) {
    const pw = request.headers.get('X-Admin-Password');
    if (pw && pw === process.env.ADMIN_PASSWORD) return true;
  }
  // Supabase 인증
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.plan === 'admin';
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const supabase = getAdminClient();

    // 1. 전체 사용자 수 & 플랜별
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    const { data: plans } = await supabase.from('user_plans').select('user_id, plan');
    const planMap = new Map((plans || []).map(p => [p.user_id, p.plan]));

    const planCounts = { admin: 0, free: 0, tester: 0, pro: 0, max: 0 };
    users.forEach(u => {
      const plan = (planMap.get(u.id) || 'free') as keyof typeof planCounts;
      if (plan in planCounts) planCounts[plan]++;
    });

    // 2. 전체 사용량 (누적)
    const { data: allUsage } = await supabase.from('usage_counts').select('feature, count, month');

    const totalByFeature: Record<string, number> = { analyze: 0, generate: 0, keyword: 0, series: 0 };
    const monthlyData: Record<string, Record<string, number>> = {};

    (allUsage || []).forEach(u => {
      totalByFeature[u.feature] = (totalByFeature[u.feature] || 0) + u.count;

      if (!monthlyData[u.month]) {
        monthlyData[u.month] = { analyze: 0, generate: 0, keyword: 0, series: 0 };
      }
      monthlyData[u.month][u.feature] = (monthlyData[u.month][u.feature] || 0) + u.count;
    });

    // 3. 이번 달 사용량
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthUsage = monthlyData[currentMonth] || { analyze: 0, generate: 0, keyword: 0, series: 0 };

    // 4. 월별 추이 (최근 6개월)
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const monthlyTrend = months.map(m => ({
      month: m,
      ...( monthlyData[m] || { analyze: 0, generate: 0, keyword: 0, series: 0 }),
      total: Object.values(monthlyData[m] || {}).reduce((a, b) => a + b, 0),
    }));

    // 5. 가입자 추이 (최근 6개월)
    const signupTrend = months.map(m => {
      const count = users.filter(u => u.created_at?.startsWith(m)).length;
      return { month: m, count };
    });

    // 6. 오늘/이번 주 활성 사용자 (최근 로그인 기준)
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeToday = users.filter(u => u.last_sign_in_at?.startsWith(todayStr)).length;
    const activeWeek = users.filter(u => u.last_sign_in_at && u.last_sign_in_at >= weekAgo).length;

    // 7. 상위 사용자 (누적 사용량 기준 Top 10)
    const { data: userUsage } = await supabase.from('usage_counts').select('user_id, count');
    const userTotalMap = new Map<string, number>();
    (userUsage || []).forEach(u => {
      userTotalMap.set(u.user_id, (userTotalMap.get(u.user_id) || 0) + u.count);
    });
    const topUsers = [...userTotalMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, total]) => {
        const user = users.find(u => u.id === userId);
        return {
          name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '알 수 없음',
          email: user?.email || '',
          plan: planMap.get(userId) || 'free',
          total,
        };
      });

    // 8. 등급 변경 히스토리 통계
    const { data: planHistory } = await supabase
      .from('plan_history')
      .select('user_id, old_plan, new_plan, changed_at, changed_by')
      .order('changed_at', { ascending: false });

    // 월별 등급 변경 추이 (최근 6개월)
    const planChangeTrend = months.map(m => {
      const monthChanges = (planHistory || []).filter(h => h.changed_at?.startsWith(m));
      const upgrades = monthChanges.filter(h => {
        const rank: Record<string, number> = { free: 0, tester: 1, pro: 2, max: 3, admin: 4 };
        return (rank[h.new_plan] || 0) > (rank[h.old_plan] || 0);
      }).length;
      const downgrades = monthChanges.filter(h => {
        const rank: Record<string, number> = { free: 0, tester: 1, pro: 2, max: 3, admin: 4 };
        return (rank[h.new_plan] || 0) < (rank[h.old_plan] || 0);
      }).length;
      return { month: m, upgrades, downgrades, total: monthChanges.length };
    });

    // 등급 전환 흐름 (어디서 어디로)
    const transitionMap: Record<string, number> = {};
    (planHistory || []).forEach(h => {
      const key = `${h.old_plan}→${h.new_plan}`;
      transitionMap[key] = (transitionMap[key] || 0) + 1;
    });
    const planTransitions = Object.entries(transitionMap)
      .map(([key, count]) => {
        const [from, to] = key.split('→');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count);

    // 변경 주체별 통계 (관리자 vs 시스템 자동)
    const changeBySource = {
      admin: (planHistory || []).filter(h => h.changed_by === 'admin').length,
      system: (planHistory || []).filter(h => h.changed_by === 'system').length,
    };

    // 최근 등급 변경 내역 (최근 20건)
    const recentChanges = (planHistory || []).slice(0, 20).map(h => {
      const user = users.find(u => u.id === h.user_id);
      return {
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '알 수 없음',
        email: user?.email || '',
        old_plan: h.old_plan,
        new_plan: h.new_plan,
        changed_at: h.changed_at,
        changed_by: h.changed_by,
      };
    });

    // 구독 현황 요약
    const { data: plansWithExpiry } = await supabase
      .from('user_plans')
      .select('plan, expires_at')
      .in('plan', ['pro', 'max']);

    const subscriptionSummary = {
      totalPaid: (plansWithExpiry || []).length,
      pro: (plansWithExpiry || []).filter(p => p.plan === 'pro').length,
      max: (plansWithExpiry || []).filter(p => p.plan === 'max').length,
      expiringSoon: (plansWithExpiry || []).filter(p => {
        if (!p.expires_at) return false;
        const diff = Math.ceil((new Date(p.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      }).length,
      expired: (plansWithExpiry || []).filter(p => {
        if (!p.expires_at) return false;
        return new Date(p.expires_at) < now;
      }).length,
    };

    return NextResponse.json({
      totalUsers: users.length,
      planCounts,
      totalByFeature,
      thisMonthUsage,
      monthlyTrend,
      signupTrend,
      activeToday,
      activeWeek,
      topUsers,
      currentMonth,
      planChangeTrend,
      planTransitions,
      changeBySource,
      recentChanges,
      subscriptionSummary,
      totalPlanChanges: (planHistory || []).length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}
