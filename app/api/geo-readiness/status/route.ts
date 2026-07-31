// GET /api/geo-readiness/status?siteId=geo-aio-blog
// 최신 스냅샷 + 60일 추이 + 페이지별 결과를 반환. Supabase 미구성 시 빈 상태 반환.

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

  const empty = {
    ok: true,
    siteId,
    configured: false,
    llmConfigured: !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
    latest: null,
    pages: [],
    history: [],
  };

  const client = db();
  if (!client) return NextResponse.json(empty);

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: snaps, error }, { data: hist }] = await Promise.all([
    client
      .from('geo_readiness_snapshots')
      .select('*')
      .eq('site_id', siteId)
      .order('taken_at', { ascending: false })
      .limit(1),
    client
      .from('geo_readiness_snapshots')
      .select('taken_at, avg_score, avg_content_score, avg_technical_score, pages_scanned')
      .eq('site_id', siteId)
      .gte('taken_at', since)
      .order('taken_at', { ascending: true }),
  ]);

  // 테이블 미생성(42P01) 등 — 대시보드는 빈 상태로 열리게 한다
  if (error) {
    return NextResponse.json({ ...empty, configured: true, schemaError: error.message });
  }

  const latest = snaps?.[0] ?? null;
  let pages: unknown[] = [];
  if (latest?.id) {
    const { data } = await client
      .from('geo_readiness_pages')
      .select('url, score, verdict, content_score, technical_score, checks, strengths, weaknesses, meta')
      .eq('snapshot_id', latest.id)
      .order('score', { ascending: true });
    pages = data || [];
  }

  return NextResponse.json({
    ok: true,
    siteId,
    configured: true,
    llmConfigured: !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
    latest,
    pages,
    history: (hist || []).map(h => ({
      date: h.taken_at.slice(0, 10),
      avg_score: h.avg_score,
      content: h.avg_content_score,
      technical: h.avg_technical_score,
      pages: h.pages_scanned,
    })),
  });
}
