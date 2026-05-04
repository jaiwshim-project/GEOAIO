'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ApiKeyPanel from '@/components/ApiKeyPanel';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';
import { useUser } from '@/lib/user-context';

const features = [
  {
    title: 'AIO 점수 분석',
    description: 'AI Overview 노출 확률, 구조화된 답변 적합성, 명확성, 인용 가능성을 종합 평가합니다.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: 'from-blue-500 to-indigo-600',
    card: 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md',
  },
  {
    title: 'GEO 최적화',
    description: 'AI 검색엔진 친화도, E-E-A-T 신호, 구조화 데이터, 의미적 완성도를 분석합니다.',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    color: 'from-violet-500 to-purple-600',
    card: 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-md',
  },
  {
    title: 'AI 최적화 변환',
    description: '분석 결과를 바탕으로 기존 콘텐츠를 AI 검색에 최적화된 버전으로 자동 변환합니다.',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    color: 'from-rose-500 to-pink-600',
    card: 'bg-white border-gray-200 hover:border-rose-300 hover:shadow-md',
  },
  {
    title: 'AI 콘텐츠 생성',
    description: '블로그, 제품 설명, FAQ, How-to 등 8가지 유형의 GEO/AIO 최적화 콘텐츠를 생성합니다.',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: 'from-emerald-500 to-teal-600',
    card: 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md',
  },
  {
    title: 'A/B 버전 생성',
    description: '전문적, 친근한, 설득적 3가지 톤으로 동시 생성하여 최적의 콘텐츠를 선택할 수 있습니다.',
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'from-amber-500 to-orange-600',
    card: 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-md',
  },
  {
    title: 'SNS 채널별 변환',
    description: '생성된 콘텐츠를 인스타그램, 링크드인, 네이버 블로그, 카드뉴스 등으로 자동 변환합니다.',
    icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    color: 'from-pink-500 to-rose-600',
    card: 'bg-white border-gray-200 hover:border-pink-300 hover:shadow-md',
  },
  {
    title: '키워드 경쟁 분석',
    description: '타겟 키워드의 경쟁 난이도, 검색 의도, AI 인용 핵심 요소, 차별화 전략을 분석합니다.',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    color: 'from-teal-500 to-cyan-600',
    card: 'bg-white border-gray-200 hover:border-teal-300 hover:shadow-md',
  },
  {
    title: '콘텐츠 시리즈 기획',
    description: '하나의 주제로 3~12편의 연재 시리즈를 자동 기획하여 체계적인 콘텐츠 전략을 수립합니다.',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    color: 'from-violet-500 to-indigo-600',
    card: 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-md',
  },
  {
    title: '대시보드 통계',
    description: '생성/분석 이력을 시각화된 통계와 차트로 확인하고 월별 트렌드를 파악합니다.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: 'from-sky-500 to-blue-600',
    card: 'bg-white border-gray-200 hover:border-sky-300 hover:shadow-md',
  },
];

const targetAudiences = [
  {
    who: '블로그 마케터',
    problem: '글은 열심히 쓰는데 유입이 계속 줄어요',
    solution: '기존 글을 AI 인용 구조로 자동 변환',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    who: '마케팅 에이전시',
    problem: '경쟁사 에이전시와 차별화가 안 돼요',
    solution: 'GEO/AIO 분석 리포트로 프리미엄 서비스',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    who: '이커머스 셀러',
    problem: 'AI가 경쟁 제품만 추천해요',
    solution: '제품 설명을 AI 추천 대상 형태로 최적화',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    who: '중소기업 대표',
    problem: '마케팅 팀이 없어서 콘텐츠를 못 만들어요',
    solution: '주제만 입력하면 전문 콘텐츠 생성',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    gradient: 'from-amber-500 to-orange-600',
  },
];

interface Review {
  user_name: string;
  rating: number;
  content: string;
}

