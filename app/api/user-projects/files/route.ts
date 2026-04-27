import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

// 프로젝트 파일 목록 + 내용 조회 (project_id) 또는 단건 조회 (id)
export async function GET(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get('id');
    const projectId = req.nextUrl.searchParams.get('project_id');
    const supabase = getServiceClient();

    if (fileId) {
      const { data, error } = await supabase
        .from('project_files')
        .select('id, file_name, file_type, content')
        .eq('id', fileId)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 404 });
      return NextResponse.json({ file: data });
    }

    if (!projectId) return NextResponse.json({ error: 'project_id 또는 id 필요' }, { status: 400 });
    const { data, error } = await supabase
      .from('project_files')
      .select('id, file_name, file_type, content')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ files: data || [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
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

// 파일 삭제 (Storage 원본도 함께 정리)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
    const supabase = getServiceClient();

    const { data: row } = await supabase
      .from('project_files')
      .select('file_path')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('project_files').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (row?.file_path) {
      await supabase.storage.from('project-files').remove([row.file_path]).catch(() => {});
    }
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
