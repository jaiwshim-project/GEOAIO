'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';
import { createClient } from '@/lib/supabase-client';

const painPoints = [
  {
    icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
    title: '블로그 유입이 줄고 있다면',
    desc: 'AI가 검색 결과 위에 답변을 먼저 보여줍니다. 기존 블로그 글은 아래로 밀려나고, 클릭은 사라집니다.',
    stat: '블로그 클릭률 최대 40% 하락',
    color: 'red',
  },
  {
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'ChatGPT에 물어보면 경쟁사만 나온다면',
    desc: '"OO 추천해줘"라고 물었을 때, AI가 당신의 브랜드를 언급하지 않습니다. 경쟁사는 이미 인용되고 있습니다.',
    stat: '소비자 68%가 AI 검색 사용',
    color: 'amber',
  },
  {
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    title: '콘텐츠는 많은데 성과가 없다면',
    desc: '매달 수십 편을 발행하지만, AI가 인용할 수 없는 구조입니다. 양이 아니라 AI 친화도가 문제입니다.',
    stat: '콘텐츠 90%가 AI에 무시됨',
    color: 'purple',
  },
];

const beforeAfter = [
  {
    category: '블로그 마케팅',
    before: '키워드 반복 중심의 SEO 글 → 검색 순위만 신경',
    after: 'AI가 인용하는 구조화된 전문 콘텐츠 → 검색 + AI 동시 노출',
  },
  {
    category: '제품 설명',
    before: '스펙 나열 위주 → AI가 이해하지 못하는 형식',
    after: 'E-E-A-T 기반 신뢰성 있는 설명 → AI 추천 대상에 포함',
  },
  {
    category: 'FAQ / 가이드',
    before: '단순 Q&A 나열 → 구조화 부족',
    after: '스키마 최적화된 FAQ → Google AI Overview 직접 인용',
  },
  {
    category: '에이전시 보고서',
    before: '순위 변동만 보고 → 차별화 어려움',
    after: 'GEO/AIO 점수 + 개선 제안 → 프리미엄 서비스로 단가 상승',
  },
];

