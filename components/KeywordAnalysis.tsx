'use client';

import type { KeywordAnalysis as KeywordAnalysisType } from '@/lib/types';

interface KeywordAnalysisProps {
  keywords: KeywordAnalysisType;
}

export default function KeywordAnalysis({ keywords }: KeywordAnalysisProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-teal-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">키워드 분석</h2>
            <p className="text-xs text-gray-500">콘텐츠의 키워드 분포와 최적화 기회를 분석합니다</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 주요 키워드 */}
          <div>
            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-3">주요 키워드</h3>
            <div className="space-y-2">
              {keywords.primaryKeywords.map((kw, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-teal-50/50 rounded-xl border border-teal-100 hover:border-teal-300 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${kw.prominence === 'high' ? 'bg-emerald-500' : kw.prominence === 'medium' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-semibold text-gray-900">{kw.keyword}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500 font-medium">{kw.count}회</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full ${kw.density >= 1 && kw.density <= 3 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                      {kw.density}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 키워드 밀도 */}
            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wide mt-5 mb-3">키워드 밀도</h3>
            <div className="space-y-2.5">
              {keywords.density.map((d, i) => (
                <div key={i} className="bg-teal-50/30 rounded-lg p-2.5 border border-teal-100">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{d.keyword}</span>
                    <span className={`text-xs font-bold ${d.optimal ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {d.percentage}% {d.optimal ? '(적정)' : '(조정 필요)'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-colors duration-1000 ${d.optimal ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, d.percentage * 20)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 관련 키워드 & 롱테일 */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-wide mb-3">관련 키워드 제안</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.relatedKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded-full border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-400 transition-colors duration-200 cursor-default">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">롱테일 키워드 기회</h3>
              <div className="space-y-2">
                {keywords.longTailOpportunities.map((kw, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 hover:border-emerald-400 transition-colors duration-200">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm font-medium text-emerald-800">{kw}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">배치 최적화 제안</h3>
              <ul className="space-y-2">
                {keywords.placementSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-indigo-50/50 rounded-lg p-2.5 border border-indigo-100">
                    <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
