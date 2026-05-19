import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
