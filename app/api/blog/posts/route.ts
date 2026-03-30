import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
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

  const { data, error } = await query.limit(200);

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

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      ids: (data || []).map(r => r.id),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
