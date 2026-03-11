import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// POST: 사용량 증가
export async function POST(req: NextRequest) {
  try {
    const { user_id, feature } = await req.json();
    if (!user_id || !feature) return NextResponse.json({ error: 'user_id, feature 필요' }, { status: 400 });

    const supabase = getServiceClient();
    const month = getCurrentMonth();

    const { data: existing } = await supabase
      .from('usage_counts')
      .select('id, count')
      .eq('user_id', user_id)
      .eq('feature', feature)
      .eq('month', month)
      .maybeSingle();

    if (existing) {
      await supabase.from('usage_counts').update({ count: existing.count + 1 }).eq('id', existing.id);
    } else {
      await supabase.from('usage_counts').insert({ user_id, feature, month, count: 1 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
