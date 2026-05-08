import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) throw new Error('Supabase 환경변수 미설정');
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('linkedin_tokens')
      .select('person_urn, expires_at, updated_at')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ connected: false, reason: 'no_token' });
    }

    const expired = new Date(data.expires_at) < new Date();
    return NextResponse.json({
      connected: !expired,
      expired,
      person_urn: data.person_urn,
      expires_at: data.expires_at,
      updated_at: data.updated_at,
    });
  } catch (e: unknown) {
    return NextResponse.json({ connected: false, reason: String(e) });
  }
}
