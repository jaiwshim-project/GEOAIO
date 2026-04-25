'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [contactModal, setContactModal] = useState<'pro' | 'max' | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-10 mb-8">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">GEO-AIO 가격표</h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              AI 검색 시대, 콘텐츠가 AI에 의해 발견되고 인용되기 위한 전략적 도구
            </p>
            <p className="text-white/70 text-xs sm:text-sm mt-2">
              제미나이 AI 기반 · 특허 · 저작권 등록 완료
            </p>
          </div>
        </section>

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

        {/* 두 가지 플랜 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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

          {/* 맥스 플랜 */}
          <div className="relative bg-white rounded-2xl border-2 border-rose-300 p-6 shadow-md hover:shadow-xl transition-all">
            <div className="absolute -top-3 left-6 px-3 py-0.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold rounded-full">
              맥스 (Max)
            </div>
            <div className="absolute -top-3 right-6 px-3 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              40% 특별 할인
            </div>

            <div className="mt-2 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">연간 결제 (추천)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-violet-600">1,440</span>
                <span className="text-lg font-bold text-gray-700">만원</span>
                <span className="text-sm text-gray-400 line-through">2,440만원</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">부가세 별도</p>
              <p className="text-xs font-bold text-rose-600">월 120만원 상당 = 연 40% 절감</p>
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
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md text-sm"
            >
              맥스 플랜 문의하기
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">항목</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">기존 방식</th>
                  <th className="px-4 py-3 text-left font-semibold text-emerald-700">GEO-AIO 도입 후</th>
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

        {/* CTA */}
        <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">AI 검색 시대, 지금 시작하세요</h3>
          <p className="text-sm text-white/80 mb-5">
            경쟁사보다 먼저 AI 검색엔진에 최적화된 콘텐츠를 만들어 보세요.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href="tel:010-2397-5734" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all">
              📞 010-2397-5734
            </a>
            <a href="mailto:jaiwshim@gmail.com" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition-all">
              ✉️ jaiwshim@gmail.com
            </a>
          </div>
        </div>
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
              contactModal === 'pro' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-violet-600 to-purple-600'
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
                {contactModal === 'pro' ? '프로 (Pro)' : '맥스 (Max)'} 플랜 문의
              </h2>
              <p className="text-sm text-white/80 mt-1">
                {contactModal === 'pro' ? '월 200만원 · 월 100건' : '연 1,440만원 · 월 150건 + 브랜드뉴스/영상'}
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
                    contactModal === 'pro' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-violet-600 hover:bg-violet-700'
                  } transition-all`}
                >
                  📞 전화 걸기
                </a>
                <a
                  href={`mailto:jaiwshim@gmail.com?subject=GEO-AIO ${contactModal === 'pro' ? '프로' : '맥스'} 플랜 문의`}
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
