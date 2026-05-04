'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { canUseFeature, incrementUsage } from '@/lib/usage';

interface AIFactor {
  factor: string;
  importance: string;
  description: string;
}

interface DifferentiationStrategy {
  strategy: string;
  description: string;
  implementation: string;
}

interface ContentRecommendation {
  type: string;
  recommendations: string[];
}

interface CompetitorInsight {
  insight: string;
  action: string;
}

interface AnalysisResult {
  keyword: string;
  difficulty: string;
  searchIntent: string;
  aiCitationFactors: AIFactor[];
  mustCoverTopics: string[];
  differentiationStrategies: DifferentiationStrategy[];
  contentRecommendations: ContentRecommendation[];
  relatedKeywords: string[];
  competitorInsights: CompetitorInsight[];
}

export default function KeywordAnalysisPage() {
  const [keyword, setKeyword] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const industries = [
    'IT/테크',
    '교육',
    '의료/건강',
    '금융/보험',
    '부동산',
    '여행/관광',
    '법률/컨설팅',
    '마케팅/광고',
    '이커머스',
    '요식업',
    '기타'
  ];

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === '상') return 'bg-red-100 text-red-700 border-red-300';
    if (difficulty === '중') return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const getImportanceBadge = (importance: string) => {
    if (importance === '높음' || importance === '상') {
      return 'bg-rose-100 text-rose-700 border-rose-300';
    }
    if (importance === '중간' || importance === '중') {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      setError('키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 사용량 체크
      const usage = await canUseFeature('keyword');
      if (!usage.allowed) {
        setError(`이번 달 키워드 분석 사용 횟수(${usage.limit}회)를 모두 소진했습니다. 요금제를 업그레이드하세요.`);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/keyword-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          industry: industry || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '분석 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      await incrementUsage('keyword');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6">
        {/* 히어로 */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-8 mb-5 flex items-center gap-6">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <circle cx="50" cy="50" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="350" cy="100" r="120" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="relative z-10 h-16 rounded-lg shadow-lg hidden sm:block" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">키워드 경쟁 분석</h2>
            <p className="text-sm text-white/80">AI 시대의 키워드 난이도와 최적화 전략을 분석합니다</p>
          </div>
        </div>

        {/* Analysis Form */}
        <div className="max-w-3xl mx-auto mb-5">
          <form onSubmit={handleAnalyze} className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
            <div className="space-y-3">
              <div>
                <label htmlFor="keyword" className="block text-sm font-semibold text-gray-700 mb-2">
                  분석할 키워드 *
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="예: AI 마케팅 전략"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 mb-2">
                  산업 분야 (선택)
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                >
                  <option value="">선택하지 않음</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    분석 중...
                  </span>
                ) : (
                  '분석 시작'
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold">{error}</p>
              {error.includes('소진했습니다') && (
                <Link href="/pricing" className="inline-block mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline">
                  요금제 확인하기 &rarr;
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {result && (
          <div className="max-w-5xl mx-auto space-y-3">
            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-200">
              <h2 className="text-base font-bold text-gray-800 mb-3">분석 개요</h2>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-gray-600 mb-1">키워드</p>
                  <p className="text-base font-bold text-gray-800">{result.keyword}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-600 mb-1">검색 의도</p>
                  <p className="text-base font-bold text-gray-800">{result.searchIntent}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">난이도</p>
                  <span className={`inline-block px-4 py-2 rounded-lg font-bold text-base border ${getDifficultyColor(result.difficulty)}`}>
                    {result.difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Citation Factors */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-indigo-200">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-lg mr-3">AI</span>
                AI 인용 요소
              </h2>
              <div className="space-y-3">
                {result.aiCitationFactors.map((factor, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800 flex-grow">{factor.factor}</h3>
                      <span className={`ml-3 px-3 py-1 rounded-full text-sm font-semibold border ${getImportanceBadge(factor.importance)}`}>
                        {factor.importance}
                      </span>
                    </div>
                    <p className="text-gray-700">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Must-Cover Topics */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-emerald-200">
              <h2 className="text-base font-bold text-gray-800 mb-3">필수 다룰 주제</h2>
              <ol className="space-y-2">
                {result.mustCoverTopics.map((topic, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="flex-grow pt-1 text-gray-700">{topic}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Differentiation Strategies */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-pink-200">
              <h2 className="text-base font-bold text-gray-800 mb-3">차별화 전략</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {result.differentiationStrategies.map((strategy, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                    <h3 className="font-bold text-sm text-gray-800 mb-2">{strategy.strategy}</h3>
                    <p className="text-gray-700 mb-2">{strategy.description}</p>
                    <div className="mt-3 pt-3 border-t border-pink-200">
                      <p className="text-sm font-semibold text-gray-600 mb-1">구현 방법:</p>
                      <p className="text-sm text-gray-700">{strategy.implementation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Recommendations */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-amber-200">
              <h2 className="text-base font-bold text-gray-800 mb-3">콘텐츠 추천</h2>
              <div className="space-y-3">
                {result.contentRecommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                    <h3 className="font-bold text-sm text-gray-800 mb-3">{recommendation.type}</h3>
                    <ul className="space-y-2">
                      {recommendation.recommendations.map((rec, recIndex) => (
                        <li key={recIndex} className="flex items-start">
                          <span className="text-amber-500 mr-2">▪</span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Keywords */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-cyan-200">
              <h2 className="text-base font-bold text-gray-800 mb-3">연관 키워드</h2>
              <div className="flex flex-wrap gap-2">
                {result.relatedKeywords.map((relatedKeyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 rounded-full font-semibold border border-cyan-300 hover:from-cyan-200 hover:to-blue-200 transition-colors cursor-pointer"
                  >
                    {relatedKeyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Competitor Insights */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-violet-200">
              <h2 className="text-base font-bold text-gray-800 mb-3">경쟁사 인사이트</h2>
              <div className="space-y-3">
                {result.competitorInsights.map((insight, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold text-violet-700">인사이트:</span> {insight.insight}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold text-violet-700">실행 방안:</span> {insight.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
