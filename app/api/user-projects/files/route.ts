import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

// 파일 메타데이터 + 텍스트 내용 DB 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, file_name, file_size, file_type, content } = body;

    if (!project_id) return NextResponse.json({ error: 'project_id 필요' }, { status: 400 });
    if (!file_name) return NextResponse.json({ error: 'file_name 필요' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('project_files')
      .insert({ project_id, file_name, file_path: '', file_size, file_type, content: content || '' })
      .select('id, file_name, file_size, file_type, created_at')
      .single();

    if (error) return NextResponse.json({ error: `DB 저장 실패: ${error.message}` }, { status: 500 });
    return NextResponse.json({ file: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}

// 파일 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
    const supabase = getServiceClient();
    const { error } = await supabase.from('project_files').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
