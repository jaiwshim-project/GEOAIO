import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, key);
}

// rate limit (인메모리, 인스턴스당) — 같은 토큰이 60초당 댓글 1개
const lastCommentAt = new Map<string, number>();

// ===========================================================
// GET — 글의 좋아요 수 + 본인 좋아요 여부 + 댓글 목록
// ===========================================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  const anonToken = searchParams.get('anonToken') || '';
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  const supa = getSupabase();
  const [likes, comments, my] = await Promise.all([
    supa.from('blog_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    supa.from('blog_comments').select('id, author_name, content, anon_token, user_id, created_at')
      .eq('post_id', postId).eq('hidden', false).order('created_at', { ascending: false }).limit(200),
    anonToken
      ? supa.from('blog_likes').select('id').eq('post_id', postId).eq('anon_token', anonToken).limit(1)
      : Promise.resolve({ data: [] as { id: number }[] }),
  ]);

  return NextResponse.json({
    likeCount: likes.count || 0,
    likedByMe: (my.data?.length || 0) > 0,
    comments: comments.data || [],
  });
}

// ===========================================================
// POST — action: 'like-toggle' | 'comment-create' | 'comment-delete'
// ===========================================================
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const action = body.action as string;
  const postId = body.postId as string;
  const anonToken = (body.anonToken as string) || '';
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  const supa = getSupabase();

  if (action === 'like-toggle') {
    if (!anonToken) return NextResponse.json({ error: 'anonToken required' }, { status: 400 });
    // 이미 좋아요 했으면 → 삭제 (토글), 아니면 → 추가
    const existing = await supa.from('blog_likes').select('id').eq('post_id', postId).eq('anon_token', anonToken).limit(1);
    if (existing.data && existing.data.length > 0) {
      await supa.from('blog_likes').delete().eq('id', existing.data[0].id);
      const c = await supa.from('blog_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
      return NextResponse.json({ likedByMe: false, likeCount: c.count || 0 });
    }
    const ins = await supa.from('blog_likes').insert({ post_id: postId, anon_token: anonToken }).select('id').single();
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
    const c = await supa.from('blog_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    return NextResponse.json({ likedByMe: true, likeCount: c.count || 0 });
  }

  if (action === 'comment-create') {
    const authorName = ((body.authorName as string) || '').trim();
    const content = ((body.content as string) || '').trim();
    if (!authorName || authorName.length > 40) return NextResponse.json({ error: '이름은 1~40자' }, { status: 422 });
    if (!content || content.length > 1000) return NextResponse.json({ error: '내용은 1~1000자' }, { status: 422 });
    if (!anonToken) return NextResponse.json({ error: 'anonToken required' }, { status: 400 });

    // rate limit (60초당 1개)
    const last = lastCommentAt.get(anonToken) || 0;
    const now = Date.now();
    if (now - last < 60_000) {
      const wait = Math.ceil((60_000 - (now - last)) / 1000);
      return NextResponse.json({ error: `${wait}초 후 다시 시도해주세요.` }, { status: 429 });
    }
    lastCommentAt.set(anonToken, now);

    const ins = await supa.from('blog_comments').insert({
      post_id: postId,
      author_name: authorName,
      content,
      anon_token: anonToken,
    }).select('id, author_name, content, anon_token, user_id, created_at').single();
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
    return NextResponse.json({ comment: ins.data });
  }

  if (action === 'comment-delete') {
    const commentId = body.commentId as number;
    if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 });
    if (!anonToken) return NextResponse.json({ error: 'anonToken required' }, { status: 400 });
    // 본인(같은 anon_token) 댓글만 삭제
    const target = await supa.from('blog_comments').select('id, anon_token').eq('id', commentId).single();
    if (target.error || !target.data) return NextResponse.json({ error: 'not found' }, { status: 404 });
    if (target.data.anon_token !== anonToken) return NextResponse.json({ error: '본인 댓글만 삭제 가능' }, { status: 403 });
    const del = await supa.from('blog_comments').delete().eq('id', commentId);
    if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
