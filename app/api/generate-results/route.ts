import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

// project_id로 생성 결과 목록 조회 (제목, AB 여부, 선택 버전만)
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('project_id');
    if (!projectId) return NextResponse.json({ error: 'project_id 필요' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('generate_results')
      .select('id, data, selected_ab_index, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const items = (data || []).map((row) => {
      const d = row.data as Record<string, unknown>;
      const result = d?.result as Record<string, unknown> | undefined;
      const abVersions = (result?.abVersions as unknown[]) || [];
      const isAb = abVersions.length > 1;
      const selectedIndex = row.selected_ab_index ?? 0;
      return {
        id: row.id,
        title: (result?.title as string) || (d?.topic as string) || '제목 없음',
        topic: (d?.topic as string) || '',
        category: (d?.category as string) || '',
        is_ab: isAb,
        ab_count: isAb ? abVersions.length : 0,
        selected_ab_index: selectedIndex,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ items });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
