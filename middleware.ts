import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

const SITE_AUTH_COOKIE = 'site-auth';

// 비밀번호 인증이 필요한 보호 경로 (콘텐츠 생성·결과 페이지만)
// /generate, /generate/result, /generate/results 모두 prefix 매칭으로 포함된다.
// 이 외 모든 페이지(메인 홈·분석·키워드·시리즈·색인 대시보드 등)는 자유롭게 접근 가능.
const PROTECTED_PATHS = [
  '/generate',
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 사이트 비밀번호 게이트 — 보호 경로에만 적용
  if (isProtected(pathname)) {
    const auth = request.cookies.get(SITE_AUTH_COOKIE)?.value;
    const expected = process.env.SITE_ACCESS_PASSWORD || '963314';
    if (!auth || auth !== expected) {
      const url = request.nextUrl.clone();
      url.pathname = '/site-password';
      url.search = ''; // 기존 쿼리 제거
      url.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
