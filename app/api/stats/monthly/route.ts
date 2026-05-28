import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const runtime = 'nodejs';

function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

export async function GET(req: NextRequest) {
  try {
    const month = req.nextUrl.searchParams.get('month') || '2026-05';
    const [year, monthNum] = month.split('-');

    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-31`;

    const supabase = getSupabase();

    // 월별 모든 글 조회
    const { data: allPosts } = await supabase
      .from('blog_articles')
      .select('category, title, views, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({ stats: [] });
    }

    // 카테고리별 통계 계산
    const statsMap = new Map();

    allPosts.forEach((post: any) => {
      const category = post.category || '기타';
      if (!statsMap.has(category)) {
        statsMap.set(category, {
          clinic: category,
          postsCount: 0,
          totalViews: 0,
          posts: [],
        });
      }

      const stat = statsMap.get(category);
      stat.postsCount++;
      stat.totalViews += post.views || 0;
      stat.posts.push({
        title: post.title,
        views: post.views || 0,
      });
    });

    // 통계 객체로 변환
    const stats = Array.from(statsMap.values())
      .map((stat: any) => {
        // 최고 조회 글 찾기
        const topPost = stat.posts.sort((a: any, b: any) => b.views - a.views)[0];

        return {
          clinic: stat.clinic,
          postsCount: stat.postsCount,
          totalViews: stat.totalViews,
          avgViews: stat.totalViews / stat.postsCount,
          topPost: topPost ? {
            title: topPost.title,
            views: topPost.views,
          } : undefined,
          reportMonth: month,
        };
      })
      .sort((a, b) => b.postsCount - a.postsCount);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[monthly-stats] 오류:', error);
    return NextResponse.json({ error: '통계 조회 실패' }, { status: 500 });
  }
}
