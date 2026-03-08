import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, company_name, service_name')
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data || [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, company_name, service_name, phone, email, pin } = await req.json();
    if (!username?.trim()) return NextResponse.json({ error: '사용자 이름은 필수입니다.' }, { status: 400 });
    if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: '비밀번호는 숫자 4자리여야 합니다.' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ username: username.trim(), company_name, service_name, phone, email, pin })
      .select('id, username, company_name, service_name, phone, email')
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: '이미 사용 중인 사용자 이름입니다.' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ user: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
