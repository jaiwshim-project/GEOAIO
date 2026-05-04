'use client';

import Link from 'next/link';
import { INDEXING_SITES } from '@/lib/indexing-sites';

const COLOR_MAP: Record<string, { card: string; badge: string }> = {
  emerald: { card: 'from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400', badge: 'bg-emerald-500' },
  indigo:  { card: 'from-indigo-50 to-violet-50 border-indigo-200 hover:border-indigo-400', badge: 'bg-indigo-500' },
  violet:  { card: 'from-violet-50 to-purple-50 border-violet-200 hover:border-violet-400', badge: 'bg-violet-500' },
  rose:    { card: 'from-rose-50 to-pink-50 border-rose-200 hover:border-rose-400', badge: 'bg-rose-500' },
  amber:   { card: 'from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400', badge: 'bg-amber-500' },
  cyan:    { card: 'from-cyan-50 to-sky-50 border-cyan-200 hover:border-cyan-400', badge: 'bg-cyan-500' },
};

export default function IndexingSitesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📊 색인 모니터링 — 사이트 선택</h1>
          <p className="text-sm text-gray-500 mt-1">
            모니터링할 사이트를 선택하세요. Google Search Console과 연결되어 색인 추이·미색인 사유·카테고리별 색인율을 시각화합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INDEXING_SITES.map(site => {
            const c = COLOR_MAP[site.color] || COLOR_MAP.indigo;
            return (
              <Link
                key={site.id}
                href={`/dashboard/indexing/${site.id}`}
                className={`block bg-gradient-to-br ${c.card} rounded-xl border-2 p-5 transition-colors hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${c.badge} text-white flex items-center justify-center text-2xl shrink-0`}>
                    {site.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-base mb-0.5">{site.label}</div>
                    <code className="text-xs text-gray-500 break-all">{site.domain}</code>
                    <p className="text-xs text-gray-700 mt-2 leading-relaxed">{site.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          <p className="font-semibold mb-1">💡 사이트 추가 방법</p>
          <p className="text-xs leading-relaxed">
            <code className="bg-amber-100 px-1.5 py-0.5 rounded">lib/indexing-sites.ts</code> 의 <code className="bg-amber-100 px-1.5 py-0.5 rounded">INDEXING_SITES</code> 배열에 한 항목만 추가하면 됩니다 (id, label, domain, sitemapUrl, categoryMap).
          </p>
        </div>
      </div>
    </div>
  );
}
