// POST /api/geo-readiness/scan
// body: { url } 또는 { siteId, urls?: string[], sampleSize?, sitemapUrl? }
//
// 단일 URL 진단 또는 사이트맵 기반 다수 페이지 일괄 진단.
// LLM 키 없이도 15개 항목 전부 로컬 휴리스틱으로 즉시 진단된다.
// siteId를 주면 결과를 geo_readiness_snapshots / _pages 에 저장해 추이를 축적한다.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchSitemapUrls } from '@/lib/gsc-client';
import { getSiteConfig } from '@/lib/indexing-sites';
import { analyzeReadiness, fetchPage, normalizeUrl, type ReadinessResult } from '@/lib/geo-readiness';
import { withCors, corsOptionsResponse } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_PAGES = 30;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

interface ScanBody {
  url?: string;
  siteId?: string;
  urls?: string[];
  sitemapUrl?: string;
  sampleSize?: number;
  save?: boolean;
}

/** 동시 N개씩 진단 (외부 사이트 부하·타임아웃 보호) */
async function diagnoseMany(urls: string[], concurrency = 4): Promise<ReadinessResult[]> {
  const out: ReadinessResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const page = await fetchPage(url);
        out.push(analyzeReadiness(page));
      } catch (e) {
        console.error('[geo-readiness] 진단 실패', url, e);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return out;
}

export async function POST(req: NextRequest) {
  let body: ScanBody;
  try {
    body = await req.json();
  } catch {
    return withCors(NextResponse.json({ error: 'invalid json body' }, { status: 400 }), req);
  }

  /* ── 1. 대상 URL 목록 결정 ── */
  let urls: string[] = [];
  let source = 'explicit';

  if (body.url) {
    urls = [normalizeUrl(body.url)];
    source = 'single';
  } else if (body.urls?.length) {
    urls = body.urls.map(normalizeUrl).filter(Boolean);
  } else if (body.siteId) {
    const cfg = getSiteConfig(body.siteId);
    let sitemapUrl = body.sitemapUrl || cfg?.sitemapUrl;

    // 커스텀 등록 사이트에서 사이트맵 조회
    if (!sitemapUrl) {
      const client = db();
      if (client) {
        const { data } = await client
          .from('indexing_custom_sites')
          .select('sitemap_url')
          .eq('id', body.siteId)
          .maybeSingle();
        sitemapUrl = data?.sitemap_url;
      }
    }
    if (!sitemapUrl) {
      return withCors(NextResponse.json({ error: `siteId=${body.siteId}의 사이트맵을 찾을 수 없습니다.` }, { status: 400 }), req);
    }

    const all = await fetchSitemapUrls(sitemapUrl);
    if (all.length === 0) {
      return withCors(NextResponse.json({ error: `사이트맵을 읽을 수 없습니다: ${sitemapUrl}` }, { status: 502 }), req);
    }
    // 사이트맵 전체에서 균등 샘플링 — 앞쪽만 보면 최신 글에 편향됨
    const size = Math.min(body.sampleSize ?? 10, MAX_PAGES);
    const step = Math.max(1, Math.floor(all.length / size));
    for (let i = 0; i < all.length && urls.length < size; i += step) urls.push(all[i]);
    source = `sitemap:${sitemapUrl}`;
  }

  if (urls.length === 0) {
    return withCors(NextResponse.json({ error: 'url, urls, siteId 중 하나가 필요합니다.' }, { status: 400 }), req);
  }
  urls = [...new Set(urls)].slice(0, MAX_PAGES);

  /* ── 2. 진단 ── */
  const results = urls.length === 1
    ? [analyzeReadiness(await fetchPage(urls[0]))]
    : await diagnoseMany(urls);

  if (results.length === 0) {
    return withCors(NextResponse.json({ error: '모든 페이지 진단이 실패했습니다. URL과 네트워크를 확인하세요.' }, { status: 502 }), req);
  }

  /* ── 3. 집계 ── */
  const avg = (pick: (r: ReadinessResult) => number) =>
    Math.round(results.reduce((s, r) => s + pick(r), 0) / results.length);

  const verdictCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.verdict] = (acc[r.verdict] || 0) + 1;
    return acc;
  }, {});

  // 항목별 평균 — 사이트 전체에서 어느 항목이 구조적으로 약한지 판별
  const checkAverages = results[0].checks.map(c0 => {
    const scores = results.map(r => r.checks.find(c => c.id === c0.id)?.score ?? 0);
    return {
      id: c0.id,
      label: c0.label,
      group: c0.group,
      weight: c0.weight,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      fix: c0.fix,
    };
  }).sort((a, b) => (100 - b.avgScore) * b.weight - (100 - a.avgScore) * a.weight);

  const summary = {
    pagesScanned: results.length,
    avgScore: avg(r => r.score),
    avgContentScore: avg(r => r.contentScore),
    avgTechnicalScore: avg(r => r.technicalScore),
    verdictCounts,
    weakestChecks: checkAverages.slice(0, 5),
    strongestChecks: [...checkAverages].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3),
  };

  /* ── 4. 저장 (siteId가 있고 save !== false 일 때) ── */
  let saved = false;
  let snapshotId: string | null = null;
  let saveError: string | undefined;

  if (body.siteId && body.save !== false) {
    const client = db();
    if (client) {
      const takenAt = new Date().toISOString();
      const { data, error } = await client
        .from('geo_readiness_snapshots')
        .insert({
          site_id: body.siteId,
          taken_at: takenAt,
          pages_scanned: summary.pagesScanned,
          avg_score: summary.avgScore,
          avg_content_score: summary.avgContentScore,
          avg_technical_score: summary.avgTechnicalScore,
          verdict_counts: verdictCounts,
          check_averages: checkAverages,
          source,
        })
        .select('id')
        .single();

      if (error) saveError = error.message;
      else {
        saved = true;
        snapshotId = data?.id ?? null;
        if (snapshotId) {
          const rows = results.map(r => ({
            snapshot_id: snapshotId,
            site_id: body.siteId,
            url: r.url,
            score: r.score,
            verdict: r.verdict,
            content_score: r.contentScore,
            technical_score: r.technicalScore,
            checks: r.checks,
            strengths: r.strengths,
            weaknesses: r.weaknesses,
            meta: r.meta,
          }));
          const { error: pErr } = await client.from('geo_readiness_pages').insert(rows);
          if (pErr) saveError = pErr.message;
        }
      }
    } else {
      saveError = 'Supabase 미구성 — 결과를 저장하지 않았습니다.';
    }
  }

  return withCors(NextResponse.json({
    ok: true,
    siteId: body.siteId ?? null,
    source,
    summary,
    results: results.sort((a, b) => a.score - b.score), // 낮은 점수 먼저 = 개선 우선순위
    saved,
    snapshotId,
    saveError,
  }), req);
}
