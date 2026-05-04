'use client';

import { useState, useEffect } from 'react';
import type { AnalysisResponse, OptimizeResponse } from '@/lib/types';

interface OptimizedContentProps {
  result: AnalysisResponse;
  originalContent: string;
  targetKeyword?: string;
}

export default function OptimizedContent({ result, originalContent, targetKeyword }: OptimizedContentProps) {
  const [optimized, setOptimized] = useState<OptimizeResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'optimized' | 'compare'>('optimized');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/set-api-key')
      .then(res => res.json())
      .then(data => setHasApiKey(data.hasKey))
      .catch(() => setHasApiKey(false));
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsSavingKey(true);
    setKeySaveMessage(null);

    try {
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      setKeySaveMessage({ type: 'success', text: 'API Key가 저장되었습니다!' });
      setHasApiKey(true);
      setApiKeyInput('');
    } catch (err) {
      setKeySaveMessage({ type: 'error', text: err instanceof Error ? err.message : '저장 실패' });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent,
          targetKeyword,
          recommendations: result.recommendations,
          aioScore: result.aio.total,
          geoScore: result.geo.total,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '최적화에 실패했습니다.');
      }

      const data = await response.json();
      setOptimized(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = async () => {
    if (!optimized) return;
    await navigator.clipboard.writeText(optimized.optimizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 최적화 전 초기 화면
  if (!optimized && !isOptimizing) {
    return (
      <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-6">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 최적화 콘텐츠 변환</h3>
          <p className="text-sm text-gray-500 mb-2">
            분석 결과와 개선 제안을 바탕으로 콘텐츠를 AI 검색엔진에 최적화된 버전으로 자동 변환합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {['구조 재구성', 'FAQ 추가', 'E-E-A-T 강화', '인용 최적화', '키워드 배치'].map((tag) => (
              <span key={tag} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-left">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              {error.includes('ANTHROPIC_API_KEY') && (
                <div className="mt-3 ml-6">
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    API Key 발급받기
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-xs text-gray-500 mt-2">발급받은 키를 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">.env.local</code> 파일에 입력 후 서버를 재시작하세요.</p>
                </div>
              )}
            </div>
          )}

          {/* API Key 입력 섹션 */}
          {hasApiKey === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h4 className="font-semibold text-amber-800">API Key 설정이 필요합니다</h4>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                AI 최적화 변환 기능을 사용하려면 Anthropic API Key가 필요합니다.
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-ant-..."
                  className="flex-1 px-4 py-2.5 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={isSavingKey || !apiKeyInput.trim()}
                  className="px-4 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSavingKey ? '저장 중...' : '저장'}
                </button>
              </div>
              {keySaveMessage && (
                <p className={`text-sm mb-2 ${keySaveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {keySaveMessage.text}
                </p>
              )}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors"
              >
                API Key 발급받으러 가기
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* API Key 등록 완료 상태 */}
          {hasApiKey === true && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-emerald-700 font-medium">API Key가 설정되어 있습니다</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleOptimize}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI 최적화 변환 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 변환 중 로딩
  if (isOptimizing) {
    return (
      <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 relative">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">콘텐츠 최적화 중...</h3>
          <p className="text-sm text-gray-500">AI가 분석 결과를 반영하여 콘텐츠를 재구성하고 있습니다</p>
          <div className="mt-4 flex flex-col gap-2 max-w-xs mx-auto">
            {['구조 재구성', '키워드 최적화', 'E-E-A-T 강화', 'FAQ 생성'].map((step, i) => (
              <div key={step} className="flex items-center gap-2 text-sm text-gray-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 결과 표시
  return (
    <div className="space-y-3">
      {/* 예상 점수 향상 */}
      <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">예상 점수 변화</h2>
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: '종합 점수', before: result.overallScore, after: optimized!.expectedScoreImprovement.overall, color: 'blue' },
            { label: 'AIO 점수', before: result.aio.total, after: optimized!.expectedScoreImprovement.aio, color: 'indigo' },
            { label: 'GEO 점수', before: result.geo.total, after: optimized!.expectedScoreImprovement.geo, color: 'purple' },
          ] as const).map(({ label, before, after, color }) => {
            const diff = after - before;
            return (
              <div key={label} className="text-center p-4 bg-gray-50 rounded-xl border border-indigo-200">
                <p className="text-xs text-gray-500 mb-2">{label}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-gray-400">{before}</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className={`text-lg font-bold text-${color}-600`}>{after}</span>
                </div>
                {diff > 0 && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                    +{diff}점 향상
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 변경사항 요약 */}
      <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">변경사항 요약</h2>
        <div className="space-y-2">
          {optimized!.changeSummary.map((change, i) => (
            <div key={i} className="flex items-start gap-2">
              <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-600">{change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 최적화된 콘텐츠 */}
      <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">최적화된 콘텐츠</h2>
          <div className="flex items-center gap-2">
            {/* 보기 모드 토글 */}
            <div className="bg-gray-100 rounded-lg p-0.5 flex border border-emerald-300">
              <button
                onClick={() => setViewMode('optimized')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'optimized' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                최적화 결과
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'compare' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                원본 비교
              </button>
            </div>
            {/* 복사 버튼 */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-sky-300"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  복사 완료
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  복사
                </>
              )}
            </button>
          </div>
        </div>

        {viewMode === 'optimized' ? (
          <div className="bg-gray-50 rounded-xl p-5 prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {optimized!.optimizedContent}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">원본</span>
                <span className="text-xs text-gray-400">점수: {result.overallScore}</span>
              </div>
              <div className="bg-red-50/30 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{originalContent}</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">최적화</span>
                <span className="text-xs text-gray-400">예상 점수: {optimized!.expectedScoreImprovement.overall}</span>
              </div>
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{optimized!.optimizedContent}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 재변환 버튼 */}
      <div className="text-center">
        <button
          onClick={handleOptimize}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          다시 변환하기
        </button>
      </div>
    </div>
  );
}
