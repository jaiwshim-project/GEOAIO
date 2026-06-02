import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  return createClient(supabaseUrl, serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json({ error: 'category parameter required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 먼저 삭제할 글 수 확인
    const { count, error: countError } = await supabase
      .from('blog_articles')
      .select('id', { count: 'exact', head: true })
      .eq('category', category);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ message: '삭제할 글이 없습니다.', count: 0 });
    }

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from('blog_articles')
      .delete()
      .eq('category', category);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      category,
      count,
      message: `${count}개의 글이 성공적으로 삭제되었습니다.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
