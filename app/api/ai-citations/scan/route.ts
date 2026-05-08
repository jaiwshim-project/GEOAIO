// POST /api/ai-citations/scan
// body: { siteId, domain, queries?: string[] }
// Perplexity sonar로 각 쿼리를 검색하고 도메인 인용 여부를 기록

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryCitations, isPerplexityConfigured } from '@/lib/perplexity-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const { siteId, domain, queries } = await req.json();
  if (!siteId || !domain) return NextResponse.json({ error: 'siteId, domain 필수' }, { status: 400 });

  const client = db();

  // DB에서 저장된 쿼리 로드 (없으면 전달받은 queries 사용)
  let scanQueries: string[] = queries || [];
  if (scanQueries.length === 0 && client) {
    const { data } = await client
      .from('ai_citation_queries')
      .select('query')
      .eq('site_id', siteId)
      .eq('active', true)
      .limit(5);
    scanQueries = (data || []).map((r: { query: string }) => r.query);
  }
  if (scanQueries.length === 0) {
    return NextResponse.json({ error: '스캔할 쿼리가 없습니다. 먼저 쿼리를 추가하세요.' }, { status: 400 });
  }

  // 최대 5개 제한 (Vercel timeout 방지)
  const limited = scanQueries.slice(0, 5);
  const takenAt = new Date().toISOString();
  const results = [];

  for (const query of limited) {
    try {
      const result = await queryCitations(query, domain);
      results.push({ query, ...result, takenAt });

      if (client) {
        await client.from('ai_citation_results').insert({
          site_id: siteId,
          query,
          source: 'perplexity',
          taken_at: takenAt,
          cited: result.cited,
          cited_url: result.citedUrl,
          answer_excerpt: result.answerExcerpt,
          all_citations: result.allCitations,
          is_mock: result.isMock || false,
        });
      }
    } catch (e) {
      results.push({ query, cited: false, error: e instanceof Error ? e.message : 'unknown', takenAt });
    }
  }

  const citedCount = results.filter(r => r.cited).length;
  return NextResponse.json({
    ok: true,
    siteId,
    perplexityConfigured: isPerplexityConfigured(),
    scanned: results.length,
    cited: citedCount,
    citationRate: results.length > 0 ? Math.round((citedCount / results.length) * 100) : 0,
    results,
  });
}
