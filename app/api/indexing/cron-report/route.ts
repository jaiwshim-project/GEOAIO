// POST /api/indexing/cron-report
// /schedule 백그라운드 에이전트가 매주 호출하는 엔드포인트.
// Bearer 토큰(INDEXING_CRON_SECRET) 으로 보호.
// snapshot을 새로 생성한 뒤 사람이 읽을 수 있는 텍스트 리포트를 반환.
//
// Body: { siteId, siteUrl?, sitemapUrl?, sampleSize?, categoryMap? } — snapshot API와 동일.

import { NextRequest, NextResponse } from 'next/server';
import { fetchSitemapUrls, inspectUrls, isGscConfigured, mockSnapshot } from '@/lib/gsc-client';
import { saveSnapshot, getLatestSnapshot } from '@/lib/indexing-store';

export const maxDuration = 300;
export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  // Bearer 인증
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.INDEXING_CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'INDEXING_CRON_SECRET not configured on server' }, { status: 500 });
  }
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== expected) return unauthorized();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const siteId: string = body.siteId;
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

  // 이전 snapshot 가져와서 비교용
  const prev = await getLatestSnapshot(siteId);

  // 새 snapshot 생성 — 내부적으로 snapshot route와 동일 로직
  let newSnap: {
    site_id: string;
    site_url?: string;
    taken_at: string;
    total_pages: number;
    indexed: number;
    not_indexed: number;
    reasons: Record<string, number>;
    by_category: Record<string, { total: number; indexed: number }>;
    is_mock?: boolean;
  };

  if (!isGscConfigured() || !body.siteUrl || !body.sitemapUrl) {
    const m = mockSnapshot(siteId);
    newSnap = { ...m, is_mock: true };
  } else {
    const urls = await fetchSitemapUrls(body.sitemapUrl);
    const sample = urls.slice(0, body.sampleSize ?? 60);
    const inspected = await inspectUrls(body.siteUrl, sample, { concurrency: 4 });
    const reasons: Record<string, number> = {};
    let indexed = 0;
    for (const r of inspected) {
      if (r.state === 'INDEXED') indexed++;
      else reasons[r.state] = (reasons[r.state] || 0) + 1;
    }
    const byCategory: Record<string, { total: number; indexed: number }> = {};
    if (body.categoryMap) {
      for (const cat of Object.keys(body.categoryMap)) byCategory[cat] = { total: 0, indexed: 0 };
      for (const r of inspected) {
        for (const [cat, prefixes] of Object.entries(body.categoryMap as Record<string, string[]>)) {
          if (prefixes.some((p: string) => r.url.includes(p))) {
            byCategory[cat].total++;
            if (r.state === 'INDEXED') byCategory[cat].indexed++;
            break;
          }
        }
      }
    }
    newSnap = {
      site_id: siteId,
      site_url: body.siteUrl,
      taken_at: new Date().toISOString(),
      total_pages: inspected.length,
      indexed,
      not_indexed: inspected.length - indexed,
      reasons,
      by_category: byCategory,
    };
  }

  await saveSnapshot(newSnap);

  // 텍스트 리포트 — /schedule 에이전트가 그대로 사용자에게 전달
  const indexRate = newSnap.total_pages > 0 ? Math.round((newSnap.indexed / newSnap.total_pages) * 1000) / 10 : 0;
  const delta = prev && !prev.is_mock ? newSnap.indexed - prev.indexed : null;
  const reasonsText = Object.entries(newSnap.reasons || {})
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  - ${k}: ${v}편`)
    .join('\n') || '  (없음)';
  const catText = Object.entries(newSnap.by_category || {})
    .map(([k, v]) => `  - ${k}: ${v.indexed}/${v.total}`)
    .join('\n') || '  (카테고리 매핑 미설정)';

  const report = [
    `📊 ${siteId} 색인 리포트 — ${newSnap.taken_at.slice(0, 10)}`,
    ``,
    `▶ 색인 ${newSnap.indexed} / ${newSnap.total_pages}편 (${indexRate}%)`,
    delta !== null ? `▶ 지난 측정 대비: ${delta >= 0 ? '+' : ''}${delta}편` : '▶ 첫 측정',
    ``,
    `▶ 미색인 사유 분포:`,
    reasonsText,
    ``,
    `▶ 카테고리별 색인:`,
    catText,
    newSnap.is_mock ? `\n⚠️ MOCK 데이터 — GSC 환경 변수(GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN) 미구성` : '',
  ].filter(Boolean).join('\n');

  return NextResponse.json({ ok: true, snapshot: newSnap, report, mock: !!newSnap.is_mock });
}
