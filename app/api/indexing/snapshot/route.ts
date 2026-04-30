// POST /api/indexing/snapshot
// 사이트의 sitemap을 읽고 GSC URL Inspection으로 페이지별 색인 상태를 조회한 뒤
// 카테고리별 집계까지 포함한 snapshot을 Supabase에 저장한다.
//
// Body: { siteId, siteUrl, sitemapUrl, sampleSize?, categoryMap? }
// - siteId:      "digitalsmile-tistory" 같은 식별자
// - siteUrl:     GSC에 등록된 속성 URL (예: "sc-domain:digitalsmile.tistory.com" 또는 "https://digitalsmile.tistory.com/")
// - sitemapUrl:  "https://digitalsmile.tistory.com/sitemap.xml"
// - sampleSize:  GSC quota 절약용 (기본 60). 전수 검사 원하면 1000.
// - categoryMap: { "임플란트": ["/category/2", "/category/임플란트"], ... } URL prefix → 카테고리 라벨

import { NextRequest, NextResponse } from 'next/server';
import { fetchSitemapUrls, inspectUrls, isGscConfigured, mockSnapshot } from '@/lib/gsc-client';
import { saveSnapshot } from '@/lib/indexing-store';

export const maxDuration = 300;
export const runtime = 'nodejs';

interface SnapshotBody {
  siteId: string;
  siteUrl?: string;
  sitemapUrl?: string;
  sampleSize?: number;
  categoryMap?: Record<string, string[]>;
}

export async function POST(req: NextRequest) {
  let body: SnapshotBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }
  if (!body.siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

  // GSC 미구성 → mock snapshot 저장 시도, 실패하면 mock 반환만.
  if (!isGscConfigured() || !body.siteUrl || !body.sitemapUrl) {
    const mock = mockSnapshot(body.siteId);
    const saved = await saveSnapshot({
      site_id: mock.site_id,
      site_url: body.siteUrl,
      taken_at: mock.taken_at,
      total_pages: mock.total_pages,
      indexed: mock.indexed,
      not_indexed: mock.not_indexed,
      reasons: mock.reasons,
      by_category: mock.by_category,
      is_mock: true,
    });
    return NextResponse.json({ ok: true, snapshot: mock, saved: saved.ok, mock: true });
  }

  const sitemap = await fetchSitemapUrls(body.sitemapUrl);
  if (sitemap.length === 0) {
    return NextResponse.json({ error: `sitemap empty or unreachable: ${body.sitemapUrl}` }, { status: 502 });
  }

  // sampleSize 만큼만 inspect (GSC quota 보호)
  const sample = sitemap.slice(0, body.sampleSize ?? 60);
  const inspected = await inspectUrls(body.siteUrl, sample, { concurrency: 4 });

  // 집계
  const reasons: Record<string, number> = {};
  let indexed = 0;
  for (const r of inspected) {
    if (r.state === 'INDEXED') indexed++;
    else reasons[r.state] = (reasons[r.state] || 0) + 1;
  }

  // 카테고리별 집계
  const byCategory: Record<string, { total: number; indexed: number }> = {};
  if (body.categoryMap) {
    for (const cat of Object.keys(body.categoryMap)) byCategory[cat] = { total: 0, indexed: 0 };
    for (const r of inspected) {
      for (const [cat, prefixes] of Object.entries(body.categoryMap)) {
        if (prefixes.some(p => r.url.includes(p))) {
          byCategory[cat].total++;
          if (r.state === 'INDEXED') byCategory[cat].indexed++;
          break;
        }
      }
    }
  }

  const taken_at = new Date().toISOString();
  const snap = {
    site_id: body.siteId,
    site_url: body.siteUrl,
    taken_at,
    total_pages: inspected.length,
    indexed,
    not_indexed: inspected.length - indexed,
    reasons,
    by_category: byCategory,
  };

  const saved = await saveSnapshot(snap);
  return NextResponse.json({ ok: true, snapshot: { ...snap, sampleSize: sample.length, sitemapTotal: sitemap.length }, saved: saved.ok, error: saved.error });
}
