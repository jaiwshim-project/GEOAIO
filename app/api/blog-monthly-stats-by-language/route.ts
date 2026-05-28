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
    const category = req.nextUrl.searchParams.get('category');

    if (!category) {
      return NextResponse.json({ error: 'category required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 카테고리 내 모든 글 조회 (metadata와 views 포함)
    const { data: allPosts } = await supabase
      .from('blog_articles')
      .select('created_at, metadata, views, title')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({ monthlyLanguageStats: {} });
    }

    // 월별, 언어별로 집계
    const monthlyStats: Record<string, Record<string, { count: number; views: number }>> = {};

    allPosts.forEach((post: any) => {
      if (!post.created_at) return;

      const date = new Date(post.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const lang = post.metadata?.lang || 'unknown';
      const views = post.views || 0;

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          ko: { count: 0, views: 0 },
          en: { count: 0, views: 0 },
          zh: { count: 0, views: 0 },
          ja: { count: 0, views: 0 },
          unknown: { count: 0, views: 0 }
        };
      }

      if (!monthlyStats[monthKey][lang]) {
        monthlyStats[monthKey][lang] = { count: 0, views: 0 };
      }

      monthlyStats[monthKey][lang].count++;
      monthlyStats[monthKey][lang].views += views;
    });

    // 전체 통계
    const totals = {
      ko: { count: 0, views: 0 },
      en: { count: 0, views: 0 },
      zh: { count: 0, views: 0 },
      ja: { count: 0, views: 0 },
      unknown: { count: 0, views: 0 }
    };

    Object.values(monthlyStats).forEach(stats => {
      (Object.keys(totals) as Array<keyof typeof totals>).forEach(lang => {
        if (stats[lang]) {
          totals[lang].count += stats[lang].count;
          totals[lang].views += stats[lang].views;
        }
      });
    });

    return NextResponse.json({
      category,
      monthlyLanguageStats: monthlyStats,
      totals,
      totalPosts: allPosts.length
    });
  } catch (error) {
    console.error('[monthly-stats-by-language] 오류:', error);
    return NextResponse.json({ error: '통계 조회 실패' }, { status: 500 });
  }
}
