import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) throw new Error('Supabase 환경변수 미설정');
  return createClient(url, key);
}

interface PublishRequest {
  category_slug: string;
  post_no: number;
  scheduled_date: string;
  title: string;
  body: string;
  tags: string[];
  category_link: string;
}

// LinkedIn 포스트 텍스트 포맷 (최대 3000자)
function formatPost(title: string, body: string, tags: string[], link: string): string {
  const hashtags = tags
    .slice(0, 5) // 최대 5개 태그
    .map(t => `#${t.replace(/[\s#]/g, '')}`)
    .join(' ');
  const footer = `\n\n👉 자세히 보기: ${link}\n\n${hashtags}`;
  const header = `${title}\n\n`;
  const maxBody = 3000 - header.length - footer.length;
  const truncated = body.length > maxBody ? body.slice(0, maxBody - 3) + '...' : body;
  return header + truncated + footer;
}

// POST: LinkedIn에 즉시 발행
export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const item: PublishRequest = await req.json();

    // 저장된 토큰 조회
    const { data: tokenData } = await supabase
      .from('linkedin_tokens')
      .select('access_token, person_urn, expires_at')
      .eq('id', 1)
      .maybeSingle();

    if (!tokenData?.access_token) {
      return NextResponse.json(
        { ok: false, error: 'LinkedIn 인증 필요. /api/linkedin/auth 방문하여 로그인하세요.' },
        { status: 401 }
      );
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'LinkedIn 토큰 만료. /api/linkedin/auth 방문하여 재인증하세요.' },
        { status: 401 }
      );
    }

    // 큐에 publishing 상태로 upsert
    await supabase.from('linkedin_publish_queue').upsert(
      {
        category_slug: item.category_slug,
        post_no: item.post_no,
        scheduled_date: item.scheduled_date,
        title: item.title,
        body: item.body,
        tags: item.tags,
        status: 'publishing',
      },
      { onConflict: 'category_slug,post_no' }
    );

    // LinkedIn UGC Posts API 호출
    const postText = formatPost(item.title, item.body, item.tags, item.category_link);

    const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: tokenData.person_urn, // urn:li:member:숫자ID
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                originalUrl: item.category_link,
                title: { text: item.title },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const liData = await liRes.json();

    if (!liRes.ok) {
      await supabase
        .from('linkedin_publish_queue')
        .update({ status: 'failed', error_msg: JSON.stringify(liData) })
        .match({ category_slug: item.category_slug, post_no: item.post_no });

      return NextResponse.json(
        { ok: false, error: liData.message || JSON.stringify(liData) },
        { status: 500 }
      );
    }

    // 발행 성공 — post URL 생성
    // liData.id 예: "urn:li:ugcPost:7123456789"
    const postId = liData.id || '';
    const postUrl = postId
      ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}/`
      : '';

    await supabase
      .from('linkedin_publish_queue')
      .update({
        status: 'published',
        post_url: postUrl,
        published_at: new Date().toISOString(),
      })
      .match({ category_slug: item.category_slug, post_no: item.post_no });

    return NextResponse.json({ ok: true, post_url: postUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// GET: 큐 상태 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('category_slug');

    let query = supabase
      .from('linkedin_publish_queue')
      .select(
        'id, category_slug, post_no, scheduled_date, title, status, post_url, published_at, error_msg'
      )
      .order('scheduled_date', { ascending: true });

    if (slug) query = query.eq('category_slug', slug);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
