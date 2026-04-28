import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const COOKIE_NAME = 'site-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

function expectedPassword(): string {
  return process.env.SITE_ACCESS_PASSWORD || '963314';
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
    }
    if (password !== expectedPassword()) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, password, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 로그아웃: 쿠키 삭제
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res;
}
