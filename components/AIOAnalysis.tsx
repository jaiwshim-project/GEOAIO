'use client';

import type { AIOScore } from '@/lib/types';
import ScoreCard from './ScoreCard';

interface AIOAnalysisProps {
  aio: AIOScore;
}

export default function AIOAnalysis({ aio }: AIOAnalysisProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-sky-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">AIO 분석</h2>
            <p className="text-xs text-gray-500">AI Overview에서 콘텐츠가 노출·인용될 가능성을 분석합니다</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <ScoreCard
            title="구조화된 답변"
            score={aio.structuredAnswer}
            description="FAQ, How-to, 리스트 형식 활용도"
            color="blue"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
          />
          <ScoreCard
            title="명확성/간결성"
            score={aio.clarity}
            description="콘텐츠의 이해도와 간결함"
            color="green"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <ScoreCard
            title="인용 가능성"
            score={aio.citability}
            description="AI가 이 콘텐츠를 인용할 확률"
            color="purple"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
          />
          <ScoreCard
            title="AI Overview 노출"
            score={aio.aiOverviewProbability}
            description="Google AI Overview 노출 확률"
            color="orange"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          />
        </div>

        {/* 상세 분석 */}
        {aio.details.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wide">상세 분석</h3>
            {aio.details.map((detail, i) => (
              <div key={i} className="bg-sky-50/50 border border-sky-100 rounded-xl p-3 hover:border-sky-300 transition-colors duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{detail.category}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${detail.score >= 70 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : detail.score >= 40 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {detail.score}점
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{detail.description}</p>
                {detail.suggestions.length > 0 && (
                  <ul className="space-y-1">
                    {detail.suggestions.map((s, j) => (
                      <li key={j} className="text-xs text-sky-700 flex items-start gap-1.5">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
