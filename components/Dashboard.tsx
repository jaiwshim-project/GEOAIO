'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AnalysisResponse, AnalysisTab } from '@/lib/types';
import ContentInput from './ContentInput';
import ScoreOverview from './ScoreOverview';
import AIOAnalysis from './AIOAnalysis';
import GEOAnalysis from './GEOAnalysis';
import KeywordAnalysis from './KeywordAnalysis';
import Recommendations from './Recommendations';
import OptimizedContent from './OptimizedContent';
import Header from './Header';
import Footer from './Footer';
import ApiKeyPanel from './ApiKeyPanel';
import CategoryBanner from './CategoryBanner';
import { saveHistoryItem, generateId } from '@/lib/history';
import { canUseFeature, incrementUsage } from '@/lib/usage';

const tabs: { id: AnalysisTab; label: string }[] = [
  { id: 'overview', label: '종합 개요' },
  { id: 'aio', label: 'AIO 분석' },
  { id: 'geo', label: 'GEO 분석' },
  { id: 'keywords', label: '키워드' },
  { id: 'recommendations', label: '개선 제안' },
  { id: 'optimize', label: 'AI 최적화 변환' },
];

export default function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [error, setError] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const handleAnalyze = async (content: string, targetKeyword: string, url: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 사용량 체크
      const usage = await canUseFeature('analyze');
      if (!usage.allowed) {
        setError(`이번 달 콘텐츠 분석 사용 횟수(${usage.limit}회)를 모두 소진했습니다. 요금제를 업그레이드하세요.`);
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          targetKeyword: targetKeyword || undefined,
          url: url || undefined,
          analysisType: 'full',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '분석에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data);
      setOriginalContent(content);
      setTargetKeyword(targetKeyword);
      setActiveTab('overview');
      // 사용량 증가
      await incrementUsage('analyze');
      // 이력 저장
      const now = new Date();
      const keywords = data.keywords?.primaryKeywords?.map((k: { keyword: string }) => k.keyword).join(', ') || '';
      await saveHistoryItem({
        id: generateId(),
        type: 'analysis',
        title: targetKeyword || content.substring(0, 50).trim() + '...',
        summary: `종합 ${data.overallScore}점 | AIO ${data.aio.total}점 | GEO ${data.geo.total}점${keywords ? ` | ${keywords}` : ''}`,
        date: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
        targetKeyword: targetKeyword || undefined,
        analysisResult: data,
        originalContent: content,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <Header
        showApiKeyButton
        onToggleApiKey={() => setShowApiKeyInput(!showApiKeyInput)}
        apiKeyOpen={showApiKeyInput}
      />
      <CategoryBanner />

      {/* API Key 입력 패널 */}
      <ApiKeyPanel visible={showApiKeyInput} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* 히어로 */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-8 flex items-center gap-6">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <circle cx="50" cy="50" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="350" cy="100" r="120" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="relative z-10 h-16 rounded-lg shadow-lg hidden sm:block" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">콘텐츠 분석</h2>
            <p className="text-sm text-white/80">GEO/AIO 관점에서 콘텐츠를 종합 분석합니다</p>
          </div>
        </div>

        {/* 콘텐츠 입력 */}
        <ContentInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-red-700">{error}</p>
              {error.includes('소진했습니다') && (
                <Link href="/pricing" className="inline-block mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline">
                  요금제 확인하기 &rarr;
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {result && (
          <>
            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 p-1.5 flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                    activeTab === tab.id
                      ? tab.id === 'optimize'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border-lime-300'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm border-sky-300'
                      : tab.id === 'optimize'
                        ? 'text-emerald-600 hover:bg-emerald-50 border-teal-300 hover:border-teal-400'
                        : 'text-gray-600 hover:bg-gray-50 border-indigo-200 hover:border-indigo-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 */}
            {activeTab === 'overview' && <ScoreOverview result={result} />}
            {activeTab === 'aio' && <AIOAnalysis aio={result.aio} />}
            {activeTab === 'geo' && <GEOAnalysis geo={result.geo} />}
            {activeTab === 'keywords' && <KeywordAnalysis keywords={result.keywords} />}
            {activeTab === 'recommendations' && <Recommendations recommendations={result.recommendations} />}
            {activeTab === 'optimize' && <OptimizedContent result={result} originalContent={originalContent} targetKeyword={targetKeyword} />}
          </>
        )}

        {/* 초기 안내 */}
        {!result && !isAnalyzing && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-200 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">콘텐츠를 분석해보세요</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              위에 콘텐츠를 입력하면 GEO/AIO 관점에서 종합적인 분석 결과와
              구체적인 개선 방안을 제공합니다.
            </p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
              {[
                { label: 'AIO 점수', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
                { label: 'GEO 최적화', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
                { label: '키워드 분석', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
                { label: '개선 제안', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
              ].map((feature) => (
                <div key={feature.label} className={`${feature.bg} rounded-xl px-3 py-2.5 border ${feature.border}`}>
                  <p className={`text-xs font-semibold ${feature.text}`}>{feature.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
