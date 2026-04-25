'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [contactModal, setContactModal] = useState<'pro' | 'max' | 'premium' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
      {/* 프리미엄 배경 텍스처 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.08),_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.06),_transparent_60%)] pointer-events-none" />

      <Header />
      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 히어로 — 프리미엄 다크 + 골드 */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 sm:px-10 py-10 mb-6 ring-1 ring-amber-400/20 shadow-[0_20px_60px_-15px_rgba(251,191,36,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.15),_transparent_50%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-amber-300">PRICING</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
              <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">GEO-AIO</span>
              <span className="block text-white/95 mt-1">가격표</span>
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mt-3">
              AI 검색 시대, 콘텐츠가 AI에 의해 발견되고 인용되기 위한 전략적 도구
            </p>
            <p className="text-amber-200/70 text-xs sm:text-sm mt-2">
              제미나이 AI 기반 · 특허 · 저작권 등록 완료
            </p>
          </div>
        </section>

        {/* 본문 컨테이너 — 라이트 카드 */}
        <article className="bg-white rounded-2xl ring-1 ring-amber-200/40 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          <div className="p-6 sm:p-10 space-y-8">

        {/* 비교 배너 */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💰</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-emerald-800 mb-2">기존 블로그 마케팅 업체 vs GEO-AIO</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white rounded-lg p-3 border border-rose-200">
                  <p className="text-rose-600 font-bold mb-1">📋 블로그 마케팅 업체</p>
                  <p className="text-gray-600">월 <strong>200~300만원</strong> · 포스팅 <strong>15개</strong></p>
                  <p className="text-gray-500">건당 약 13~20만원</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-emerald-600 font-bold mb-1">🚀 GEO-AIO 서비스</p>
                  <p className="text-gray-600">월 <strong>200만원</strong> · 포스팅 <strong>100개</strong></p>
                  <p className="text-gray-500">건당 단 <strong className="text-emerald-700">2만원</strong> (1/10)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 세 가지 플랜 */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {/* 프로 플랜 */}
          <div className="relative bg-white rounded-2xl border-2 border-blue-300 p-6 shadow-md hover:shadow-xl transition-all">
            <div className="absolute -top-3 left-6 px-3 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full">
              프로 (Pro)
            </div>

            <div className="mt-2 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">월간 결제</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-blue-600">200</span>
                <span className="text-lg font-bold text-gray-700">만원</span>
                <span className="text-sm text-gray-500 ml-1">/월</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">부가세 별도 · 은행계좌 자동이체</p>
              <p className="text-xs text-gray-400">연간 기준 2,400만원</p>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-xs font-bold text-gray-700 mb-3">✓ 포함 사항</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">●</span>
                  <span>GEO-AIO 플랫폼 엔진으로 AI 최적화된 홍보글 생성 및 포스팅 대행</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">●</span>
                  <span>E-E-A-T 포맷 적용으로 AI 인용 최적화</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">●</span>
                  <span className="font-bold text-blue-700">월 최대 100건 (연 1,200건) 콘텐츠 생성</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">●</span>
                  <span>기술 지원 · 상담</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setContactModal('pro')}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm text-sm"
            >
              프로 플랜 문의하기
            </button>
          </div>

          {/* 맥스 플랜 — 프리미엄 골드 ring */}
          <div className="relative bg-gradient-to-br from-white via-amber-50/30 to-white rounded-2xl ring-2 ring-amber-300/60 p-6 shadow-[0_12px_40px_-10px_rgba(251,191,36,0.4)] hover:shadow-[0_20px_60px_-10px_rgba(251,191,36,0.5)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent rounded-t-2xl" />
            <div className="absolute -top-3 left-6 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-bold rounded-full shadow-md">
              맥스 (Max)
            </div>
            <div className="absolute -top-3 right-6 px-3 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              20% 특별 할인
            </div>

            <div className="mt-2 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">연간 결제 (추천)</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">1,440</span>
                <span className="text-lg font-bold text-gray-700">만원</span>
                <span className="text-sm text-gray-400 line-through">1,920만원</span>
                <span className="text-xs font-bold text-rose-600">(20% 할인)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">부가세 별도</p>
              <p className="text-xs font-bold text-rose-600">월 120만원 상당 = 연 20% 절감</p>
              <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">※ 본 할인 이벤트는 사전 예고 없이 원래 가격으로 환원될 수 있습니다.</p>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-xs font-bold text-gray-700 mb-3">✓ 포함 사항</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">●</span>
                  <span>GEO-AIO 플랫폼 엔진으로 AI 최적화된 홍보글 생성 및 포스팅 대행</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">●</span>
                  <span>E-E-A-T 포맷 적용으로 AI 인용 최적화</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">●</span>
                  <span className="font-bold text-violet-700">월 최대 150건 (연 1,800건) 콘텐츠 생성</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">●</span>
                  <span>우선 기술 지원</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">★</span>
                  <span className="font-bold text-rose-600">브랜드뉴스 기사 2회</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">★</span>
                  <span className="font-bold text-rose-600">소개영상 (유튜브 게시) 2회</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setContactModal('max')}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-bold rounded-xl hover:shadow-[0_8px_24px_-4px_rgba(251,191,36,0.6)] hover:scale-[1.02] transition-all shadow-md text-sm ring-1 ring-amber-400"
            >
              맥스 플랜 문의하기
            </button>
          </div>

          {/* 프리미엄 플랜 — 다크 럭셔리 */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl ring-2 ring-violet-400/40 p-6 shadow-[0_12px_40px_-10px_rgba(139,92,246,0.5)] hover:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.6)] transition-all text-white">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent rounded-t-2xl" />
            <div className="absolute -top-3 left-6 px-3 py-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold rounded-full shadow-md">
              프리미엄 (Premium)
            </div>
            <div className="absolute -top-3 right-6 px-3 py-0.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-[10px] font-bold rounded-full tracking-wider">
              ENTERPRISE
            </div>

            <div className="mt-2 mb-4">
              <p className="text-xs font-semibold text-violet-200 mb-1">1년 계약 · 분기별 결제</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">540</span>
                <span className="text-lg font-bold text-white/80">만원</span>
                <span className="text-sm text-white/60">/분기</span>
              </div>
              <p className="text-xs text-white/60 mt-1">부가세 별도</p>
              <p className="text-xs font-bold text-violet-300">연 2,160만원 (4회 분기 결제)</p>
            </div>

            <div className="border-t border-white/10 pt-4 mb-4">
              <p className="text-xs font-bold text-violet-200 mb-3">✓ 포함 사항</p>
              <ul className="space-y-2 text-sm text-white/85">
                <li className="flex items-start gap-2">
                  <span className="text-violet-300 mt-0.5">●</span>
                  <span>맥스 플랜 모든 혜택 포함</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-300 mt-0.5">●</span>
                  <span className="font-bold text-violet-200">엔터프라이즈 맞춤 컨설팅</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-300 mt-0.5">●</span>
                  <span>전담 매니저 배정</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-300 mt-0.5">●</span>
                  <span>SLA 우선 지원</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-fuchsia-300 mt-0.5">★</span>
                  <span className="font-bold text-fuchsia-200">분기별 정기 리포트·전략 컨설팅</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-fuchsia-300 mt-0.5">★</span>
                  <span className="font-bold text-fuchsia-200">맞춤 콘텐츠 옵션 협의</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setContactModal('premium')}
              className="w-full py-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-600 text-white font-bold rounded-xl hover:shadow-[0_8px_24px_-4px_rgba(139,92,246,0.7)] hover:scale-[1.02] transition-all shadow-md text-sm ring-1 ring-violet-400"
            >
              프리미엄 플랜 문의하기
            </button>
          </div>
        </div>

        {/* 결제 안내 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm">
          <p className="text-amber-800">
            <strong>※ 결제 안내:</strong> 위 가격은 세금별도(부가세 10%)입니다.
            자세한 내용은 <strong>010-2397-5734</strong> 또는 <strong>jaiwshim@gmail.com</strong>으로 문의하세요.
          </p>
        </div>

        {/* 도입 효과 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">도입 3개월 후 예상 변화</h3>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-amber-200">항목</th>
                  <th className="px-4 py-3 text-left font-semibold text-white/60">기존 방식</th>
                  <th className="px-4 py-3 text-left font-semibold text-emerald-300">GEO-AIO 도입 후</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-3 font-medium">월간 콘텐츠 발행량</td><td className="px-4 py-3 text-gray-500">15편</td><td className="px-4 py-3 text-emerald-700 font-bold">100~150편 (6.7~10배)</td></tr>
                <tr><td className="px-4 py-3 font-medium">콘텐츠 1편 단가</td><td className="px-4 py-3 text-gray-500">13~20만원</td><td className="px-4 py-3 text-emerald-700 font-bold">2만원 (1/10)</td></tr>
                <tr><td className="px-4 py-3 font-medium">AI Overview 인용</td><td className="px-4 py-3 text-gray-500">10~15%</td><td className="px-4 py-3 text-emerald-700 font-bold">60%+ (4배)</td></tr>
                <tr><td className="px-4 py-3 font-medium">제작 시간 절약</td><td className="px-4 py-3 text-gray-500">-</td><td className="px-4 py-3 text-emerald-700 font-bold">최대 80% 단축</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA — 프리미엄 다크 + 골드 */}
        <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white overflow-hidden ring-1 ring-amber-400/20 shadow-[0_20px_60px_-15px_rgba(251,191,36,0.3)] text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.18),_transparent_60%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-amber-300">START NOW</p>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
              <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">AI 검색 시대</span>, 지금 시작하세요
            </h3>
            <p className="text-sm text-white/70 mb-5">
              경쟁사보다 먼저 AI 검색엔진에 최적화된 콘텐츠를 만들어 보세요.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <a href="tel:010-2397-5734" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 rounded-lg font-bold text-sm hover:shadow-[0_8px_24px_-4px_rgba(251,191,36,0.6)] hover:scale-[1.02] transition-all ring-1 ring-amber-300">
                📞 010-2397-5734
              </a>
              <a href="mailto:jaiwshim@gmail.com" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-sm text-amber-100 border border-amber-400/30 rounded-lg font-semibold text-sm hover:bg-white/10 hover:border-amber-400/60 transition-all">
                ✉️ jaiwshim@gmail.com
              </a>
            </div>
          </div>
        </section>
        </div>
        </article>
      </main>
      <Footer />

      {/* 문의 모달 */}
      {contactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setContactModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`rounded-t-2xl px-6 py-5 text-center ${
              contactModal === 'pro' ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
              : contactModal === 'max' ? 'bg-gradient-to-r from-amber-500 to-yellow-600'
              : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700'
            }`}>
              <button
                onClick={() => setContactModal(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-extrabold text-white mt-2">
                {contactModal === 'pro' ? '프로 (Pro)' : contactModal === 'max' ? '맥스 (Max)' : '프리미엄 (Premium)'} 플랜 문의
              </h2>
              <p className="text-sm text-white/80 mt-1">
                {contactModal === 'pro' ? '월 200만원 · 월 100건'
                  : contactModal === 'max' ? '연 1,440만원 · 월 150건 + 브랜드뉴스/영상'
                  : '540만원/분기 · 연 2,160만원 · 1년 계약 · 엔터프라이즈 맞춤'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <h3 className="text-sm font-bold text-gray-900 mb-2">📞 전화 문의</h3>
                <p className="text-sm text-gray-700">
                  <strong>010-2397-5734</strong><br />
                  <span className="text-xs text-gray-500">심재우 대표 / 평일 9~18시</span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <h3 className="text-sm font-bold text-gray-900 mb-2">✉️ 이메일 문의</h3>
                <p className="text-sm text-gray-700">
                  <strong>jaiwshim@gmail.com</strong><br />
                  <span className="text-xs text-gray-500">24시간 이내 답변</span>
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-xs text-blue-800">
                <p className="font-bold mb-1">💼 도입 절차</p>
                <p>1. 상담 문의 → 2. 견적 협의 → 3. 계약 체결 → 4. 즉시 운영 시작</p>
              </div>

              <div className="flex gap-2">
                <a
                  href="tel:010-2397-5734"
                  className={`flex-1 text-center py-2.5 text-white font-semibold rounded-xl text-sm ${
                    contactModal === 'pro' ? 'bg-blue-500 hover:bg-blue-600'
                    : contactModal === 'max' ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-violet-600 hover:bg-violet-700'
                  } transition-all`}
                >
                  📞 전화 걸기
                </a>
                <a
                  href={`mailto:jaiwshim@gmail.com?subject=GEO-AIO ${contactModal === 'pro' ? '프로' : contactModal === 'max' ? '맥스' : '프리미엄'} 플랜 문의`}
                  className="flex-1 text-center py-2.5 text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 text-sm transition-all"
                >
                  ✉️ 이메일 보내기
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
