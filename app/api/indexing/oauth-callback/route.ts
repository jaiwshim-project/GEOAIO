// GET /api/indexing/oauth-callback?code=...
// Google OAuth 동의 후 redirect_uri로 호출되는 콜백.
// 인증 코드 → refresh_token 교환 → 사용자에게 안전하게 표시 (HTML 페이지)
//
// 사용자는 표시된 refresh_token 을 복사해서 Vercel 환경변수 GSC_REFRESH_TOKEN 으로 등록하면 됨.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const REDIRECT_URI = 'https://www.geo-aio.com/api/indexing/oauth-callback';

function htmlPage(body: string, status = 200) {
  return new NextResponse(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><title>GSC OAuth Callback</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
h1 { font-size: 22px; margin: 0 0 12px; }
.box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 16px 0; }
.token { word-break: break-all; font-family: ui-monospace, "SF Mono", Monaco, monospace; font-size: 13px; background: #1f2937; color: #fbbf24; padding: 14px; border-radius: 8px; user-select: all; }
.ok { color: #047857; }
.err { color: #b91c1c; }
.warn { background: #fef3c7; border-color: #fbbf24; }
.cmd { background: #0f172a; color: #e2e8f0; padding: 10px 14px; border-radius: 6px; font-family: ui-monospace, monospace; font-size: 13px; overflow-x: auto; }
button { background: #4f46e5; color: white; border: 0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
button:hover { background: #4338ca; }
ol li { margin: 8px 0; }
</style></head><body>${body}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return htmlPage(`
      <h1 class="err">❌ OAuth 인증 거부됨</h1>
      <div class="box">
        <p>오류: <code>${error}</code></p>
        <p>다시 시도하려면 동의 URL을 클릭하세요.</p>
      </div>
    `, 400);
  }

  if (!code) {
    return htmlPage(`
      <h1>GSC OAuth 콜백 엔드포인트</h1>
      <div class="box">
        <p>이 페이지는 Google OAuth 동의 후 자동 호출됩니다.</p>
        <p>직접 방문한 경우 동의 URL부터 시작하세요.</p>
      </div>
    `);
  }

  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return htmlPage(`
      <h1 class="err">❌ 환경변수 미설정</h1>
      <div class="box">
        <p>Vercel에 <code>GSC_CLIENT_ID</code>·<code>GSC_CLIENT_SECRET</code> 등록 후 재배포 필요.</p>
      </div>
    `, 500);
  }

  // 코드 → refresh_token 교환
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return htmlPage(`
      <h1 class="err">❌ 토큰 교환 실패</h1>
      <div class="box">
        <p>HTTP ${tokenRes.status}</p>
        <pre class="cmd">${errText.replace(/</g, '&lt;')}</pre>
        <p class="warn box">흔한 원인: 코드 만료(10분) · 재사용 · CLIENT_ID/SECRET 불일치 · redirect_uri 불일치</p>
      </div>
    `, 502);
  }

  const tokens = await tokenRes.json() as { access_token: string; refresh_token?: string; scope?: string; expires_in?: number };

  if (!tokens.refresh_token) {
    return htmlPage(`
      <h1 class="err">❌ refresh_token 누락</h1>
      <div class="box">
        <p>응답에 refresh_token이 없습니다. 동의 URL에 <code>access_type=offline&prompt=consent</code> 가 포함되어 있는지 확인하세요.</p>
        <p>또는 이미 한 번 동의한 계정인 경우, <a href="https://myaccount.google.com/permissions" target="_blank">Google 권한 페이지</a>에서 앱 권한을 제거 후 재시도.</p>
        <p>응답:</p>
        <pre class="cmd">${JSON.stringify(tokens, null, 2)}</pre>
      </div>
    `, 502);
  }

  const rt = tokens.refresh_token;

  return htmlPage(`
    <h1 class="ok">✅ OAuth 인증 성공</h1>

    <div class="box">
      <p><strong>아래 refresh_token 값을 복사해서 Vercel 환경변수 <code>GSC_REFRESH_TOKEN</code> 으로 등록하세요.</strong></p>
      <p>이 값은 영구 사용 가능하며, 표시는 이번 한 번뿐입니다.</p>
    </div>

    <div class="token" id="token">${rt}</div>
    <p style="text-align:center;margin:8px 0;">
      <button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent.trim()); this.textContent='복사됨!'">📋 복사</button>
    </p>

    <h3>다음 단계 — 자동 등록 (추천)</h3>
    <div class="box">
      <p>채팅창에 위 토큰을 알려주시면 Vercel 자동 등록·재배포·검증을 진행합니다.</p>
      <p>또는 본인 PC에서 직접 등록:</p>
      <pre class="cmd">echo "${rt}" | vercel env add GSC_REFRESH_TOKEN production
vercel deploy --prod --yes</pre>
    </div>

    <h3>발급된 권한 정보</h3>
    <div class="box">
      <p>Scope: <code>${(tokens.scope || '').replace(/</g, '&lt;')}</code></p>
      <p>Access token TTL: ${tokens.expires_in || '?'}초 (자동 갱신됨)</p>
    </div>

    <p class="warn box" style="font-size:13px;">
      ⚠️ refresh_token이 노출되면 즉시 <a href="https://myaccount.google.com/permissions" target="_blank">권한 페이지</a>에서 앱 권한 철회 후 재발급하세요.
    </p>
  `);
}
