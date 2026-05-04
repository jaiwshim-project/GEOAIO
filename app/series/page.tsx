'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { canUseFeature, incrementUsage } from '@/lib/usage';

interface Episode {
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  targetKeywords: string[];
  keyPoints: string[];
  internalLinks: string[];
  estimatedLength: string;
}

interface SeriesResult {
  seriesTitle: string;
  description: string;
  targetAudience: string;
  episodes: Episode[];
  linkingStrategy: string;
  publishingSchedule: string;
  expectedOutcome: string;
}

const INDUSTRY_OPTIONS = [
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

export default function SeriesPage() {
  const [topic, setTopic] = useState('');
  const [industry, setIndustry] = useState('');
  const [episodeCount, setEpisodeCount] = useState(7);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SeriesResult | null>(null);
  const [error, setError] = useState('');
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError('주제를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // 사용량 체크
      const usage = await canUseFeature('series');
      if (!usage.allowed) {
        setError(`이번 달 시리즈 기획 사용 횟수(${usage.limit}회)를 모두 소진했습니다. 요금제를 업그레이드하세요.`);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/generate-series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          industry: industry || undefined,
          count: episodeCount,
          additionalNotes: additionalNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '시리즈 생성에 실패했습니다');
      }

      const data = await response.json();
      await incrementUsage('series');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEpisode = (episodeNumber: number) => {
    const newExpanded = new Set(expandedEpisodes);
    if (newExpanded.has(episodeNumber)) {
      newExpanded.delete(episodeNumber);
    } else {
      newExpanded.add(episodeNumber);
    }
    setExpandedEpisodes(newExpanded);
  };

  const handleCreateContent = (episode: Episode) => {
    const params = new URLSearchParams({
      topic: episode.title,
    });
    window.location.href = `/generate?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
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
            <h2 className="text-2xl font-bold mb-1">콘텐츠 시리즈 기획</h2>
            <p className="text-sm text-white/80">연속성 있는 콘텐츠 시리즈를 AI가 자동으로 기획합니다</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-purple-200 mb-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-semibold text-gray-800 mb-2">
                시리즈 주제 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 초보자를 위한 SEO 가이드, 디지털 마케팅 전략 등"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-semibold text-gray-800 mb-2">
                산업 분야 (선택)
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors bg-white"
              >
                <option value="">선택하지 않음</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="episodeCount" className="block text-sm font-semibold text-gray-800 mb-2">
                에피소드 수: <span className="text-purple-600 font-bold">{episodeCount}개</span>
              </label>
              <input
                type="range"
                id="episodeCount"
                min="3"
                max="12"
                value={episodeCount}
                onChange={(e) => setEpisodeCount(Number(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-purple-300 to-pink-300 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>3개</span>
                <span>12개</span>
              </div>
            </div>

            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-semibold text-gray-800 mb-2">
                추가 요청사항 (선택)
              </label>
              <textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="타겟 독자층, 특정 키워드, 스타일 등 추가로 고려할 사항을 입력하세요"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-700 font-semibold">{error}</p>
                {error.includes('소진했습니다') && (
                  <Link href="/pricing" className="inline-block mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline">
                    요금제 확인하기 &rarr;
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  시리즈 기획 중...
                </div>
              ) : (
                '시리즈 기획하기'
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className="space-y-3">
            {/* Series Overview */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-200">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-2">{result.seriesTitle}</h2>
                <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                <div className="inline-block">
                  <span className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-full text-sm shadow-md">
                    타겟 독자: {result.targetAudience}
                  </span>
                </div>
              </div>
            </div>

            {/* Episodes */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-800 mb-2">에피소드 목록</h3>
              {result.episodes.map((episode) => {
                const isExpanded = expandedEpisodes.has(episode.number);
                return (
                  <div
                    key={episode.number}
                    className="bg-white rounded-xl shadow-lg border border-indigo-200 overflow-hidden transition-colors hover:shadow-xl"
                  >
                    <div
                      onClick={() => toggleEpisode(episode.number)}
                      className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg text-sm">
                              EP {episode.number}
                            </span>
                            <h4 className="text-sm font-bold text-gray-800">{episode.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 font-medium mb-2">{episode.subtitle}</p>
                          {!isExpanded && (
                            <p className="text-gray-500 text-sm line-clamp-2">{episode.summary}</p>
                          )}
                        </div>
                        <svg
                          className={`w-6 h-6 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t-2 border-gray-100 pt-3">
                        <div>
                          <h5 className="font-semibold text-sm text-gray-800 mb-2">요약</h5>
                          <p className="text-gray-600">{episode.summary}</p>
                        </div>

                        <div>
                          <h5 className="font-semibold text-sm text-gray-800 mb-2">타겟 키워드</h5>
                          <div className="flex flex-wrap gap-2">
                            {episode.targetKeywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gradient-to-r from-pink-400 to-orange-400 text-white rounded-full text-sm font-medium shadow-sm"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold text-sm text-gray-800 mb-2">주요 포인트</h5>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {episode.keyPoints.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>

                        {episode.internalLinks.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-sm text-gray-800 mb-2">내부 링크 제안</h5>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                              {episode.internalLinks.map((link, idx) => (
                                <li key={idx}>{link}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <h5 className="font-semibold text-sm text-gray-800 mb-2">예상 분량</h5>
                          <p className="text-gray-600">{episode.estimatedLength}</p>
                        </div>

                        <button
                          onClick={() => handleCreateContent(episode)}
                          className="w-full mt-4 py-2.5 px-6 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-colors"
                        >
                          이 시리즈로 콘텐츠 생성
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Linking Strategy */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
              <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-green-500">🔗</span>
                링킹 전략
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{result.linkingStrategy}</p>
            </div>

            {/* Publishing Schedule */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-orange-200">
              <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">📅</span>
                발행 일정
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{result.publishingSchedule}</p>
            </div>

            {/* Expected Outcome */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-yellow-200">
              <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-yellow-500">🎯</span>
                기대 효과
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{result.expectedOutcome}</p>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
