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

    if (!project_id) return NextResponse.json({ error: 'project_id 필요' }, { status: 400 });
    if (!file) return NextResponse.json({ error: 'file 필요' }, { status: 400 });

    const supabase = getServiceClient();
    try { await ensureBucket(supabase); } catch (e) {
      console.error('[upload] ensureBucket 실패 (계속 진행):', e);
    }

    // 안전한 파일 키: project_id/timestamp_random/originalName
    const safeName = file.name.replace(/[^\w.\-가-힣]/g, '_');
    const storageKey = `${project_id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}/${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (upErr) {
      return NextResponse.json({ error: `Storage 업로드 실패: ${upErr.message}` }, { status: 500 });
    }

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
      // DB 저장 실패 시 Storage 청소 시도 (베스트 에포트)
      await supabase.storage.from(BUCKET).remove([storageKey]).catch(() => {});
      return NextResponse.json({ error: `DB 저장 실패: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ file: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
