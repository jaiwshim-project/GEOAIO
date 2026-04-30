import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

const SITE_AUTH_COOKIE = 'site-auth';
// 비밀번호 게이트를 통과하지 않아도 되는 공개 경로
const PUBLIC_PATHS = [
  '/site-password',
  '/api/site-password',
  // 색인 모니터링 API — Bearer 토큰으로 자체 인증, 외부 cron 에이전트가 호출
  '/api/indexing',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 사이트 비밀번호 게이트 — 공개 경로 외 모든 요청을 검사
  if (!isPublic(pathname)) {
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
