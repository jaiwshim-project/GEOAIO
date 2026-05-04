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
// 주의: Supabase는 max-rows 1000 기본값이라 단일 limit() 호출로는 1,001번째 글부터 빠짐.
// 또한 'published' 컬럼이 DB에 없어 .eq('published', true) 필터를 걸면 0건 반환.
// → 페이지네이션 + published 필터 제거로 모든 글 정확히 수집.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const PAGE_SIZE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let page = 0; page < 50; page++) { // 최대 50,000건 안전 가드
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = getSupabase()
      .from('blog_articles')
      .select('id, title, content, category, tag, hashtags, target_keyword, created_at, updated_at, author')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  // 클라이언트 호환을 위해 summary·published 가상 필드 추가 (DB에는 없음)
  const posts = all.map(r => ({
    id: r.id,
    title: r.title,
    summary: '', // metadata에 있을 수 있으나 list에는 불필요
    category: r.category,
    tag: r.tag,
    hashtags: r.hashtags,
    target_keyword: r.target_keyword,
    published: true,
    created_at: r.created_at,
    updated_at: r.updated_at,
    author: r.author,
  }));

  return NextResponse.json({ posts });
}

// === 카테고리 검증 ===
// 발행 시 category 필드에 들어가서는 안 되는 값들:
//   1) ContentCategory enum (콘텐츠 형식 — 'blog'/'product'/'faq' 등)이 카테고리로 들어가는 건 폴백 버그
//   2) 빈 문자열·undefined·null 류
//   3) 형식 위반(과도한 길이, 허용되지 않는 문자)
// 새 카테고리 생성 자체는 허용 — '의도된 폴백 실수'만 차단.
const FORBIDDEN_CATEGORY_VALUES = new Set([
  'blog', 'product', 'faq', 'howto', 'landing', 'technical', 'social', 'email', 'case', 'video',
  'undefined', 'null', '', 'autopilot', '__fallback__', 'fallback',
]);
function validateCategory(raw: unknown): { ok: true; value: string } | { ok: false; reason: string } {
  if (typeof raw !== 'string') return { ok: false, reason: 'category must be a string' };
  const v = raw.trim();
  if (!v) return { ok: false, reason: 'category is empty' };
  if (FORBIDDEN_CATEGORY_VALUES.has(v.toLowerCase())) {
    return { ok: false, reason: `category "${v}" is a reserved/fallback value (likely a bug — selectedBlogCategory was not set)` };
  }
  if (v.length < 2 || v.length > 80) return { ok: false, reason: `category length must be 2-80 chars (got ${v.length})` };
  // 한글·영숫자·하이픈·공백·일부 구분자만 허용
  // 허용: 글자, 숫자, 일반 문장 부호 (-_.,·:()/?! 공백) — 슬러그화된 프로젝트명 호환
  if (!/^[\p{L}\p{N}\-_·.,:()?!\s/]+$/u.test(v)) return { ok: false, reason: `category contains invalid characters: "${v}"` };
  return { ok: true, value: v };
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

    // 카테고리 검증 — 잘못된 값 1건이라도 있으면 전체 거부 (배치 일관성)
    const invalidIdx: { idx: number; reason: string; rawCategory: unknown; title: unknown }[] = [];
    items.forEach((item, idx) => {
      const result = validateCategory(item.category);
      if (!result.ok) invalidIdx.push({ idx, reason: result.reason, rawCategory: item.category, title: item.title });
    });
    if (invalidIdx.length > 0) {
      console.warn('[blog/posts] category 검증 실패 — 발행 거부', invalidIdx);
      return NextResponse.json(
        {
          error: 'category 검증 실패',
          details: invalidIdx.map(e => `[${e.idx}] ${e.reason} (title="${String(e.title).slice(0, 50)}")`),
          hint: '클라이언트에서 selectedBlogCategory를 명시적으로 선택하지 않은 채 발행 시 발생합니다. 카테고리를 선택한 뒤 다시 시도하세요.',
        },
        { status: 422 }
      );
    }

    const rows = items.map((item: Record<string, unknown>) => ({
      title: item.title as string,
      content: item.content as string,
      summary: (item.summary as string) || '',
      // category는 위에서 검증됨 — 폴백 'geo-aio' 제거 (잘못된 폴백을 방지)
      category: (item.category as string).trim(),
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
