import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, key);
}

// GET /api/blog/category-projects?projectName=...
//   → 해당 프로젝트와 연결된 category_slug 배열 반환
// GET /api/blog/category-projects (no projectName)
//   → 전체 매핑 반환 (관리자 디버그용)
export async function GET(req: NextRequest) {
  const projectName = req.nextUrl.searchParams.get('projectName')?.trim() || '';
  const supa = getSupabase();
  const q = supa.from('blog_category_projects').select('category_slug, project_name');
  const { data, error } = projectName ? await q.eq('project_name', projectName) : await q;
  if (error) {
    // 테이블이 아직 없으면 빈 배열로 폴백 — 마이그레이션 미실행 graceful degradation
    return NextResponse.json({ slugs: [], all: [], error: error.message }, { status: 200 });
  }
  const slugs = (data || []).map(r => r.category_slug);
  return NextResponse.json({ slugs, all: data || [] });
}

// POST /api/blog/category-projects
//   body: { categorySlug, projectName }
//   → 카테고리·프로젝트 연결 생성 (이미 있으면 무시)
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const categorySlug = ((body.categorySlug as string) || '').trim();
  const projectName = ((body.projectName as string) || '').trim();
  if (!categorySlug) return NextResponse.json({ error: 'categorySlug required' }, { status: 400 });
  if (!projectName) return NextResponse.json({ error: 'projectName required' }, { status: 400 });
  if (categorySlug.length > 80 || projectName.length > 80) return NextResponse.json({ error: 'too long' }, { status: 422 });

  const supa = getSupabase();
  const ins = await supa.from('blog_category_projects')
    .insert({ category_slug: categorySlug, project_name: projectName })
    .select('id, category_slug, project_name')
    .single();
  // 23505 = unique violation — 이미 연결된 상태, OK로 처리
  if (ins.error && ins.error.code !== '23505') {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, link: ins.data || { category_slug: categorySlug, project_name: projectName } });
}

// DELETE /api/blog/category-projects?categorySlug=...&projectName=...
export async function DELETE(req: NextRequest) {
  const categorySlug = req.nextUrl.searchParams.get('categorySlug')?.trim() || '';
  const projectName = req.nextUrl.searchParams.get('projectName')?.trim() || '';
  if (!categorySlug || !projectName) return NextResponse.json({ error: 'both params required' }, { status: 400 });
  const supa = getSupabase();
  const del = await supa.from('blog_category_projects').delete().eq('category_slug', categorySlug).eq('project_name', projectName);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
