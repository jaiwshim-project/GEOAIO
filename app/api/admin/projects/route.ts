import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  return createClient(url, serviceKey);
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const pw = request.headers.get('X-Admin-Password');
  if (pw && pw === process.env.ADMIN_PASSWORD) return true;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('user_plans').select('plan').eq('user_id', user.id).maybeSingle();
  return data?.plan === 'admin';
}

// GET: 모든 사용자의 프로젝트 목록 + 콘텐츠 수
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });

  try {
    const supabase = getAdminClient();

    // 모든 프로젝트 조회
    const { data: projects, error: projError } = await supabase
      .from('user_projects')
      .select('id, user_id, name, description, created_at')
      .order('created_at', { ascending: false });

    if (projError) throw projError;

    // 프로젝트별 콘텐츠 수 집계
    const { data: genRows, error: genError } = await supabase
      .from('generate_results')
      .select('project_id');

    if (genError) throw genError;

    const countMap = new Map<string, number>();
    (genRows || []).forEach(r => {
      if (r.project_id) countMap.set(r.project_id, (countMap.get(r.project_id) || 0) + 1);
    });

    const result = (projects || []).map(p => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      description: p.description,
      created_at: p.created_at,
      content_count: countMap.get(p.id) || 0,
    }));

    return NextResponse.json({ projects: result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '서버 오류' }, { status: 500 });
  }
}
