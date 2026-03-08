import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === 'pdf') {
    const { default: pdfParse } = await import('pdf-parse');
    const result = await pdfParse(buffer);
    return result.text || '';
  }

  if (ext === 'docx' || ext === 'doc') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // md, txt
  return buffer.toString('utf-8');
}

// 파일 업로드 (텍스트 추출 후 DB 저장)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('project_id') as string | null;

    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: 'project_id가 필요합니다.' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'docx', 'doc', 'md', 'txt'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: 'PDF, DOCX, MD, TXT 파일만 가능합니다.' }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 20MB 이하여야 합니다.' }, { status: 400 });
    }

    // 텍스트 추출
    let content = '';
    try {
      content = await extractText(file);
      if (content.length > 50000) content = content.substring(0, 50000) + '\n\n...(잘림)';
    } catch (e) {
      content = `[텍스트 추출 실패: ${e instanceof Error ? e.message : '오류'}]`;
    }

    // DB에 저장 (Storage 없이)
    const supabase = getServiceClient();
    const { data, error: dbError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_path: '',
        file_size: file.size,
        file_type: ext,
        content,
      })
      .select('id, file_name, file_size, file_type, created_at')
      .single();

    if (dbError) return NextResponse.json({ error: `DB 저장 실패: ${dbError.message}` }, { status: 500 });
    return NextResponse.json({ file: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 });
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
