// GET  /api/indexing/sites        — 커스텀 사이트 목록 조회
// POST /api/indexing/sites        — 새 사이트 등록
// DELETE /api/indexing/sites?id=  — 사이트 삭제

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const db = getClient();
  if (!db) return NextResponse.json({ ok: true, sites: [] });

  const { data, error } = await db
    .from('indexing_custom_sites')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, sites: data || [] });
}

export async function POST(req: NextRequest) {
  const db = getClient();
  if (!db) return NextResponse.json({ error: 'Supabase 미구성' }, { status: 503 });

  const body = await req.json();
  const { id, label, domain, description, site_url, sitemap_url, category_map, color, emoji } = body;

  if (!id || !label || !domain || !site_url || !sitemap_url) {
    return NextResponse.json({ error: '필수 필드 누락 (id, label, domain, site_url, sitemap_url)' }, { status: 400 });
  }

  const { data, error } = await db
    .from('indexing_custom_sites')
    .upsert({
      id,
      label,
      domain,
      description: description || '',
      site_url,
      sitemap_url,
      category_map: category_map || null,
      color: color || 'cyan',
      emoji: emoji || '🌐',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, site: data });
}

export async function DELETE(req: NextRequest) {
  const db = getClient();
  if (!db) return NextResponse.json({ error: 'Supabase 미구성' }, { status: 503 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await db.from('indexing_custom_sites').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
