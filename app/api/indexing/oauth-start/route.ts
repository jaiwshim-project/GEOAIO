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

export async function GET(req: NextRequest) {
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

  // ?debug=1 → redirect 대신 진단 정보를 HTML로 표시 (redirect_uri_mismatch 디버깅용)
  if (req.nextUrl.searchParams.get('debug') === '1') {
    const cidMasked = clientId.length > 10 ? `${clientId.slice(0, 12)}...${clientId.slice(-8)}` : clientId;
    return new NextResponse(
      `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><title>OAuth Debug</title>
      <style>body{font-family:system-ui;max-width:760px;margin:40px auto;padding:0 20px;color:#1f2937;line-height:1.55}
      h1{font-size:22px;margin:0 0 16px;color:#b45309}
      h2{font-size:16px;margin:24px 0 8px}
      .uri{background:#0f172a;color:#fbbf24;padding:14px;border-radius:8px;font-family:ui-monospace,Menlo,monospace;font-size:14px;word-break:break-all;user-select:all;border:2px solid #f59e0b}
      .box{background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:16px;margin:12px 0}
      ol li{margin:8px 0}
      code{background:#fde68a;padding:2px 6px;border-radius:4px;font-size:13px}
      .copy{background:#4f46e5;color:white;border:0;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;margin-top:8px}
      </style></head><body>
      <h1>🔍 OAuth Debug — redirect_uri_mismatch 진단</h1>
      <h2>1. 우리가 Google에 보내는 redirect_uri (이 값이 Google Cloud Console에 정확히 등록돼야 함)</h2>
      <div class="uri" id="uri">${REDIRECT_URI}</div>
      <button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('uri').textContent.trim());this.textContent='✓ 복사됨'">📋 정확한 값 복사</button>
      <h2>2. 우리가 사용하는 GSC_CLIENT_ID (앞 12자만 표시)</h2>
      <div class="uri">${cidMasked}</div>
      <h2>3. Google Cloud Console에서 확인할 항목</h2>
      <div class="box">
        <ol>
          <li><a href="https://console.cloud.google.com/apis/credentials" target="_blank">https://console.cloud.google.com/apis/credentials</a> 접속</li>
          <li>좌측 상단 <strong>프로젝트 선택기</strong>에서 OAuth를 만든 프로젝트로 전환 (잘못된 프로젝트면 클라이언트 ID가 안 보임)</li>
          <li>"OAuth 2.0 클라이언트 ID" 섹션에서 위의 ID 앞부분 <code>${cidMasked.split('...')[0]}</code>과 일치하는 클라이언트 클릭</li>
          <li>편집(연필 ✏️) 클릭 → "승인된 리디렉션 URI" 섹션 확인</li>
          <li>위 1번의 URI를 <strong>한 글자도 빠짐없이</strong> 복사해 추가 (앞뒤 공백·줄바꿈·http vs https·www 유무·끝 슬래시 모두 일치해야 함)</li>
          <li>하단 <strong>저장</strong> 클릭</li>
          <li><strong>5분 대기</strong> (Google 변경 전파 시간) 후 <a href="/api/indexing/oauth-start">/api/indexing/oauth-start</a> 재시도</li>
        </ol>
      </div>
      <h2>4. 자주 하는 실수</h2>
      <div class="box">
        <ul>
          <li><strong>다른 프로젝트의 OAuth 클라이언트 편집</strong> — 좌측 상단 프로젝트 선택기 확인</li>
          <li><strong>리디렉션 URI 칸이 비어있음</strong> — "+ URI 추가" 클릭 후 텍스트박스에 직접 입력했는지 확인</li>
          <li><strong>http:// vs https://</strong> — https 필수</li>
          <li><strong>www. 누락</strong> — <code>geo-aio.com</code>이 아니라 <code>www.geo-aio.com</code></li>
          <li><strong>끝에 슬래시(/)</strong> — 끝에 슬래시 없어야 함</li>
          <li><strong>보내는 URL과 등록 URL 모두 root 라우트로 등록</strong> — 와일드카드 미지원</li>
        </ul>
      </div>
      <h2>5. 정상이라고 판단되면</h2>
      <p><a href="/api/indexing/oauth-start" style="display:inline-block;padding:10px 20px;background:#10b981;color:white;border-radius:8px;text-decoration:none;font-weight:600">▶ 이제 인증 시작</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  return NextResponse.redirect(authUrl.toString(), { status: 302 });
}
