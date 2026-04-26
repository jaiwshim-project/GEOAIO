import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsOptionsResponse();
}

interface EnqueueBody {
  blogArticleId: string;
  title?: string;
  sceneSentence?: string;
  cepKeyword?: string;
  searchPath?: string[];
}

/**
 * CEP 측정 큐 등록 endpoint.
 * 어느 클라이언트/서버 발행 경로에서 호출되어도 service role로 cep_ab_targets에 안전하게 INSERT.
 * lib/supabase-storage.ts의 saveBlogPost가 INSERT 직후 fire-and-forget으로 호출.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<EnqueueBody>;

    if (!body?.blogArticleId) {
      return withCors(
        NextResponse.json(
          { ok: false, reason: 'blogArticleId required' },
          { status: 400 }
        )
      );
    }
    if (!body.sceneSentence && !body.cepKeyword) {
      // CEP 데이터 없으면 조용히 skip (에러 아님)
      return withCors(NextResponse.json({ ok: true, skipped: 'no_cep_data' }));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

    if (!supabaseUrl || !serviceKey) {
      return withCors(
        NextResponse.json(
          { ok: false, reason: 'supabase_env_missing' },
          { status: 500 }
        )
      );
    }

    const supa = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';
    const url = `${baseUrl.replace(/\/$/, '')}/blog/${body.blogArticleId}`;

    const sceneSnippet = body.sceneSentence ? body.sceneSentence.slice(0, 30) : '';
    const titleSnippet = body.title ? body.title.slice(0, 30) : '';
    const query = body.cepKeyword || sceneSnippet || titleSnippet || 'cep query';
    const pairId = `blog-${body.blogArticleId}-${Date.now()}`;

    const { error } = await supa.from('cep_ab_targets').insert({
      pair_id: pairId,
      query,
      applied_url: url,
      applied_text_match: titleSnippet || null,
      blog_article_id: body.blogArticleId,
      engines: ['perplexity', 'chatgpt_search'],
      active: true,
    });

    if (error) {
      console.error('[CEP enqueue] insert error:', error);
      // pair_id unique violation은 OK (이미 등록됨)
      const isDup = (error.code === '23505') || /duplicate/i.test(error.message);
      if (isDup) {
        return withCors(NextResponse.json({ ok: true, duplicate: true, pair_id: pairId }));
      }
      return withCors(
        NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      );
    }

    return withCors(NextResponse.json({ ok: true, pair_id: pairId }));
  } catch (e) {
    console.error('[CEP enqueue] unexpected error:', e);
    return withCors(
      NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        { status: 500 }
      )
    );
  }
}
