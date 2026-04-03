import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type PlanType = 'admin' | 'free' | 'tester' | 'pro' | 'max';
type FeatureType = 'analyze' | 'generate' | 'keyword' | 'series';

const PLAN_FEATURE_LIMITS: Record<PlanType, Record<FeatureType, number>> = {
  admin:  { analyze: -1, generate: -1, keyword: -1, series: -1 },
  free:   { analyze: 3, generate: 3, keyword: 3, series: 3 },
  tester: { analyze: 50, generate: 50, keyword: 50, series: 50 },
  pro:    { analyze: 15, generate: 15, keyword: 15, series: 15 },
  max:    { analyze: 50, generate: 50, keyword: 50, series: 50 },
};

const FEATURE_LABELS: Record<FeatureType, string> = {
  analyze: '콘텐츠 분석',
  generate: '콘텐츠 생성',
  keyword: '키워드 분석',
  series: '시리즈 기획',
};

const VALID_PLANS = new Set(['admin', 'free', 'tester', 'pro', 'max']);

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });

    const supabase = getServiceClient();
    const month = getCurrentMonth();

    let plan: PlanType = 'free';
    let periodStart: string | null = null;
    let periodEnd: string | null = null;

    // 1. user_profiles에서 email, username 조회
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('email, username')
      .eq('id', userId)
      .maybeSingle();

    // 2. email 또는 username으로 auth user 찾아서 user_plans 조회
    if (profileData?.email || profileData?.username) {
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const authUser = authUsers.find(u =>
        u.email === profileData.email || u.email === profileData.username
      );
      if (authUser) {
        const { data: planData } = await supabase
          .from('user_plans')
          .select('plan, expires_at, created_at')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (planData && VALID_PLANS.has(planData.plan)) {
          if (planData.plan === 'admin') {
            plan = 'admin';
          } else if (!planData.expires_at || new Date(planData.expires_at) >= new Date()) {
            plan = planData.plan as PlanType;
          }

          if (planData.expires_at) {
            const expiry = new Date(planData.expires_at);
            const start = new Date(expiry);
            start.setDate(start.getDate() - 30);
            periodStart = formatDate(start);
            periodEnd = formatDate(expiry);
          } else if (planData.created_at) {
            const start = new Date(planData.created_at);
            const end = new Date(start);
            end.setDate(end.getDate() + 30);
            periodStart = formatDate(start);
            periodEnd = formatDate(end);
          }
        }
      }
    }

    // 3. user_plans에서 직접 user_profiles.id로도 시도 (fallback)
    if (plan === 'free') {
      const { data: planData } = await supabase
        .from('user_plans')
        .select('plan, expires_at, created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (planData && VALID_PLANS.has(planData.plan)) {
        if (planData.plan === 'admin') {
          plan = 'admin';
        } else if (!planData.expires_at || new Date(planData.expires_at) >= new Date()) {
          plan = planData.plan as PlanType;
        }

        if (planData.expires_at) {
          const expiry = new Date(planData.expires_at);
          const start = new Date(expiry);
          start.setDate(start.getDate() - 30);
          periodStart = formatDate(start);
          periodEnd = formatDate(expiry);
        } else if (planData.created_at) {
          const start = new Date(planData.created_at);
          const end = new Date(start);
          end.setDate(end.getDate() + 30);
          periodStart = formatDate(start);
          periodEnd = formatDate(end);
        }
      }
    }

    // 이번 달 사용량 조회 (user_profiles.id 기준)
    const { data: usageData } = await supabase
      .from('usage_counts')
      .select('feature, count')
      .eq('user_id', userId)
      .eq('month', month);

    const usageMap: Record<string, number> = {};
    for (const row of usageData || []) {
      usageMap[row.feature] = row.count;
    }

    const features: FeatureType[] = ['analyze', 'generate', 'keyword', 'series'];
    const summary = features.map((feature) => {
      const limit = PLAN_FEATURE_LIMITS[plan][feature];
      const used = usageMap[feature] || 0;
      return {
        feature,
        label: FEATURE_LABELS[feature],
        used,
        limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - used),
      };
    });

    // 구독 날짜가 없으면 이번 달 1일 ~ 말일로 fallback
    if (!periodStart || !periodEnd) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodStart = formatDate(firstDay);
      periodEnd = formatDate(lastDay);
    }

    // debug: 플랜 조회 경로 추적
    const debug = {
      profileFound: !!profileData,
      profileEmail: profileData?.email || null,
      profileUsername: profileData?.username || null,
    };
    return NextResponse.json({ plan, summary, month, periodStart, periodEnd, debug });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
