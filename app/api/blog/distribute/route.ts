import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// Make.com 웹훅으로 SNS 배포 요청
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts, webhookUrl, channels } = body as {
      posts: { title: string; content: string; summary: string; hashtags: string[]; category: string }[];
      webhookUrl: string;
      channels: string[];
    };

    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: '게시할 포스트가 없습니다.' }, { status: 400 });
    }

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Make.com 웹훅 URL이 필요합니다.' }, { status: 400 });
    }

    // Make.com 웹훅으로 각 포스트 전송
    const results = await Promise.allSettled(
      posts.map(async (post, idx) => {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            index: idx + 1,
            total: posts.length,
            title: post.title,
            content: post.content,
            summary: post.summary,
            hashtags: post.hashtags,
            category: post.category,
            channels,
            timestamp: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error(`Webhook ${res.status}`);
        return { index: idx, status: 'ok' };
      })
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      total: posts.length,
      sent: success,
      failed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '배포 실패' },
      { status: 500 }
    );
  }
}
