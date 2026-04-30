'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { IndexTrendChart, ReasonsPie, CategoryBars, StatCards } from '@/components/indexing/IndexingCharts';
import { getSiteConfig } from '@/lib/indexing-sites';

interface SnapshotResponse {
  ok: boolean;
  siteId: string;
  gscConfigured: boolean;
  latest: {
    total_pages: number;
    indexed: number;
    not_indexed: number;
    reasons: Record<string, number>;
    by_category: Record<string, { total: number; indexed: number }>;
    taken_at: string;
    is_mock?: boolean;
  } | null;
  history: { date: string; indexed: number; total: number; not_indexed: number }[];
}

export default function IndexingDashboardPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params);
  const cfg = getSiteConfig(siteId);
  const [data, setData] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/indexing/status?siteId=${encodeURIComponent(siteId)}`);
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `오류 ${res.status}`);
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setLoading(false);
  }

  async function refreshSnapshot() {
    setRefreshing(true);
    try {
      // 사이트별 설정을 lib/indexing-sites.ts 의 등록부에서 자동 로드.
      const cfg = getSiteConfig(siteId);
      const body = cfg ? {
        siteId,
        siteUrl: cfg.siteUrl,
        sitemapUrl: cfg.sitemapUrl,
        sampleSize: 100,
        categoryMap: cfg.categoryMap,
      } : { siteId };

      const res = await fetch('/api/indexing/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `오류 ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setRefreshing(false);
  }

  useEffect(() => { load(); }, [siteId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {cfg ? `${cfg.emoji} ${cfg.label}` : '📊 색인 모니터링'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {cfg ? <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{cfg.domain}</code> : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{siteId}</code>}
              <Link href="/dashboard/indexing" className="ml-3 text-xs text-indigo-600 hover:underline">← 다른 사이트 선택</Link>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? '로딩…' : '↻ 새로고침'}
            </button>
            <button
              onClick={refreshSnapshot}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              disabled={refreshing}
            >
              {refreshing ? '측정 중…' : '🔄 지금 측정'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
            ❌ {error}
          </div>
        )}

        {data && !data.gscConfigured && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ Google Search Console OAuth 환경변수(GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN)가 설정되지 않아 mock 데이터가 표시됩니다.
            실데이터를 보려면 <a href="/docs/gsc-oauth-setup.md" target="_blank" rel="noopener noreferrer" className="underline font-semibold">설정 가이드</a>를 참고하세요.
          </div>
        )}

        {data?.latest && (
          <div className="space-y-4">
            <StatCards snapshot={data.latest} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <IndexTrendChart data={data.history} />
              <ReasonsPie reasons={data.latest.reasons || {}} />
              <div className="lg:col-span-2">
                <CategoryBars byCategory={data.latest.by_category || {}} />
              </div>
            </div>
          </div>
        )}

        {data && !data.latest && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">아직 측정된 데이터가 없습니다.</p>
            <button
              onClick={refreshSnapshot}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              disabled={refreshing}
            >
              {refreshing ? '측정 중…' : '🔄 첫 측정 시작'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
