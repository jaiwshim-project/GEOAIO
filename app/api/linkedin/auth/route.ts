import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'LINKEDIN_CLIENT_ID 환경변수 미설정. Vercel 대시보드에서 추가하세요.' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/linkedin/callback`,
    scope: 'w_member_social r_profile_basicinfo',
    state: 'geoaio-linkedin-auth',
  });

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params}`
  );
}
