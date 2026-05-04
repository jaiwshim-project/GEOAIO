'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { GEOScore } from '@/lib/types';

interface GEOAnalysisProps {
  geo: GEOScore;
}

export default function GEOAnalysis({ geo }: GEOAnalysisProps) {
  const eeatData = [
    { name: '경험', score: geo.eeat.experience, fill: '#3b82f6' },
    { name: '전문성', score: geo.eeat.expertise, fill: '#8b5cf6' },
    { name: '권위성', score: geo.eeat.authoritativeness, fill: '#f59e0b' },
    { name: '신뢰성', score: geo.eeat.trustworthiness, fill: '#10b981' },
  ];

  const geoMetrics = [
    { label: 'AI 검색 친화도', score: geo.aiSearchFriendliness, color: 'bg-blue-500', trackColor: 'bg-blue-100' },
    { label: '구조화 데이터', score: geo.structuredData, color: 'bg-violet-500', trackColor: 'bg-violet-100' },
    { label: '의미적 완성도', score: geo.semanticCompleteness, color: 'bg-emerald-500', trackColor: 'bg-emerald-100' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">GEO 분석</h2>
            <p className="text-xs text-gray-500">Generative Engine에서의 콘텐츠 최적화 수준을 분석합니다</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* GEO 메트릭 바 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide">GEO 핵심 지표</h3>
            {geoMetrics.map((metric) => (
              <div key={metric.label} className="bg-purple-50/50 rounded-xl p-3 border border-purple-100">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className="text-sm font-bold text-gray-900">{metric.score}점</span>
                </div>
                <div className={`w-full ${metric.trackColor} rounded-full h-2.5`}>
                  <div
                    className={`${metric.color} h-2.5 rounded-full transition-colors duration-1000`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            ))}

            {/* 상세 분석 */}
            {geo.details.length > 0 && (
              <div className="mt-3 space-y-2">
                {geo.details.map((detail, i) => (
                  <div key={i} className="bg-violet-50/50 rounded-xl p-3 border border-violet-100 hover:border-violet-300 transition-colors duration-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">{detail.category}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${detail.score >= 70 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : detail.score >= 40 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {detail.score}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{detail.description}</p>
                    {detail.suggestions.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {detail.suggestions.map((s, j) => (
                          <li key={j} className="text-xs text-purple-700 flex items-start gap-1.5">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
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

          {/* E-E-A-T 차트 */}
          <div>
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3">E-E-A-T 신호 분석</h3>
            <div className="bg-purple-50/30 rounded-xl p-4 border border-purple-100">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eeatData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={55} />
                    <Tooltip
                      formatter={(value) => [`${value}점`, '점수']}
                      contentStyle={{ borderRadius: '12px', border: '2px solid #e9d5ff', fontSize: '13px' }}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200">
              <p className="text-xs text-indigo-700">
                <strong>E-E-A-T</strong>는 Google과 AI 검색엔진이 콘텐츠 품질을 평가하는 핵심 기준입니다.
                경험(Experience), 전문성(Expertise), 권위성(Authoritativeness), 신뢰성(Trustworthiness)을 높이면
                AI 인용 확률이 크게 향상됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