const steps = [
  {
    step: '01',
    title: '콘텐츠 입력',
    desc: '기존 블로그 글을 붙여넣거나, PDF/DOCX/PPTX 파일을 업로드하세요.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    step: '02',
    title: '즉시 분석',
    desc: 'AIO 점수, GEO 최적화도, E-E-A-T 신호, 키워드 밀도를 한눈에 확인합니다.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    step: '03',
    title: '자동 최적화',
    desc: '버튼 한 번이면 AI 검색에 최적화된 버전으로 자동 변환됩니다.',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  {
    step: '04',
    title: '발행 & 추적',
    desc: '최적화된 콘텐츠를 바로 복사/내보내기하고, 대시보드에서 성과를 추적하세요.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
];

const targetAudiences = [
  {
    who: '블로그 마케터',
    problem: '"글은 열심히 쓰는데 유입이 계속 줄어요"',
    solution: '기존 블로그 글을 그대로 넣으면, AI가 인용할 수 있는 구조로 자동 변환',
    result: 'SEO + AIO 동시 최적화로 유입 채널 확장',
    color: 'blue',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
  {
    who: '마케팅 에이전시',
    problem: '"경쟁사 에이전시와 차별화가 안 돼요"',
    solution: 'GEO/AIO 분석 리포트를 프리미엄 서비스로 추가, 클라이언트당 부가가치 상승',
    result: '새로운 서비스 라인 = 새로운 수익원',
    color: 'purple',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    who: '이커머스 셀러',
    problem: '"제품 검색하면 AI가 경쟁 제품만 추천해요"',
    solution: '제품 설명을 AI 추천 대상이 되는 형태로 최적화',
    result: 'AI 쇼핑 추천에서 자사 제품 노출 확률 증가',
    color: 'emerald',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  },
  {
    who: '중소기업 대표',
    problem: '"마케팅 팀이 없어서 콘텐츠를 못 만들어요"',
    solution: '주제만 입력하면 8가지 유형의 전문 콘텐츠를 AI가 자동 생성',
    result: '마케팅 팀 없이도 대기업 수준의 콘텐츠 품질',
    color: 'amber',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
];

const faqs = [
  {
    q: '기존 블로그 글도 최적화할 수 있나요?',
    a: '네, 기존 글을 붙여넣기하거나 파일(PDF, DOCX, PPTX)로 업로드하면 즉시 분석하고, 버튼 한 번으로 AI 최적화 버전으로 변환할 수 있습니다.',
  },
  {
    q: 'SEO를 이미 하고 있는데, 추가로 필요한가요?',
    a: 'SEO는 여전히 중요합니다. 하지만 Google 검색의 40% 이상에서 AI Overview가 표시되고 있어, SEO만으로는 놓치는 트래픽이 생깁니다. GEO/AIO 최적화는 기존 SEO에 더해 AI 검색까지 커버합니다.',
  },
  {
    q: '에이전시에서 클라이언트 보고서로 활용할 수 있나요?',
    a: '네, GEO/AIO 분석 점수와 개선 제안을 DOCX/PDF로 내보낼 수 있어 클라이언트 보고서에 바로 활용 가능합니다. 대시보드에서 히스토리 추적도 됩니다.',
  },
  {
    q: '어떤 AI 검색엔진에 최적화되나요?',
    a: 'Google AI Overview, ChatGPT, Gemini, Perplexity 등 주요 AI 검색엔진 모두에 최적화됩니다. E-E-A-T 신호와 구조화된 콘텐츠는 모든 AI 엔진에서 공통적으로 중요합니다.',
  },
  {
    q: '콘텐츠 생성 품질은 어떤가요?',
    a: 'Anthropic의 최신 Claude AI를 기반으로 하며, 비즈니스 정보와 참조 자료를 입력하면 브랜드에 맞는 고품질 콘텐츠를 생성합니다. A/B 버전 비교도 가능합니다.',
  },
];

export default function PromotionLandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showTesterModal, setShowTesterModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const analyzeHref = isLoggedIn ? '/analyze' : '/signup';
  const generateHref = isLoggedIn ? '/generate' : '/signup';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ============================================ */}
      {/* 히어로 섹션 - 핵심 메시지 */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168,85,247,0.3) 0%, transparent 50%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="h-14 sm:h-16 rounded-lg mx-auto mb-5" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-indigo-200 font-medium mb-5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI 검색 시대, 새로운 콘텐츠 전략이 필요합니다
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-3 leading-tight tracking-tight">
            당신의 콘텐츠,<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              AI가 인용하고 있나요?
            </span>
          </h1>

          <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto mb-3 leading-relaxed">
            ChatGPT, Gemini, Google AI Overview에 물어보세요.<br />
            당신의 브랜드가 답변에 나오나요?
          </p>

          <p className="text-base text-gray-400 max-w-xl mx-auto mb-3">
            기존 블로그 글을 넣으면 <span className="text-white font-semibold">즉시 분석</span>하고,
            <span className="text-white font-semibold"> 버튼 한 번</span>으로
            AI가 선택하는 콘텐츠로 바꿔드립니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <Link
              href={analyzeHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 text-base font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl shadow-indigo-900/30 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              내 콘텐츠 무료 분석하기
            </Link>
            <Link
              href={generateHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-base font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              AI 콘텐츠 생성하기
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Claude AI 기반</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>특허기술 &middot; 저작권 등록 보호</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>8가지 콘텐츠 유형</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>PDF/DOCX 내보내기</span>
            </div>
          </div>
        </div>
      </section>

      {/* 초기 테스터 모집 배너 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-xl p-5 text-white shadow-lg border border-emerald-300 overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-base font-bold">초기 테스터 모집 중</h3>
                <span className="px-2.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">FREE</span>
              </div>
              <p className="text-white text-sm">지금 신청하시면 <strong>모든 기능을 무료</strong>로 체험할 수 있습니다. 선착순 마감!</p>
            </div>
            <a
              href="https://forms.gle/RdniybCMpa6V77dw9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all shadow-md shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              테스터 신청하기
            </a>
          </div>
        </div>
      </section>

      {/* 소개 영상 섹션 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-5">
          <h2 className="text-lg font-extrabold text-gray-900 mb-2">서비스 소개 영상</h2>
          <p className="text-sm text-gray-500">3분만에 GEOAIO의 핵심 기능을 확인하세요</p>
        </div>
        <div className="relative rounded-xl overflow-hidden shadow-lg border border-indigo-200">
          {/* TODO: YouTube 영상 ID를 실제 값으로 교체하세요 */}
          <iframe
            className="w-full aspect-video"
            src="https://www.youtube.com/embed/t_AyFBhxzII"
            title="GEOAIO 서비스 소개"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* 자료 이미지 섹션 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <img src="/ai-search-choice.png" alt="AI 검색 엔진의 선택" className="w-full rounded-xl shadow-md border border-indigo-200" />
      </section>

      {/* ============================================ */}
      {/* 문제 인식 섹션 */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-3">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">
            이런 고민, 하고 계시죠?
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            AI가 검색을 장악하면서, 기존 방식의 블로그 마케팅이 한계에 부딪히고 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 bg-${point.color}-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <svg className={`w-6 h-6 text-${point.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={point.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">{point.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{point.desc}</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-${point.color}-50 text-${point.color}-700 text-xs font-semibold rounded-lg border border-${point.color}-200`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {point.stat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* 핵심 질문 섹션 */}
      {/* ============================================ */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-lg font-extrabold text-white mb-3">
            지금 테스트해 보세요
          </h2>
          <p className="text-sm text-blue-100 mb-5 max-w-2xl mx-auto leading-relaxed">
            ChatGPT나 Gemini에 당신의 업종 키워드를 검색해 보세요.<br />
            <span className="font-bold text-white">&ldquo;OO 분야 추천해줘&rdquo;</span> &mdash; 당신의 브랜드가 나오나요?<br />
            안 나온다면, 경쟁사에게 고객을 빼앗기고 있는 것입니다.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-5 max-w-lg mx-auto">
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-xs mb-1">ChatGPT에게 물어보기</p>
                <p className="text-white text-sm font-medium">&ldquo;서울에서 가장 좋은 [당신의 업종] 추천해줘&rdquo;</p>
                <p className="text-blue-200 text-xs mt-2">
                  → 여기에 당신의 브랜드가 없다면, GEO/AIO 최적화가 필요합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Before / After 섹션 */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-3">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">
            기존 방식 vs GEO/AIO 최적화
          </h2>
          <p className="text-sm text-gray-500">
            같은 콘텐츠도 AI가 선택하는 구조로 바꾸면 결과가 달라집니다.
          </p>
        </div>

        <div className="space-y-3">
          {beforeAfter.map((item) => (
            <div key={item.category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto_1fr] items-center">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-5 py-4 md:py-6 text-center">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{item.category}</span>
                </div>
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">{item.before}</p>
                </div>
                <div className="hidden md:flex items-center justify-center px-2">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="px-5 py-4 flex items-start gap-3 bg-emerald-50/50">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{item.after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* 사용 방법 (4단계) */}
      {/* ============================================ */}
      <section className="bg-gradient-to-br from-gray-900 to-indigo-950 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-3">
            <h2 className="text-lg font-extrabold text-white mb-3">
              3분이면 충분합니다
            </h2>
            <p className="text-sm text-gray-400">
              복잡한 설정 없이, 콘텐츠를 넣으면 바로 결과가 나옵니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-indigo-500/50 to-transparent z-0" />
                )}
                <div className="relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-all">
                  <div className="text-lg font-extrabold text-indigo-400/30 mb-3">{s.step}</div>
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 타겟 고객별 메시지 */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-3">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">
            누구에게 필요한가요?
          </h2>
          <p className="text-sm text-gray-500">
            당신의 상황에 맞는 활용법을 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targetAudiences.map((ta) => (
            <div
              key={ta.who}
              className={`bg-white rounded-xl shadow-sm border border-${ta.color}-100 hover:border-${ta.color}-300 hover:shadow-md transition-all p-5`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 bg-gradient-to-br from-${ta.color}-500 to-${ta.color}-600 rounded-xl flex items-center justify-center`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ta.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{ta.who}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-sm mt-0.5 shrink-0">고민</span>
                  <p className="text-sm text-gray-600 italic">{ta.problem}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`text-${ta.color}-600 text-sm mt-0.5 shrink-0`}>해결</span>
                  <p className="text-sm text-gray-700">{ta.solution}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 bg-${ta.color}-50 rounded-lg border border-${ta.color}-200`}>
                  <svg className={`w-4 h-4 text-${ta.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className={`text-sm font-semibold text-${ta.color}-700`}>{ta.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* 산업 분야별 활용 섹션 */}
      {/* ============================================ */}
      <section className="bg-gradient-to-br from-slate-50 to-gray-100 py-14 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-3">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">
              어떤 산업이든, AI 검색에 대비해야 합니다
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              고객이 AI에게 &ldquo;추천해줘&rdquo;라고 물을 때, 당신의 비즈니스가 답변에 포함되어야 합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              {
                emoji: '🍽️',
                name: '음식/요식업',
                example: '"강남 맛집 추천해줘"',
                pain: '리뷰 사이트에만 의존하면 AI가 추천 못함',
                benefit: '메뉴, 분위기, 후기를 AI가 인용하는 구조로 최적화',
                borderClass: 'border-orange-100 hover:border-orange-300',
                textClass: 'text-orange-600',
              },
              {
                emoji: '🏪',
                name: '소매/유통',
                example: '"가성비 좋은 OO 추천"',
                pain: '상품 스펙만 나열하면 AI가 경쟁사 제품을 추천',
                benefit: '제품 비교, 장단점을 AI 친화 구조로 변환',
                borderClass: 'border-blue-100 hover:border-blue-300',
                textClass: 'text-blue-600',
              },
              {
                emoji: '💅',
                name: '뷰티/미용',
                example: '"피부 타입별 화장품 추천"',
                pain: '블로그 체험기가 AI 검색에 노출되지 않음',
                benefit: '성분, 효과, 사용법을 E-E-A-T 기반으로 구조화',
                borderClass: 'border-pink-100 hover:border-pink-300',
                textClass: 'text-pink-600',
              },
              {
                emoji: '💪',
                name: '헬스/피트니스',
                example: '"초보자 헬스 루틴 알려줘"',
                pain: '운동법 콘텐츠가 AI 답변에 인용되지 않음',
                benefit: '전문성 있는 가이드로 AI 피트니스 추천에 포함',
                borderClass: 'border-red-100 hover:border-red-300',
                textClass: 'text-red-600',
              },
              {
                emoji: '🎓',
                name: '교육/학원',
                example: '"영어 학원 추천해줘"',
                pain: '학원 홍보 글이 AI에게 신뢰받지 못함',
                benefit: '커리큘럼, 성과 데이터를 AI가 인용하는 형태로 제작',
                borderClass: 'border-indigo-100 hover:border-indigo-300',
                textClass: 'text-indigo-600',
              },
              {
                emoji: '💻',
                name: 'IT/테크',
                example: '"프로젝트 관리 툴 비교"',
                pain: '기술 문서가 AI 검색에서 경쟁사에 밀림',
                benefit: '기술 비교, 사례를 구조화하여 AI 추천 1순위 확보',
                borderClass: 'border-cyan-100 hover:border-cyan-300',
                textClass: 'text-cyan-600',
              },
              {
                emoji: '🏥',
                name: '의료/건강',
                example: '"무릎 통증 원인과 치료법"',
                pain: '의료 정보의 E-E-A-T가 부족하면 AI가 무시',
                benefit: '전문의 경험 기반 콘텐츠로 의료 AI 답변에 인용',
                borderClass: 'border-emerald-100 hover:border-emerald-300',
                textClass: 'text-emerald-600',
              },
              {
                emoji: '💰',
                name: '금융/보험',
                example: '"30대 보험 추천해줘"',
                pain: '금융 상품 설명이 AI 비교 답변에 빠짐',
                benefit: '상품 비교, FAQ를 AI가 참조하는 구조로 최적화',
                borderClass: 'border-amber-100 hover:border-amber-300',
                textClass: 'text-amber-600',
              },
              {
                emoji: '🏠',
                name: '부동산',
                example: '"신혼부부 아파트 추천"',
                pain: '매물 정보만으로는 AI가 추천하지 않음',
                benefit: '지역 분석, 투자 가이드를 AI 인용 가능하게 제작',
                borderClass: 'border-teal-100 hover:border-teal-300',
                textClass: 'text-teal-600',
              },
              {
                emoji: '✈️',
                name: '여행/관광/숙박',
                example: '"제주도 3박4일 코스 추천"',
                pain: '여행 블로그가 AI 여행 플래너에 반영 안 됨',
                benefit: '코스, 숙소, 맛집을 구조화하여 AI 여행 추천에 포함',
                borderClass: 'border-sky-100 hover:border-sky-300',
                textClass: 'text-sky-600',
              },
              {
                emoji: '⚖️',
                name: '법률/컨설팅',
                example: '"이혼 절차 알려줘"',
                pain: '법률 콘텐츠의 전문성이 AI에게 전달되지 않음',
                benefit: '법률 FAQ, 절차 가이드를 AI가 신뢰하는 형태로 변환',
                borderClass: 'border-violet-100 hover:border-violet-300',
                textClass: 'text-violet-600',
              },
              {
                emoji: '📦',
                name: '기타 산업',
                example: '"OO 분야 전문 업체 추천"',
                pain: '어떤 분야든 AI 검색에 빠지면 고객을 잃음',
                benefit: '업종 맞춤 콘텐츠를 AI 최적화 구조로 자동 생성',
                borderClass: 'border-gray-200 hover:border-gray-400',
                textClass: 'text-gray-600',
              },
            ].map((industry) => (
              <div
                key={industry.name}
                className={`group bg-white rounded-xl p-5 border ${industry.borderClass} hover:shadow-lg transition-all duration-300 cursor-default`}
              >
                <div className="text-lg mb-3">{industry.emoji}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{industry.name}</h3>
                <p className={`text-xs font-semibold ${industry.textClass} mb-2`}>{industry.example}</p>
                <div className="hidden group-hover:block transition-all">
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-start gap-1.5">
                      <span className="text-red-400 text-xs mt-0.5 shrink-0">&#10005;</span>
                      <p className="text-xs text-gray-500 leading-relaxed">{industry.pain}</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-500 text-xs mt-0.5 shrink-0">&#10003;</span>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">{industry.benefit}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 mb-5">
              어떤 산업이든 AI에게 물어보는 시대가 왔습니다. 지금 당신의 업종을 테스트해 보세요.
            </p>
            <Link
              href={analyzeHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              내 업종 콘텐츠 분석해 보기
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 핵심 기능 하이라이트 */}
      {/* ============================================ */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-3">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">
              분석부터 생성, 변환까지 원스톱
            </h2>
            <p className="text-sm text-gray-500">
              10가지 핵심 기능으로 AI 검색 시대를 완벽하게 대비합니다.
            </p>
          </div>

          {/* 콘텐츠 분석 프로세스 */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">A</span>
              콘텐츠 분석 &rarr; AI 최적화 변환
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '01', title: '콘텐츠 입력', desc: '기존 콘텐츠를 붙여넣거나 PDF/DOCX/PPTX 파일을 업로드', color: 'blue', tags: [] },
                { step: '02', title: '종합 분석', desc: 'GEO/AIO 점수, E-E-A-T 평가, 키워드 밀도를 종합 분석', color: 'purple', tags: ['AIO 점수', 'GEO 점수', 'E-E-A-T', '키워드'] },
                { step: '03', title: '개선 제안', desc: '우선순위별 구체적인 최적화 액션 아이템 제시', color: 'amber', tags: [] },
                { step: '04', title: 'AI 최적화 변환', desc: '분석 결과 바탕으로 AI가 최적화 콘텐츠를 자동 생성', color: 'rose', tags: ['최적화 콘텐츠', '변경사항 요약', '예상 점수'] },
              ].map((s) => (
                <div key={s.step} className={`relative rounded-xl p-5 border border-${s.color}-200 bg-${s.color}-50/30 hover:border-${s.color}-400 hover:shadow-md transition-all`}>
                  <div className={`text-lg font-extrabold text-${s.color}-200 mb-2`}>{s.step}</div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{s.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                  {s.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.tags.map(t => (
                        <span key={t} className={`px-1.5 py-0.5 text-[10px] font-medium bg-${s.color}-100 text-${s.color}-700 rounded`}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 콘텐츠 생성 & 추가 기능 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">B</span>
              콘텐츠 생성 & 확장 기능
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: 'AI 콘텐츠 생성', desc: '블로그, 제품 설명, FAQ, How-to 등 8가지 유형의 GEO/AIO 최적화 콘텐츠를 자동 생성', color: 'emerald', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
              { title: 'A/B 버전 생성', desc: '전문적·친근한·설득적 3가지 톤으로 동시 생성하여 최적의 콘텐츠를 비교 선택', color: 'amber', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { title: 'SNS 채널별 변환', desc: '인스타그램, 링크드인, 네이버 블로그, 카드뉴스, 요약본으로 자동 변환', color: 'pink', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
              { title: '키워드 경쟁 분석', desc: '타겟 키워드의 경쟁 난이도, 검색 의도, AI 인용 핵심 요소, 차별화 전략 분석', color: 'teal', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
              { title: '시리즈 기획', desc: '하나의 주제로 3~12편의 연재 시리즈를 자동 기획, 에피소드별 키워드·개요 제공', color: 'violet', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
              { title: 'AI 인포그래픽 이미지', desc: 'Gemini AI로 콘텐츠에 맞는 인포그래픽 이미지 3장을 자동 생성하여 본문에 삽입', color: 'sky', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
            ].map((feat) => (
              <div key={feat.title} className={`rounded-xl p-5 border border-${feat.color}-100 bg-${feat.color}-50/30 hover:border-${feat.color}-300 hover:shadow-md transition-all`}>
                <div className={`w-11 h-11 bg-gradient-to-br from-${feat.color}-500 to-${feat.color}-600 rounded-xl flex items-center justify-center mb-3`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 에이전시 특별 섹션 */}
      {/* ============================================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200 p-5 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full mb-3">
                FOR AGENCIES
              </div>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3">
                마케팅 에이전시를 위한<br />
                <span className="text-violet-600">새로운 수익 모델</span>
              </h2>
              <p className="text-gray-600 mb-3 leading-relaxed">
                기존 블로그 마케팅 서비스에 GEO/AIO 최적화를 추가하면,
                경쟁 에이전시와 차별화되는 프리미엄 서비스를 제공할 수 있습니다.
              </p>
              <ul className="space-y-3">
                {[
                  'GEO/AIO 분석 리포트를 클라이언트 보고서에 포함',
                  '기존 서비스 + AI 최적화 = 패키지 단가 상승',
                  '대시보드로 클라이언트별 성과 추적 & 리포트',
                  '"AI 검색 대응" 신규 서비스 라인으로 영업 확장',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-violet-200 p-5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">수익 시뮬레이션</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">기존 블로그 마케팅 단가</span>
                  <span className="text-sm font-bold text-gray-900">월 100만원</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">+ GEO/AIO 최적화 추가</span>
                  <span className="text-sm font-bold text-violet-600">+30~50만원</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">+ AI 분석 리포트 제공</span>
                  <span className="text-sm font-bold text-violet-600">+20만원</span>
                </div>
                <div className="flex items-center justify-between py-3 bg-violet-50 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-bold text-gray-900">클라이언트당 월 매출</span>
                  <span className="text-sm font-extrabold text-violet-700">150~170만원</span>
                </div>
                <p className="text-xs text-gray-400 text-center">클라이언트 10곳 기준 월 500~700만원 추가 매출</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ 섹션 */}
      {/* ============================================ */}
      <section className="bg-gray-50 py-14 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-3">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">
              자주 묻는 질문
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-start gap-2">
                  <span className="text-indigo-500 shrink-0">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 최종 CTA */}
      {/* ============================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-lg font-extrabold text-white mb-3">
            AI가 선택하는 콘텐츠,<br />지금 만들어 보세요
          </h2>
          <p className="text-sm text-blue-100 mb-3 max-w-2xl mx-auto">
            기존 블로그 글을 붙여넣기만 하면 3분 안에 결과를 확인할 수 있습니다.
          </p>
          <p className="text-base text-blue-200 mb-3">
            설치 없음 &middot; 간편 회원가입 &middot; 즉시 시작
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={analyzeHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 text-base font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              내 콘텐츠 분석하기
            </Link>
            <Link
              href={generateHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/15 text-white text-base font-bold rounded-xl hover:bg-white/25 transition-all border border-white/30 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              새 콘텐츠 생성하기
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 연락처 */}
      {/* ============================================ */}
      <section className="bg-white py-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-sm font-bold text-gray-900 mb-1">도입 문의 & 상담</h3>
              <p className="text-sm text-gray-500">에이전시/기업 맞춤 상담을 도와드립니다.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold">심재우 대표</span>
              </div>
              <a href="tel:010-2397-5734" className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                010-2397-5734
              </a>
              <a href="mailto:jaiwshim@gmail.com" className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                jaiwshim@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />
    </div>
  );
}
