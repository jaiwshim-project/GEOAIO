'use client';

import { useState } from 'react';

interface ContentInputProps {
  onAnalyze: (content: string, targetKeyword: string, url: string) => void;
  isAnalyzing: boolean;
}

export default function ContentInput({ onAnalyze, isAnalyzing }: ContentInputProps) {
  const [content, setContent] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAnalyze(content, targetKeyword, url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">콘텐츠 분석</h2>
            <p className="text-xs text-gray-500">GEO/AIO 관점에서 콘텐츠를 종합 분석합니다</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              타겟 키워드 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              placeholder="예: AI 콘텐츠 최적화"
              className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors placeholder-blue-400/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              콘텐츠 URL <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-colors placeholder-indigo-400/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            분석할 콘텐츠 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="분석할 콘텐츠를 여기에 붙여넣으세요. 블로그 글, 웹페이지 본문, 기사 등 어떤 텍스트든 가능합니다."
            rows={10}
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors resize-y placeholder-slate-400/60"
          />
          <div className="flex justify-between mt-1.5">
            <span className={`text-xs font-medium ${content.length >= 50 ? 'text-emerald-500' : 'text-gray-400'}`}>
              {content.length}자 입력됨
            </span>
            <span className="text-xs text-gray-400">
              최소 50자 이상 권장
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isAnalyzing || content.trim().length === 0}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 border border-sky-300 shadow-sm"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI 분석 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              GEO/AIO 분석 시작
            </>
          )}
        </button>
      </div>
    </form>
  );
}
