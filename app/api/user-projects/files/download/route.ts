import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;
export const runtime = 'nodejs';

const BUCKET = 'project-files';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

// 안전한 파일명 헤더 인코딩 (RFC 5987)
function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, '_');
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

// id 단건 다운로드. file_path 비어있으면 추출 텍스트(.txt)로 폴백.
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('project_files')
      .select('id, file_name, file_path, file_type, content')
      .eq('id', id)
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message || 'not found' }, { status: 404 });

    const fileName: string = data.file_name || 'file';

    // 1순위: Storage 원본
    if (data.file_path) {
      const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(data.file_path);
      if (!dlErr && blob) {
        const ab = await blob.arrayBuffer();
        return new NextResponse(ab, {
          status: 200,
          headers: {
            'Content-Type': data.file_type || 'application/octet-stream',
            'Content-Disposition': contentDisposition(fileName),
            'Cache-Control': 'private, no-store',
          },
        });
      }
      console.error('[download] Storage 실패, 텍스트 폴백:', dlErr?.message);
    }

    // 2순위(폴백): 추출된 텍스트를 .txt로 — 구 데이터 호환
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const isPlainText = ext === 'md' || ext === 'txt';
    const downloadName = isPlainText ? fileName : `${fileName.replace(/\.[^.]+$/, '')}.txt`;
    const text = data.content || '';
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': contentDisposition(downloadName),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
