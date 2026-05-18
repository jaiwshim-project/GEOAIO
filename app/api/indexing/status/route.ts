// GET /api/indexing/status?siteId=digitalsmile-tistory
// 대시보드용. 최신 snapshot + 60일 추이 반환. GSC 미구성·DB 미구성 시 mock 반환.

import { NextRequest, NextResponse } from 'next/server';
import { getLatestSnapshot, getSnapshotHistory, getInspectedPagesBySnapshot } from '@/lib/indexing-store';
import { isGscConfigured } from '@/lib/gsc-client';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId');
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

  const [latest, history] = await Promise.all([
    getLatestSnapshot(siteId),
    getSnapshotHistory(siteId, 60),
  ]);

  // 최신 snapshot의 개별 페이지 결과 조회
  let verifiedCount = 0;
  if (latest?.id && isSupabaseConfigured() && supabase) {
    const pages = await getInspectedPagesBySnapshot(latest.id);
    verifiedCount = pages.length;
  }

  return NextResponse.json({
    ok: true,
    siteId,
    gscConfigured: isGscConfigured(),
    latest: latest ? { ...latest, verifiedCount } : null,
    history,
  });
}
