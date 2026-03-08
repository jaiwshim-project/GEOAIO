import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { username, pin } = await req.json();
    if (!username || !pin) return NextResponse.json({ error: '사용자 이름과 비밀번호를 입력해주세요.' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, company_name, service_name, phone, email, pin')
      .eq('username', username)
      .single();

    if (error || !data) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    if (data.pin !== pin) return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });

    const { pin: _pin, ...user } = data;
    return NextResponse.json({ user });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
