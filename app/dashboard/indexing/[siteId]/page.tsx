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
          <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 mb-1">Google Search Console 연동 필요 — 현재 mock 데이터 표시 중</p>
                <p className="text-xs text-slate-800 leading-relaxed mb-3">
                  실데이터(색인 추이·미색인 사유·카테고리별 색인율)를 보려면 <strong>GSC_REFRESH_TOKEN</strong> 발급이 필요합니다.
                  아래 버튼을 누르면 Google 동의 화면으로 이동 → 동의 후 표시되는 토큰을 채팅창에 알려주시면 자동 등록·재배포까지 진행합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/api/indexing/oauth-start"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg shadow-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21.35 11.1H12v3.2h5.35c-.5 2.5-2.7 4.3-5.35 4.3a5.6 5.6 0 110-11.2c1.5 0 2.85.55 3.9 1.55l2.4-2.4A8.85 8.85 0 0012 3a9 9 0 100 18c5.2 0 8.95-3.65 8.95-8.8 0-.6-.05-1.05-.15-1.55z" />
                    </svg>
                    Google 인증 시작 (1분)
                  </a>
                  <a
                    href="/docs/gsc-oauth-setup.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    📖 상세 가이드
                  </a>
                </div>
              </div>
            </div>
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
