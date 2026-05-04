'use client';

import type { Recommendation } from '@/lib/types';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const priorityConfig = {
  high: { label: '높음', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 border border-red-200', hoverBorder: 'hover:border-red-400' },
  medium: { label: '중간', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 border border-amber-200', hoverBorder: 'hover:border-amber-400' },
  low: { label: '낮음', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 border border-blue-200', hoverBorder: 'hover:border-blue-400' },
};

const categoryLabels: Record<string, string> = {
  aio: 'AIO', geo: 'GEO', keyword: '키워드', structure: '구조', content: '콘텐츠',
};

const categoryColors: Record<string, string> = {
  aio: 'bg-sky-100 text-sky-700 border border-sky-200',
  geo: 'bg-violet-100 text-violet-700 border border-violet-200',
  keyword: 'bg-teal-100 text-teal-700 border border-teal-200',
  structure: 'bg-orange-100 text-orange-700 border border-orange-200',
  content: 'bg-pink-100 text-pink-700 border border-pink-200',
};

export default function Recommendations({ recommendations }: RecommendationsProps) {
  const sorted = [...recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">개선 제안</h2>
            <p className="text-xs text-gray-500">우선순위별 구체적인 최적화 액션 아이템입니다</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {sorted.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-12 h-12 text-emerald-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-medium">모든 항목이 잘 최적화되어 있습니다!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((rec) => {
              const pConfig = priorityConfig[rec.priority];
              return (
                <div key={rec.id} className={`border ${pConfig.border} rounded-xl p-3 ${pConfig.bg} ${pConfig.hoverBorder} transition-colors duration-200`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${pConfig.badge} ${pConfig.text}`}>
                        우선순위: {pConfig.label}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${categoryColors[rec.category] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {categoryLabels[rec.category] || rec.category}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>

                  {rec.before && rec.after && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div className="bg-white/70 rounded-xl p-3 border border-red-100">
                        <p className="text-xs font-bold text-red-500 mb-1">Before</p>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{rec.before}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-3 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-500 mb-1">After</p>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{rec.after}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-indigo-50 rounded-lg px-3 py-1.5 border border-indigo-200 w-fit">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-xs text-indigo-600 font-semibold">{rec.expectedImpact}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
