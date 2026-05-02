import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

const SITE_AUTH_COOKIE = 'site-auth';

// 비밀번호 인증이 필요한 보호 경로
// prefix 매칭이므로 하위 라우트 모두 포함됨. 이 외 페이지(메인·분석·키워드·시리즈·색인 등)는 자유 접근.
const PROTECTED_PATHS = [
  '/generate',        // 콘텐츠 생성 + /generate/result, /generate/results
  '/user-select',     // 사용자 선택 페이지
  '/user-dashboard',  // 프로젝트 선택/추가 페이지
  '/mypage',          // 사용자 본인 콘텐츠 결과
  '/admin',           // 관리자 대시보드
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 색인·AI 인용 친화 경로는 미들웨어 우회 — supabase 쿠키 읽기로 인한
  // 강제 동적 렌더링 + Cache-Control: no-store 응답을 막아 ISR이 살아 있도록.
  if (
    pathname.startsWith('/blog') ||
    pathname.startsWith('/sitemap') ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

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
