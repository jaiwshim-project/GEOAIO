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
    const supabase = getSupabase();

    // 모든 고유한 카테고리 조회
    const { data: allPosts } = await supabase
      .from('blog_articles')
      .select('category')
      .not('category', 'is', null);

    // 고유한 카테고리만 추출
    const uniqueCategories = Array.from(
      new Set((allPosts || []).map((p: any) => p.category).filter(Boolean))
    ).sort();

    return NextResponse.json({ projects: uniqueCategories });
  } catch (error) {
    console.error('[all-projects] 오류:', error);
    return NextResponse.json({ error: '프로젝트 조회 실패' }, { status: 500 });
  }
}
