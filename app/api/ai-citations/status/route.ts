// GET /api/ai-citations/status?siteId=
// 소스별(perplexity/chatgpt) 최신 결과 + 60일 추이 + 쿼리별 결과

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isPerplexityConfigured } from '@/lib/perplexity-client';
import { isChatGptConfigured } from '@/lib/chatgpt-client';

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
  const empty = {
    ok: true, siteId,
    perplexityConfigured: isPerplexityConfigured(),
    chatgptConfigured: isChatGptConfigured(),
    summary: {
      perplexity: { totalScans: 0, citedCount: 0, citationRate: 0 },
      chatgpt: { totalScans: 0, mentionedCount: 0, mentionRate: 0, recommendedCount: 0 },
      lastScanned: null,
    },
    history: [], queryResults: [], queries: [],
  };

  if (!client) return NextResponse.json(empty);

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: results }, { data: queries }] = await Promise.all([
    client
      .from('ai_citation_results')
      .select('id, query, source, cited, cited_url, answer_excerpt, taken_at, is_mock, raw')
      .eq('site_id', siteId)
      .gte('taken_at', since)
      .order('taken_at', { ascending: false })
      .limit(1000),
    client
      .from('ai_citation_queries')
      .select('id, query, active')
      .eq('site_id', siteId)
      .eq('active', true)
      .order('created_at', { ascending: true }),
  ]);

  const rows = results || [];
  const plexRows = rows.filter(r => r.source === 'perplexity');
  const gptRows = rows.filter(r => r.source === 'chatgpt');

  // 60일 추이: 날짜별 소스 구분 집계
  const byDate: Record<string, { perplexity_cited: number; perplexity_total: number; chatgpt_mentioned: number; chatgpt_total: number }> = {};
  for (const r of rows) {
    const date = r.taken_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = { perplexity_cited: 0, perplexity_total: 0, chatgpt_mentioned: 0, chatgpt_total: 0 };
    if (r.source === 'perplexity') {
      byDate[date].perplexity_total++;
      if (r.cited) byDate[date].perplexity_cited++;
    } else if (r.source === 'chatgpt') {
      byDate[date].chatgpt_total++;
      if (r.cited) byDate[date].chatgpt_mentioned++;
    }
  }
  const history = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      perplexity_rate: v.perplexity_total > 0 ? Math.round((v.perplexity_cited / v.perplexity_total) * 100) : 0,
      chatgpt_rate: v.chatgpt_total > 0 ? Math.round((v.chatgpt_mentioned / v.chatgpt_total) * 100) : 0,
      ...v,
    }));

  // 쿼리별 마지막 결과 (소스별)
  const latestByQuerySource: Record<string, typeof rows[0]> = {};
  for (const r of rows) {
    const key = `${r.query}__${r.source}`;
    if (!latestByQuerySource[key]) latestByQuerySource[key] = r;
  }

  // 쿼리 목록으로 집계
  const queryMap: Record<string, { query: string; perplexity?: typeof rows[0]; chatgpt?: typeof rows[0] }> = {};
  for (const [key, r] of Object.entries(latestByQuerySource)) {
    const [query, source] = key.split('__');
    if (!queryMap[query]) queryMap[query] = { query };
    if (source === 'perplexity') queryMap[query].perplexity = r;
    if (source === 'chatgpt') queryMap[query].chatgpt = r;
  }
  const queryResults = Object.values(queryMap).map(q => ({
    query: q.query,
    perplexity: q.perplexity ? {
      cited: q.perplexity.cited,
      citedUrl: q.perplexity.cited_url,
      answerExcerpt: q.perplexity.answer_excerpt,
      lastScanned: q.perplexity.taken_at,
      isMock: q.perplexity.is_mock,
    } : null,
    chatgpt: q.chatgpt ? {
      mentioned: q.chatgpt.cited,
      recommended: (q.chatgpt.raw as Record<string, unknown>)?.recommended || false,
      mentionExcerpt: (q.chatgpt.raw as Record<string, unknown>)?.mentionExcerpt || '',
      answerExcerpt: q.chatgpt.answer_excerpt,
      lastScanned: q.chatgpt.taken_at,
      isMock: q.chatgpt.is_mock,
    } : null,
  }));

  const lastScanned = rows[0]?.taken_at || null;

  return NextResponse.json({
    ok: true, siteId,
    perplexityConfigured: isPerplexityConfigured(),
    chatgptConfigured: isChatGptConfigured(),
    summary: {
      perplexity: {
        totalScans: plexRows.length,
        citedCount: plexRows.filter(r => r.cited).length,
        citationRate: plexRows.length > 0 ? Math.round((plexRows.filter(r => r.cited).length / plexRows.length) * 100) : 0,
      },
      chatgpt: {
        totalScans: gptRows.length,
        mentionedCount: gptRows.filter(r => r.cited).length,
        mentionRate: gptRows.length > 0 ? Math.round((gptRows.filter(r => r.cited).length / gptRows.length) * 100) : 0,
        recommendedCount: gptRows.filter(r => (r.raw as Record<string, unknown>)?.recommended).length,
      },
      lastScanned,
    },
    history,
    queryResults,
    queries: queries || [],
  });
}
