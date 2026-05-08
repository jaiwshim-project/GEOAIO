import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) throw new Error('Supabase 환경변수 미설정');
  return createClient(url, key);
}

function redirectToDashboard(param: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';
  return NextResponse.redirect(`${base}/backlink/dashboard?${param}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return redirectToDashboard(`linkedin_error=${encodeURIComponent(error || 'no_code')}`);
  }

  // 인가 코드 → 액세스 토큰 교환
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error('[LinkedIn callback] 토큰 교환 실패:', tokenData);
    return redirectToDashboard('linkedin_error=token_failed');
  }

  // 사용자 ID 조회 (OpenID Connect — sub 필드가 숫자 memberID)
  const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  const personId = userData.sub;
  // LinkedIn UGC Posts API는 urn:li:member:숫자ID 형식 요구
  const personUrn = `urn:li:member:${personId}`;

  // Supabase에 토큰 저장 (id=1 고정 — 단일 사용자)
  const supabase = getAdminClient();
  const { error: upsertError } = await supabase.from('linkedin_tokens').upsert({
    id: 1,
    access_token: tokenData.access_token,
    person_urn: personUrn,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error('[LinkedIn callback] 토큰 저장 실패:', upsertError);
    return redirectToDashboard('linkedin_error=save_failed');
  }

  return redirectToDashboard('linkedin_ok=1');
}
