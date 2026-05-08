// POST /api/ai-citations/scan
// body: { siteId, domain, brandName?, sources?: ('perplexity'|'chatgpt')[], queries?: string[] }
// 선택된 AI 소스로 각 쿼리를 검색하고 인용/언급 여부를 기록

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryCitations, isPerplexityConfigured } from '@/lib/perplexity-client';
import { queryChatGptMention, isChatGptConfigured } from '@/lib/chatgpt-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const { siteId, domain, brandName = '', sources, queries } = await req.json();
  if (!siteId || !domain) return NextResponse.json({ error: 'siteId, domain 필수' }, { status: 400 });

  const activeSources: ('perplexity' | 'chatgpt')[] = sources || ['perplexity', 'chatgpt'];
  const client = db();

  // DB에서 저장된 쿼리 로드
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

  const limited = scanQueries.slice(0, 5);
  const takenAt = new Date().toISOString();
  const results: Record<string, unknown>[] = [];

  for (const query of limited) {
    // Perplexity
    if (activeSources.includes('perplexity')) {
      try {
        const r = await queryCitations(query, domain);
        results.push({ source: 'perplexity', query, cited: r.cited, citedUrl: r.citedUrl, answerExcerpt: r.answerExcerpt, isMock: r.isMock });
        if (client) {
          await client.from('ai_citation_results').insert({
            site_id: siteId, query, source: 'perplexity', taken_at: takenAt,
            cited: r.cited, cited_url: r.citedUrl, answer_excerpt: r.answerExcerpt,
            all_citations: r.allCitations, is_mock: r.isMock || false,
          });
        }
      } catch (e) {
        results.push({ source: 'perplexity', query, cited: false, error: e instanceof Error ? e.message : 'unknown' });
      }
    }

    // ChatGPT
    if (activeSources.includes('chatgpt')) {
      try {
        const r = await queryChatGptMention(query, domain, brandName);
        results.push({ source: 'chatgpt', query, cited: r.mentioned, recommended: r.recommended, mentionExcerpt: r.mentionExcerpt, answerExcerpt: r.answerExcerpt, isMock: r.isMock });
        if (client) {
          await client.from('ai_citation_results').insert({
            site_id: siteId, query, source: 'chatgpt', taken_at: takenAt,
            cited: r.mentioned,
            cited_url: null,
            answer_excerpt: r.answerExcerpt,
            all_citations: r.recommended ? ['recommended'] : [],
            is_mock: r.isMock || false,
            raw: { recommended: r.recommended, mentionExcerpt: r.mentionExcerpt },
          });
        }
      } catch (e) {
        results.push({ source: 'chatgpt', query, cited: false, error: e instanceof Error ? e.message : 'unknown' });
      }
    }
  }

  const perplexityResults = results.filter(r => r.source === 'perplexity');
  const chatgptResults = results.filter(r => r.source === 'chatgpt');

  return NextResponse.json({
    ok: true,
    siteId,
    perplexityConfigured: isPerplexityConfigured(),
    chatgptConfigured: isChatGptConfigured(),
    results,
    summary: {
      perplexity: {
        scanned: perplexityResults.length,
        cited: perplexityResults.filter(r => r.cited).length,
      },
      chatgpt: {
        scanned: chatgptResults.length,
        mentioned: chatgptResults.filter(r => r.cited).length,
        recommended: chatgptResults.filter(r => r.recommended).length,
      },
    },
  });
}
