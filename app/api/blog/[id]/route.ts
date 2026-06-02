import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // UUID 형식 검증
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: '유효하지 않은 ID 형식입니다.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, content, category } = body;

    // 필수 필드 검증
    if (!title || !content) {
      return NextResponse.json({ error: '제목과 본문은 필수입니다.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 기존 포스트 조회 (존재 여부 확인)
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_articles')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: '블로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 포스트 업데이트
    const { data, error } = await supabase
      .from('blog_articles')
      .update({
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || '전체',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[blog/[id]/PATCH] Supabase 업데이트 오류:', error);
      return NextResponse.json({ error: '블로그 업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('[blog/[id]/PATCH] 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/blog/[id]] 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/blog/[id]] 예외:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
