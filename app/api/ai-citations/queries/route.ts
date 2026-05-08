// GET  /api/ai-citations/queries?siteId=  — 사이트의 쿼리 목록
// POST /api/ai-citations/queries          — 쿼리 추가
// DELETE /api/ai-citations/queries?id=   — 쿼리 삭제

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId');
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });
  const client = db();
  if (!client) return NextResponse.json({ ok: true, queries: [] });
  const { data, error } = await client
    .from('ai_citation_queries')
    .select('*')
    .eq('site_id', siteId)
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, queries: data || [] });
}

export async function POST(req: NextRequest) {
  const client = db();
  if (!client) return NextResponse.json({ error: 'Supabase 미구성' }, { status: 503 });
  const { siteId, query } = await req.json();
  if (!siteId || !query) return NextResponse.json({ error: 'siteId, query 필수' }, { status: 400 });
  const { data, error } = await client
    .from('ai_citation_queries')
    .insert({ site_id: siteId, query, active: true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, query: data });
}

export async function DELETE(req: NextRequest) {
  const client = db();
  if (!client) return NextResponse.json({ error: 'Supabase 미구성' }, { status: 503 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await client.from('ai_citation_queries').update({ active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
