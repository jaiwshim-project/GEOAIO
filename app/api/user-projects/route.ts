import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createClient(url, key);
}

// 사용자의 작업 항목 목록 조회 (파일 포함)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('user_projects')
      .select('*, files:project_files(id, file_name, file_path, file_size, file_type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ projects: data || [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}

// 새 작업 항목 추가
export async function POST(req: NextRequest) {
  try {
    const { user_id, name, description, company_name, representative_name } = await req.json();
    if (!user_id || !name?.trim()) return NextResponse.json({ error: '사용자 ID와 항목 이름은 필수입니다.' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('user_projects')
      .insert({ user_id, name: name.trim(), description, company_name: company_name?.trim() || null, representative_name: representative_name?.trim() || null })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}

// 작업 항목 수정
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, description, company_name, representative_name } = await req.json();
    if (!id || !name?.trim()) return NextResponse.json({ error: 'id와 이름은 필수입니다.' }, { status: 400 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('user_projects')
      .update({ name: name.trim(), description: description || null, company_name: company_name?.trim() || null, representative_name: representative_name?.trim() || null })
      .eq('id', id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}

// 작업 항목 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

    const supabase = getServiceClient();
    const { error } = await supabase.from('user_projects').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
