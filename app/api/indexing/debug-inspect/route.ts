// 임시 진단 엔드포인트: GSC URL Inspection API의 원시 응답을 그대로 노출
// 사용: GET /api/indexing/debug-inspect?siteUrl=https://metabiz101.tistory.com/&url=https://metabiz101.tistory.com/1

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const siteUrl = req.nextUrl.searchParams.get('siteUrl');
  const inspectionUrl = req.nextUrl.searchParams.get('url');
  if (!siteUrl || !inspectionUrl) {
    return NextResponse.json({ error: 'siteUrl, url params required' }, { status: 400 });
  }

  const env = {
    hasClientId: !!process.env.GSC_CLIENT_ID,
    hasClientSecret: !!process.env.GSC_CLIENT_SECRET,
    hasRefreshToken: !!process.env.GSC_REFRESH_TOKEN,
  };

  // 1. access_token 발급
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GSC_CLIENT_ID || '',
      client_secret: process.env.GSC_CLIENT_SECRET || '',
      refresh_token: process.env.GSC_REFRESH_TOKEN || '',
      grant_type: 'refresh_token',
    }),
  });
  const tokenStatus = tokenRes.status;
  const tokenBody = await tokenRes.text();
  if (!tokenRes.ok) {
    return NextResponse.json({ env, step: 'token', tokenStatus, tokenBody });
  }
  const { access_token } = JSON.parse(tokenBody) as { access_token: string };

  // 2. URL Inspection 호출
  const inspectRes = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: 'ko-KR' }),
  });
  const inspectStatus = inspectRes.status;
  const inspectBody = await inspectRes.text();

  // 3. (옵션) 등록된 사이트 목록 조회
  const sitesRes = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const sitesBody = await sitesRes.text();

  return NextResponse.json({
    env,
    siteUrl,
    inspectionUrl,
    tokenStatus,
    inspectStatus,
    inspectBody: tryJson(inspectBody),
    sitesStatus: sitesRes.status,
    sitesBody: tryJson(sitesBody),
  });
}

function tryJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}
