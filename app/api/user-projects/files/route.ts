import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

// 파일 업로드
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('project_id') as string | null;

    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: 'project_id가 필요합니다.' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'docx', 'md', 'txt', 'doc'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: `지원하지 않는 파일 형식입니다. (PDF, DOCX, MD, TXT 가능)` }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 20MB 이하여야 합니다.' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const filePath = `${projectId}/${Date.now()}_${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, buffer, { contentType: file.type || 'application/octet-stream', upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: `파일 업로드 실패: ${uploadError.message}` }, { status: 500 });
    }

    const { data, error: dbError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: ext,
      })
      .select('*')
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ file: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}

// 파일 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { id, file_path } = await req.json();
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

    const supabase = getServiceClient();

    if (file_path) {
      await supabase.storage.from('project-files').remove([file_path]);
    }

    const { error } = await supabase.from('project_files').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
