// GET /api/indexing/status?siteId=digitalsmile-tistory
// 대시보드용. 최신 snapshot + 60일 추이 반환. GSC 미구성·DB 미구성 시 mock 반환.

import { NextRequest, NextResponse } from 'next/server';
import { getLatestSnapshot, getSnapshotHistory } from '@/lib/indexing-store';
import { isGscConfigured } from '@/lib/gsc-client';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId');
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

  const [latest, history] = await Promise.all([
    getLatestSnapshot(siteId),
    getSnapshotHistory(siteId, 60),
  ]);

  return NextResponse.json({
    ok: true,
    siteId,
    gscConfigured: isGscConfigured(),
    latest,
    history,
  });
}
