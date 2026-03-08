import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }
    if (password === adminPassword) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: '오류 발생' }, { status: 500 });
  }
}
