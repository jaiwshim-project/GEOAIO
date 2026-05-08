// GET /api/ai-citations/status?siteId=
// 최신 결과 요약 + 60일 추이 + 쿼리별 마지막 결과

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isPerplexityConfigured } from '@/lib/perplexity-client';

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
  if (!client) {
    return NextResponse.json({
      ok: true, siteId,
      perplexityConfigured: isPerplexityConfigured(),
      summary: { totalScans: 0, citedCount: 0, citationRate: 0, lastScanned: null },
      history: [], queryResults: [], queries: [],
    });
  }

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: results }, { data: queries }] = await Promise.all([
    client
      .from('ai_citation_results')
      .select('id, query, cited, cited_url, answer_excerpt, taken_at, is_mock, source')
      .eq('site_id', siteId)
      .gte('taken_at', since)
      .order('taken_at', { ascending: false })
      .limit(500),
    client
      .from('ai_citation_queries')
      .select('id, query, active')
      .eq('site_id', siteId)
      .eq('active', true)
      .order('created_at', { ascending: true }),
  ]);

  const rows = results || [];

  // 60일 추이: 날짜별 집계
  const byDate: Record<string, { total: number; cited: number }> = {};
  for (const r of rows) {
    const date = r.taken_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = { total: 0, cited: 0 };
    byDate[date].total++;
    if (r.cited) byDate[date].cited++;
  }
  const history = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v, rate: v.total > 0 ? Math.round((v.cited / v.total) * 100) : 0 }));

  // 쿼리별 마지막 결과
  const latestByQuery: Record<string, typeof rows[0]> = {};
  for (const r of rows) {
    if (!latestByQuery[r.query]) latestByQuery[r.query] = r;
  }
  const queryResults = Object.values(latestByQuery).map(r => ({
    query: r.query,
    cited: r.cited,
    citedUrl: r.cited_url,
    answerExcerpt: r.answer_excerpt,
    lastScanned: r.taken_at,
    isMock: r.is_mock,
  }));

  // 전체 요약
  const totalScans = rows.length;
  const citedCount = rows.filter(r => r.cited).length;

  return NextResponse.json({
    ok: true, siteId,
    perplexityConfigured: isPerplexityConfigured(),
    summary: {
      totalScans,
      citedCount,
      citationRate: totalScans > 0 ? Math.round((citedCount / totalScans) * 100) : 0,
      lastScanned: rows[0]?.taken_at || null,
    },
    history,
    queryResults,
    queries: queries || [],
  });
}
