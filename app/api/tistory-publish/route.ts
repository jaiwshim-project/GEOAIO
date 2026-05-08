import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) throw new Error('Supabase 환경변수 미설정');
  return createClient(url, key);
}

// 큐 항목 타입
interface QueueItem {
  blog_name: string;
  category_slug: string;
  post_no: number;
  scheduled_date: string;
  title: string;
  body: string;
  tags: string[];
  tistory_category: string;
}

// POST: 포스트를 발행 큐에 추가 (upsert)
export async function POST(req: NextRequest) {
  try {
    const body: QueueItem | QueueItem[] = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const supabase = getAdminClient();

    const rows = items.map(item => ({
      blog_name: item.blog_name || 'axbiz',
      category_slug: item.category_slug,
      post_no: item.post_no,
      scheduled_date: item.scheduled_date,
      title: item.title,
      body: item.body,
      tags: item.tags || [],
      tistory_category: item.tistory_category || '1. AX 비즈',
      status: 'pending',
    }));

    const { data, error } = await supabase
      .from('tistory_publish_queue')
      .upsert(rows, { onConflict: 'blog_name,category_slug,post_no', ignoreDuplicates: false })
      .select('id, category_slug, post_no, status');

    if (error) throw error;
    return NextResponse.json({ ok: true, queued: data?.length ?? 0, items: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// GET: 발행 상태 조회 (?category_slug=xxx 또는 전체)
export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('category_slug');
    const status = searchParams.get('status'); // pending/published/failed/all

    let query = supabase
      .from('tistory_publish_queue')
      .select('id, blog_name, category_slug, post_no, scheduled_date, title, status, post_url, published_at, error_msg')
      .order('scheduled_date', { ascending: true });

    if (slug) query = query.eq('category_slug', slug);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// PATCH: 상태 업데이트 (publisher 스크립트가 사용)
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, post_url, error_msg } = await req.json();
    const supabase = getAdminClient();

    const update: Record<string, unknown> = { status };
    if (post_url) update.post_url = post_url;
    if (error_msg) update.error_msg = error_msg;
    if (status === 'published') update.published_at = new Date().toISOString();

    const { error } = await supabase
      .from('tistory_publish_queue')
      .update(update)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
