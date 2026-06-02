import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const runtime = 'nodejs';

const BUCKET = 'project-files';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

async function ensureBucket(supabase: ReturnType<typeof getServiceClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: false });
  }
}

// 멀티파트 업로드: 원본 바이너리 → Storage, 추출 텍스트 → DB
export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get('file') as File | null;
    const project_id = (fd.get('project_id') as string | null) || '';
    const content = (fd.get('content') as string | null) || '';

    console.log('[upload] 파일 업로드 시작:', {
      fileName: file?.name,
      fileSize: file?.size,
      project_id,
      contentLength: content?.length,
    });

    if (!project_id) return NextResponse.json({ error: 'project_id 필요' }, { status: 400 });
    if (!file) return NextResponse.json({ error: 'file 필요' }, { status: 400 });

    // Vercel 서버리스 함수 body 제한: 4.5MB
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: `파일 크기가 4MB를 초과합니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 4MB 이하 파일만 업로드 가능합니다.` },
        { status: 413 }
      );
    }

    const supabase = getServiceClient();
    try {
      await ensureBucket(supabase);
    } catch (e) {
      console.error('[upload] ensureBucket 실패:', e);
      return NextResponse.json({ error: `Storage 버킷 초기화 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}` }, { status: 500 });
    }

    // Supabase Storage는 한글 등 non-ASCII key를 거부 → 확장자만 유지하고 ASCII 경로 사용
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const storageKey = `${project_id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}/file.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    console.log('[upload] Storage 업로드 중:', { storageKey, fileSize: bytes.length });
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (upErr) {
      console.error('[upload] Storage 업로드 실패:', upErr);
      return NextResponse.json({ error: `Storage 업로드 실패: ${upErr.message}` }, { status: 500 });
    }
    console.log('[upload] Storage 업로드 완료');

    console.log('[upload] DB 저장 중:', { project_id, file_name: file.name });
    const { data, error } = await supabase
      .from('project_files')
      .insert({
        project_id,
        file_name: file.name,
        file_path: storageKey,
        file_size: file.size,
        file_type: file.type || null,
        content: content || '',
      })
      .select('id, file_name, file_path, file_size, file_type, created_at')
      .single();

    if (error) {
      console.error('[upload] DB 저장 실패:', error);
      // DB 저장 실패 시 Storage 청소 시도 (베스트 에포트)
      await supabase.storage.from(BUCKET).remove([storageKey]).catch(() => {});
      return NextResponse.json({ error: `DB 저장 실패: ${error.message}` }, { status: 500 });
    }
    console.log('[upload] 완료:', { fileId: data.id, fileName: data.file_name });
    return NextResponse.json({ file: data });
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : '오류';
    console.error('[upload] 예외 발생:', errorMsg, e);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
