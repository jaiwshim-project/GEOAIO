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

// GET: 회원 목록 조회
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const supabase = getAdminClient();

    // auth.users 목록 조회
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersError) throw usersError;

    // user_plans 목록 조회 (previous_plan 포함)
    const { data: plans } = await supabase
      .from('user_plans')
      .select('user_id, plan, previous_plan, created_at, expires_at');

    // plan_history 조회
    const { data: history } = await supabase
      .from('plan_history')
      .select('user_id, old_plan, new_plan, changed_at, changed_by')
      .order('changed_at', { ascending: false });

    // usage_counts 이번 달
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data: monthlyUsage } = await supabase
      .from('usage_counts')
      .select('user_id, feature, count')
      .eq('month', month);

    // usage_counts 전체 (누적)
    const { data: allUsage } = await supabase
      .from('usage_counts')
      .select('user_id, feature, count');

    // 데이터 조합
    const planMap = new Map((plans || []).map(p => [p.user_id, p]));

    const historyMap = new Map<string, Array<{ old_plan: string; new_plan: string; changed_at: string; changed_by: string }>>();
    (history || []).forEach(h => {
      if (!historyMap.has(h.user_id)) historyMap.set(h.user_id, []);
      historyMap.get(h.user_id)!.push(h);
    });

    const monthlyMap = new Map<string, Record<string, number>>();
    (monthlyUsage || []).forEach(u => {
      if (!monthlyMap.has(u.user_id)) monthlyMap.set(u.user_id, {});
      monthlyMap.get(u.user_id)![u.feature] = u.count;
    });

    const totalMap = new Map<string, Record<string, number>>();
    (allUsage || []).forEach(u => {
      if (!totalMap.has(u.user_id)) totalMap.set(u.user_id, {});
      const prev = totalMap.get(u.user_id)![u.feature] || 0;
      totalMap.get(u.user_id)![u.feature] = prev + u.count;
    });

    const result = users.map(user => {
      const planData = planMap.get(user.id);
      const monthly = monthlyMap.get(user.id) || {};
      const total = totalMap.get(user.id) || {};

      // pro/max 사용자 중 expires_at이 없으면 created_at 기준 30일로 계산
      let expiresAt = planData?.expires_at || null;
      if (!expiresAt && planData && ['pro', 'max'].includes(planData.plan)) {
        const base = new Date(planData.created_at);
        base.setDate(base.getDate() + 30);
        expiresAt = base.toISOString();
      }

      return {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name || user.user_metadata?.preferred_username || '',
        email: user.email || '',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        plan: planData?.plan || 'free',
        previous_plan: planData?.previous_plan || null,
        plan_expires_at: expiresAt,
        plan_history: historyMap.get(user.id) || [],
        usage: {
          analyze: monthly['analyze'] || 0,
          generate: monthly['generate'] || 0,
          keyword: monthly['keyword'] || 0,
          series: monthly['series'] || 0,
        },
        totalUsage: {
          analyze: total['analyze'] || 0,
          generate: total['generate'] || 0,
          keyword: total['keyword'] || 0,
          series: total['series'] || 0,
        },
      };
    });

    return NextResponse.json({ users: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}

// POST: 회원 등급 변경 또는 이름 수정
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, plan, name } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 이름 수정
    if (name !== undefined) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: name },
      });
      if (updateError) throw updateError;
    }

    // 등급 변경
    if (plan) {
      if (!['admin', 'free', 'tester', 'pro', 'max'].includes(plan)) {
        return NextResponse.json({ error: '유효하지 않은 플랜입니다.' }, { status: 400 });
      }

      // 기존 등급 조회 (히스토리 기록용)
      const { data: currentPlan } = await supabase
        .from('user_plans')
        .select('plan')
        .eq('user_id', userId)
        .maybeSingle();

      const oldPlan = currentPlan?.plan || 'free';

      // 유료 플랜은 만료일 자동 설정 (30일)
      let expiresAt: string | null = null;
      if (plan === 'pro' || plan === 'max') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        expiresAt = expiry.toISOString();
      }

      const { error } = await supabase
        .from('user_plans')
        .upsert(
          { user_id: userId, plan, previous_plan: oldPlan, created_at: new Date().toISOString(), expires_at: expiresAt },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      // 등급 변경 히스토리 기록
      if (oldPlan !== plan) {
        await supabase.from('plan_history').insert({
          user_id: userId,
          old_plan: oldPlan,
          new_plan: plan,
          changed_at: new Date().toISOString(),
          changed_by: 'admin',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}

// PATCH: 구독 갱신 (30일 연장)
export async function PATCH(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: current } = await supabase
      .from('user_plans')
      .select('plan, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!current || !['pro', 'max'].includes(current.plan)) {
      return NextResponse.json({ error: '유료 플랜 사용자만 갱신할 수 있습니다.' }, { status: 400 });
    }

    // 잔여일이 있으면 기존 만료일 기준, 이미 만료면 현재 기준
    const baseDate = current.expires_at && new Date(current.expires_at) > new Date()
      ? new Date(current.expires_at)
      : new Date();
    baseDate.setDate(baseDate.getDate() + 30);

    const { error } = await supabase
      .from('user_plans')
      .update({ expires_at: baseDate.toISOString() })
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true, newExpiresAt: baseDate.toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}