export default function LandingPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showTesterModal, setShowTesterModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // 마운트 직후 sessionStorage 즉시 확인
    try { setIsLoggedIn(!!sessionStorage.getItem('geoaio_user')); } catch {}
  }, []);

  useEffect(() => {
    // currentUser 변경 시 동기화
    try { setIsLoggedIn(!!currentUser || !!sessionStorage.getItem('geoaio_user')); } catch {}
  }, [currentUser]);

  useEffect(() => {
    fetch('/api/community/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) setReviews(data.reviews.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        showApiKeyButton
        onToggleApiKey={() => setShowApiKey(!showApiKey)}
        apiKeyOpen={showApiKey}
      />

      {/* ========== 다크 히어로 섹션 ========== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168,85,247,0.3) 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="h-14 sm:h-16 rounded-lg mx-auto mb-6" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-indigo-200 font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI 검색 시대, 새로운 콘텐츠 전략
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            AI 검색엔진에 최적화된<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              콘텐츠를 분석하고 생성하세요
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            AIO(AI Overview)와 GEO(Generative Engine Optimization) 관점에서
            콘텐츠를 종합 분석하고, AI 검색에 최적화된 고품질 콘텐츠를 자동으로 생성합니다.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <button
              onClick={() => router.push(isLoggedIn ? '/user-dashboard' : '/user-select')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl shadow-indigo-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {isLoggedIn ? '프로젝트 선택/추가' : '사용자 선택'}
            </button>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              콘텐츠 분석
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              콘텐츠 생성
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { href: '/landing', label: '홍보페이지' },
              { href: '/introduction', label: '소개자료' },
              { href: '/manual', label: '매뉴얼' },
              { href: '/dashboard', label: '대시보드' },
              { href: '/dashboard/indexing', label: '📊 색인 모니터링' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs font-medium text-white hover:text-white hover:bg-white/10 rounded-lg transition-all border border-gray-400"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/settings"
              className="px-3 py-1.5 text-xs font-medium text-white hover:text-white hover:bg-white/10 rounded-lg transition-all border border-gray-400"
            >
              API 키
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Claude AI 기반</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>특허 &middot; 저작권 등록</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>8가지 콘텐츠 유형</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>PDF/DOCX 내보내기</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 핵심 숫자 통계 ========== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { number: '40%+', label: 'Google 검색에 AI Overview 표시', color: 'text-blue-600' },
            { number: '8가지', label: '콘텐츠 유형 생성', color: 'text-violet-600' },
            { number: '3분', label: '분석부터 최적화까지', color: 'text-emerald-600' },
            { number: '100점', label: 'GEO/AIO 점수 분석 제공', color: 'text-amber-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center">
              <div className={`text-2xl font-extrabold ${stat.color} mb-1`}>{stat.number}</div>
              <p className="text-[11px] text-gray-500 leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 지원 AI 검색엔진 ========== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">지원 AI 검색 플랫폼</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {[
            { name: 'Google AI Overview', icon: 'G', bg: 'bg-blue-50 text-blue-600 border-blue-200' },
            { name: 'ChatGPT / SearchGPT', icon: 'C', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
            { name: 'Gemini', icon: 'G', bg: 'bg-violet-50 text-violet-600 border-violet-200' },
            { name: 'Perplexity AI', icon: 'P', bg: 'bg-amber-50 text-amber-600 border-amber-200' },
            { name: 'Microsoft Copilot', icon: 'M', bg: 'bg-sky-50 text-sky-600 border-sky-200' },
          ].map((platform) => (
            <div key={platform.name} className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border ${platform.bg}`}>
                {platform.icon}
              </div>
              <span className="text-xs font-medium text-gray-600">{platform.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 자료 이미지 ========== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <img src="/ai-search-victory.png" alt="AI 검색 시대의 승리" className="w-full rounded-xl shadow-lg border border-gray-200" />
      </section>

      {/* ========== 주요 기능 소개 ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">주요 기능</h2>
          <p className="text-sm text-gray-500">AI 검색엔진 최적화를 위한 올인원 솔루션</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-xl p-5 shadow-sm border transition-all duration-200 group ${feature.card}`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1.5">{feature.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 콘텐츠 분석 프로세스 ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">콘텐츠 분석 &rarr; AI 최적화 변환</h2>
          <p className="text-sm text-gray-500">내 콘텐츠를 입력하면, AI가 분석하고 최적화된 버전까지 자동으로 제공합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mb-3">1</div>
            <h4 className="text-sm font-bold text-gray-900 mb-1.5">콘텐츠 입력</h4>
            <p className="text-xs text-gray-500">기존에 작성한 콘텐츠를 입력하고 타겟 키워드를 설정합니다.</p>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
          <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mb-3">2</div>
            <h4 className="text-sm font-bold text-gray-900 mb-1.5">종합 분석</h4>
            <p className="text-xs text-gray-500">GEO/AIO 점수, E-E-A-T 평가, 키워드 밀도, 구조화 수준을 종합 분석합니다.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600 rounded">AIO 점수</span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-600 rounded">GEO 점수</span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded">E-E-A-T</span>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
          <div className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mb-3">3</div>
            <h4 className="text-sm font-bold text-gray-900 mb-1.5">개선 제안</h4>
            <p className="text-xs text-gray-500">우선순위별 구체적인 최적화 액션 아이템과 Before/After 예시를 제공합니다.</p>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-200 shadow-sm">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mb-3">4</div>
            <h4 className="text-sm font-bold text-gray-900 mb-1.5">AI 최적화 변환</h4>
            <p className="text-xs text-gray-500">분석 결과를 바탕으로 AI가 최적화된 버전의 콘텐츠를 생성합니다.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 rounded">최적화 콘텐츠</span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 rounded">변경사항 요약</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 mb-1.5">콘텐츠 생성도 한 번에</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                기존 콘텐츠가 없어도 괜찮습니다. 주제와 키워드만 입력하면 처음부터 GEO/AIO 최적화된 콘텐츠를 생성하고,
                A/B 버전 비교, SNS 채널별 변환, 인포그래픽 이미지 생성까지 한 번에 제공합니다.
              </p>
            </div>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shrink-0"
            >
              콘텐츠 생성하기
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 누가 사용하나요? (타겟 고객) ========== */}
      <section className="bg-gradient-to-br from-slate-50 to-gray-100 py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">누가 사용하나요?</h2>
            <p className="text-sm text-gray-500">당신의 상황에 맞는 활용법을 확인하세요</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {targetAudiences.map((ta) => (
              <div key={ta.who} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className={`w-10 h-10 bg-gradient-to-br ${ta.gradient} rounded-lg flex items-center justify-center mb-3`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ta.icon} />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">{ta.who}</h4>
                <p className="text-xs text-red-500 mb-1.5 italic">&ldquo;{ta.problem}&rdquo;</p>
                <p className="text-xs text-gray-600">{ta.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 사용자 후기 ========== */}
      {reviews.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">사용자 후기</h2>
            {avgRating && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(Number(avgRating)) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-lg font-bold text-amber-600">{avgRating}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3">{r.content}</p>
                <p className="text-xs text-gray-400 font-medium">{r.user_name}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link
              href="/community"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-all"
            >
              후기 더보기 &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* ========== 초기 테스터 모집 배너 ========== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-xl p-5 text-white shadow-lg overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-sm font-bold">초기 테스터 모집 중</h3>
                <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full">FREE</span>
              </div>
              <p className="text-white text-xs">지금 신청하시면 <strong>모든 기능을 무료</strong>로 체험할 수 있습니다. 선착순 마감!</p>
            </div>
            <a
              href="https://forms.gle/RdniybCMpa6V77dw9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all shadow-md shrink-0"
            >
              테스터 신청하기
            </a>
          </div>
        </div>
      </section>

      {/* API Key 입력 패널 */}
      <ApiKeyPanel visible={showApiKey} />

      {/* ========== CTA 섹션 ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 text-center shadow-lg">
          <h3 className="text-lg font-bold text-white mb-2">지금 바로 시작하세요</h3>
          <p className="text-indigo-100 text-sm mb-5 max-w-lg mx-auto">
            콘텐츠를 입력하면 즉시 GEO/AIO 분석 결과와 구체적인 개선 방안을 확인할 수 있습니다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-all"
            >
              콘텐츠 분석
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white text-sm font-semibold rounded-lg hover:bg-white/25 transition-all border border-white/30"
            >
              콘텐츠 생성
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />
    </div>
  );
}
