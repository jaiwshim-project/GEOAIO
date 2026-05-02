// GET /api/indexing/oauth-start
// Google Search Console OAuth 동의 시작 — refresh_token 발급용 동의 화면으로 redirect.
// access_type=offline + prompt=consent로 refresh_token이 매번 발급되도록 강제.
//
// 흐름: 사용자 클릭 → 이 라우트 → Google 동의 화면 → /api/indexing/oauth-callback에 코드 반환
//      → 콜백이 refresh_token 표시 → 사용자가 Vercel GSC_REFRESH_TOKEN에 등록.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const REDIRECT_URI = 'https://www.geo-aio.com/api/indexing/oauth-callback';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export async function GET(_req: NextRequest) {
  const clientId = process.env.GSC_CLIENT_ID;
  if (!clientId) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui;max-width:600px;margin:40px auto;padding:0 20px">
        <h1 style="color:#b91c1c">❌ GSC_CLIENT_ID 미설정</h1>
        <p>Vercel 환경변수에 <code>GSC_CLIENT_ID</code>를 먼저 등록한 뒤 재배포 후 다시 시도하세요.</p>
        <p>Google Cloud Console → API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 발급 →
        승인된 리디렉션 URI에 <code>${REDIRECT_URI}</code> 등록.</p>
      </body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('include_granted_scopes', 'true');

  return NextResponse.redirect(authUrl.toString(), { status: 302 });
}
