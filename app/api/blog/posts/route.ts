import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

function getServiceRoleSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // 서비스 롤 키가 없으면 anon으로 폴백 (insert RLS는 cep_ab_targets 정책에 따름)
  return createClient(supabaseUrl, serviceKey || supabaseKey);
}

// === CEP 자동 측정 큐 등록 (실패해도 발행은 막지 않음) ===
async function enqueueCepMeasurement(post: {
  id?: string;
  title?: string;
  metadata?: { cep?: { sceneSentence?: string; cepKeyword?: string; searchPath?: string[] } } | null;
}) {
  const cep = post.metadata?.cep;
  if (!cep || (!cep.sceneSentence && !cep.cepKeyword)) return; // CEP 없으면 스킵
  if (!post.id) return;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';
  const url = `${baseUrl.replace(/\/$/, '')}/blog/${post.id}`;

  // 측정 쿼리: cepKeyword 우선, 없으면 sceneSentence 첫 30자
  const query = cep.cepKeyword || (cep.sceneSentence ? cep.sceneSentence.slice(0, 30) : post.title || '');
  if (!query) return;
  const pairId = `blog-${post.id}-${Date.now()}`;
  const textMatch = (post.title || '').slice(0, 30);

  try {
    const supa = getServiceRoleSupabase();
    await supa.from('cep_ab_targets').insert({
      pair_id: pairId,
      query,
      applied_url: url,
      applied_text_match: textMatch || null,
      skipped_url: null,
      blog_article_id: post.id,
      engines: ['perplexity', 'chatgpt_search'],
      active: true,
    });
    console.log(`[CEP] Enqueued measurement target: ${pairId}`);
  } catch (e) {
    console.error('[CEP] Failed to enqueue measurement target:', e);
  }
}

// GET: 블로그 포스트 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = getSupabase()
    .from('blog_articles')
    .select('id, title, summary, category, tag, hashtags, target_keyword, published, created_at, updated_at')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.limit(10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data || [] });
}

// POST: 블로그 포스트 생성 (단건/복수)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts, post } = body as { posts?: Record<string, unknown>[]; post?: Record<string, unknown> };

    const items = posts || (post ? [post] : []);
    if (items.length === 0) {
      return NextResponse.json({ error: '포스트 데이터가 필요합니다.' }, { status: 400 });
    }

    const rows = items.map((item: Record<string, unknown>) => ({
      title: item.title as string,
      content: item.content as string,
      summary: (item.summary as string) || '',
      category: (item.category as string) || 'geo-aio',
      tag: (item.tag as string) || '',
      hashtags: (item.hashtags as string[]) || [],
      metadata: (item.metadata as Record<string, unknown>) || {},
      target_keyword: (item.targetKeyword as string) || '',
      history_id: (item.historyId as string) || '',
      published: true,
      user_id: item.userId as string || null,
    }));

    const { data, error } = await getSupabase()
      .from('blog_articles')
      .insert(rows)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // CEP 자동 측정 큐 등록 (fire-and-forget — 응답을 막지 않음)
    const insertedIds = (data || []).map(r => r.id);
    insertedIds.forEach((insertedId, idx) => {
      const src = items[idx] as Record<string, unknown> | undefined;
      if (!src) return;
      enqueueCepMeasurement({
        id: insertedId as string,
        title: src.title as string | undefined,
        metadata: (src.metadata as { cep?: { sceneSentence?: string; cepKeyword?: string; searchPath?: string[] } } | null) || null,
      }).catch(() => {});
    });

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      ids: insertedIds,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
