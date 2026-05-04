'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function IntroductionPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    if (!contentRef.current) return;
    try {
      const htmlBlob = new Blob([contentRef.current.innerHTML], { type: 'text/html' });
      const textBlob = new Blob([contentRef.current.innerText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
      ]);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      await navigator.clipboard.writeText(contentRef.current?.innerText || '');
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const getStyledHtml = () => {
    if (!contentRef.current) return '';
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); }
        catch { return ''; }
      }).join('\n');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GEOAIO 소개서</title><style>${styles}</style></head><body style="background:#f9fafb;padding:32px">${contentRef.current.innerHTML}</body></html>`;
  };

  const handleDownloadDocx = () => {
    if (!contentRef.current) return;
    const html = getStyledHtml();
    const blob = new Blob([html], { type: 'application/vnd.ms-word;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AIO-GEO-Optimizer-소개서.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!contentRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); }
        catch { return ''; }
      }).join('\n');
    printWindow.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>GEOAIO 소개서</title>
      <style>${styles} @media print{body{padding:20px}}</style>
      </head><body style="background:white;padding:32px">${contentRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">소개 자료</h1>
                <p className="text-[10px] text-gray-700">GEOAIO 제품 소개서</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm border hover:shadow-md hover:scale-[1.03] ${
                  copiedAll
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-300 hover:from-indigo-600 hover:to-purple-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedAll ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'} />
                </svg>
                {copiedAll ? '복사됨!' : '복사'}
              </button>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-colors shadow-sm border border-rose-300 hover:shadow-md hover:scale-[1.03]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF 다운로드
              </button>
              <button
                onClick={handleDownloadDocx}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm border border-sky-300 hover:shadow-md hover:scale-[1.03]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                DOCX 다운로드
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-800 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-violet-300 hover:border-violet-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div ref={contentRef} className="space-y-5">

          {/* 타이틀 히어로 */}
          <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-7 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-lg font-extrabold mb-3">GEOAIO</h1>
            <p className="text-sm font-medium text-white mb-2">AI 검색엔진 콘텐츠 최적화 플랫폼</p>
            <p className="text-sm text-white max-w-lg mx-auto">AI가 주도하는 검색의 시대, 콘텐츠가 AI에 의해 발견되고 인용되기 위한 전략적 도구</p>
          </section>

          {/* 시장 변화: 왜 필요한가? */}
          <section className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">1</span>
              <span className="bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">왜 GEO/AIO 최적화가 필요한가?</span>
            </h2>
            <p className="text-[10px] text-gray-800 mb-3">검색의 패러다임이 바뀌고 있습니다. 이제 사용자는 링크 목록이 아닌 AI가 생성한 답변을 먼저 봅니다.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-lg">&#9888;</span>
                  <h3 className="text-xs font-semibold text-red-800">기존 방식의 한계</h3>
                </div>
                <ul className="space-y-2 text-[10px] text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-red-400">&#10005;</span> 키워드 중심의 기존 SEO만으로는 AI 검색에 노출되지 않음</li>
                  <li className="flex items-start gap-2"><span className="text-red-400">&#10005;</span> 구조화되지 않은 콘텐츠는 AI가 인용하기 어려움</li>
                  <li className="flex items-start gap-2"><span className="text-red-400">&#10005;</span> E-E-A-T 신호가 부족하면 AI가 신뢰하지 않음</li>
                  <li className="flex items-start gap-2"><span className="text-red-400">&#10005;</span> 경쟁사가 먼저 대응하면 시장 선점 기회 상실</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg">&#10004;</span>
                  <h3 className="text-xs font-semibold text-emerald-800">GEO/AIO 최적화 후</h3>
                </div>
                <ul className="space-y-2 text-[10px] text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-emerald-500">&#10003;</span> AI Overview 상단에 콘텐츠가 인용되어 노출</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500">&#10003;</span> 구조화된 콘텐츠로 AI 친화도 극대화</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500">&#10003;</span> 전문성과 신뢰성 내장 콘텐츠로 브랜드 가치 상승</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500">&#10003;</span> AI 시대에 경쟁사보다 한 발 앞서 대응</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-indigo-50 rounded-xl p-3 border border-indigo-200 text-center">
              <p className="text-[10pt] font-semibold text-indigo-800">Google 검색의 <span className="text-xl font-extrabold text-indigo-600">40%+</span>에서 AI Overview가 표시됩니다</p>
              <p className="text-[8pt] text-indigo-600 mt-1">당신의 콘텐츠가 AI에 의해 선택되지 않으면, 보이지 않습니다.</p>
            </div>
          </section>

          {/* 핵심 기능 */}
          <section className="bg-white rounded-xl shadow-sm border border-purple-200 p-6">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">2</span>
              <span className="bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">핵심 기능</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'AI 콘텐츠 분석', desc: 'GEO/AIO 점수, E-E-A-T 평가, 키워드 밀도, 구조화 수준을 종합 분석하여 개선 포인트를 제시합니다.', color: 'blue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                { title: 'AI 콘텐츠 생성', desc: '블로그, FAQ, How-to 등 8가지 카테고리의 GEO/AIO 최적화 콘텐츠를 자동으로 생성합니다.', color: 'purple', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { title: '참조 자료 기반 생성', desc: '텍스트 또는 PDF, PPTX, DOCX, 이미지 파일을 업로드하면 해당 데이터를 반영한 정밀 콘텐츠를 생성합니다. 드래그&드롭 지원.', color: 'emerald', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
                { title: 'AI 인포그래픽 이미지', desc: 'Gemini AI로 콘텐츠에 맞는 인포그래픽 이미지 3장을 생성하여 본문에 삽입합니다.', color: 'amber', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { title: '키워드 경쟁 분석', desc: '타겟 키워드의 경쟁 난이도, 검색 의도, AI 인용 핵심 요소, 차별화 전략을 분석합니다.', color: 'cyan', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
                { title: 'A/B 버전 생성', desc: '전문적·친근한·설득적 3가지 톤으로 동시 생성하여 최적의 콘텐츠를 선택할 수 있습니다.', color: 'rose', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { title: 'SNS 채널별 변환', desc: '생성된 콘텐츠를 인스타그램, 링크드인, 네이버 블로그, 카드뉴스, 요약본으로 자동 변환합니다.', color: 'pink', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                { title: '콘텐츠 시리즈 기획', desc: '하나의 주제로 3~12편의 연재 시리즈를 자동 기획하여 에피소드별 제목, 키워드, 개요를 제공합니다.', color: 'teal', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                { title: '대시보드 통계 & 차트', desc: '생성/분석 이력을 시각화된 통계와 차트로 확인하고, 월별 트렌드와 카테고리 분포를 파악합니다.', color: 'violet', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { title: '편집 도구 & 내보내기', desc: '마크다운 편집기, 찾기/바꾸기, 블로그 붙여넣기, 이미지 캡처, DOCX/PDF 다운로드를 지원합니다.', color: 'sky', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' },
              ].map((feat) => (
                <div key={feat.title} className={`bg-${feat.color}-50 rounded-xl p-4 border border-${feat.color}-200`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 bg-gradient-to-br from-${feat.color}-500 to-${feat.color}-600 rounded-lg flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} /></svg>
                    </div>
                    <h3 className={`text-xs font-semibold text-${feat.color}-800`}>{feat.title}</h3>
                  </div>
                  <p className="text-[10px] text-gray-700">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 고객 가치 */}
          <section className="bg-white rounded-xl shadow-sm border border-rose-200 p-6">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">3</span>
              <span className="bg-gradient-to-r from-rose-700 to-pink-600 bg-clip-text text-transparent">고객이 얻는 가치</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 text-center">
                <div className="text-lg font-extrabold text-blue-600 mb-2">&#8593; 트래픽</div>
                <h3 className="text-xs font-semibold text-blue-800 mb-2">검색 노출 극대화</h3>
                <p className="text-[10px] text-gray-700">AI Overview 상위 인용을 통해 자연 검색 유입량을 획기적으로 증가시킵니다.</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200 text-center">
                <div className="text-lg font-extrabold text-emerald-600 mb-2">80%&#8595;</div>
                <h3 className="text-xs font-semibold text-emerald-800 mb-2">시간 절약</h3>
                <p className="text-[10px] text-gray-700">콘텐츠 기획부터 작성, 최적화까지 소요 시간을 최대 80% 단축합니다.</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200 text-center">
                <div className="text-lg font-extrabold text-purple-600 mb-2">&#9733; 신뢰</div>
                <h3 className="text-xs font-semibold text-purple-800 mb-2">브랜드 권위 강화</h3>
                <p className="text-[10px] text-gray-700">E-E-A-T 최적화로 전문적이고 신뢰성 있는 브랜드 이미지를 구축합니다.</p>
              </div>
            </div>
          </section>

          {/* 경쟁 차별성 */}
          <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">4</span>
              <span className="bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">경쟁 차별성</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-amber-200">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <th className="px-4 py-3 text-left font-semibold">비교 항목</th>
                    <th className="px-4 py-3 text-left font-semibold">기존 SEO 도구</th>
                    <th className="px-4 py-3 text-left font-semibold">GEOAIO</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['AI 검색 최적화', '미지원', 'GEO/AIO 전문 최적화'],
                    ['콘텐츠 생성', '키워드 기반 제안', 'AI 기반 생성 + RAG'],
                    ['A/B 테스트', '미지원', '3가지 톤 동시 생성 비교'],
                    ['키워드 분석', '검색량 정도', 'AI 인용 요소 + 차별화 전략'],
                    ['SNS 변환', '미지원', '5개 채널별 자동 변환'],
                    ['시리즈 기획', '미지원', '3~12편 연재 자동 기획'],
                    ['E-E-A-T 분석', '제한적', '4개 항목 세부 평가'],
                    ['이미지 생성', '미지원', 'AI 인포그래픽 생성'],
                    ['대시보드 통계', '기본 목록', '차트 시각화 + 트렌드 분석'],
                    ['내보내기', 'CSV 정도', 'HTML/이미지/DOCX/PDF'],
                  ].map(([item, old, ours], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{item}</td>
                      <td className="px-4 py-2.5 text-red-600">{old}</td>
                      <td className="px-4 py-2.5 text-emerald-700 font-medium">{ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 활용 시나리오 */}
          <section className="bg-white rounded-xl shadow-sm border border-cyan-200 p-6">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">5</span>
              <span className="bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">활용 시나리오</span>
            </h2>
            <div className="space-y-3">
              {[
                { who: '마케팅 담당자', scenario: '블로그, SNS 콘텐츠를 AI 검색에 최적화하여 자연 유입을 극대화합니다. 매달 수십 편의 콘텐츠를 일관된 품질로 빠르게 생산합니다.', color: 'blue' },
                { who: '중소기업 / 스타트업', scenario: '제한된 마케팅 예산으로도 대기업 수준의 SEO/AIO 최적화 콘텐츠를 생산하여 온라인 가시성을 확보합니다.', color: 'emerald' },
                { who: '콘텐츠 에이전시', scenario: '다양한 클라이언트의 콘텐츠를 표준화된 품질로 대량 생산하고, 분석 결과를 기반으로 성과를 입증합니다.', color: 'purple' },
                { who: '전문직 / 컨설턴트', scenario: '전문 지식을 AI가 인용하기 쉬운 형태로 변환하여 해당 분야의 온라인 권위를 구축합니다.', color: 'amber' },
              ].map((item) => (
                <div key={item.who} className={`bg-${item.color}-50 rounded-xl p-4 border border-${item.color}-200`}>
                  <h3 className={`text-xs font-semibold text-${item.color}-800 mb-2`}>{item.who}</h3>
                  <p className="text-[10px] text-gray-700">{item.scenario}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-7 text-center text-white">
            <h2 className="text-xl font-extrabold mb-3">AI 검색 시대, 지금 시작하세요</h2>
            <p className="text-sm text-white max-w-lg mx-auto mb-4">
              경쟁사보다 먼저 AI 검색엔진에 최적화된 콘텐츠를 만들어 보세요.
              GEOAIO가 당신의 콘텐츠를 AI가 선택하는 콘텐츠로 만들어 드립니다.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/generate" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
                콘텐츠 생성 시작하기
              </Link>
              <Link href="/analyze" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors border border-white/40">
                콘텐츠 분석하기
              </Link>
            </div>
          </section>

          {/* 연락처 & 법적 보호 */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-gray-800 mb-2">문의 및 연락처</h3>
                <div className="space-y-1 text-[10px] text-gray-600">
                  <p className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="font-semibold text-gray-800">심재우 대표</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <a href="tel:010-2397-5734" className="hover:text-indigo-600 transition-colors">010-2397-5734</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <a href="mailto:jaiwshim@gmail.com" className="hover:text-indigo-600 transition-colors">jaiwshim@gmail.com</a>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <p className="text-[10px] text-amber-800 font-medium">
                  본 서비스는 <span className="font-bold">특허 및 저작권 등록</span>을 통해 법적 보호를 받고 있습니다.
                </p>
              </div>
            </div>
          </section>

          {/* 푸터 라인 */}
          <div className="text-center text-[8pt] text-gray-400 pt-4 border-t border-gray-200">
            GEOAIO &mdash; AI 검색엔진 콘텐츠 최적화 플랫폼 &copy; 2026
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
