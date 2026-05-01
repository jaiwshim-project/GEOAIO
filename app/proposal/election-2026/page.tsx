'use client';

// 6·3 지방선거 후보자용 GEO-AIO 마케팅 1페이지 제안서
// 정적 라우트: /proposal/election-2026 ([slug] 동적 라우트와 별개로 우선 처리됨)

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ELECTION_DATE = new Date('2026-06-03T00:00:00+09:00');

function calcDDay(): number {
  const now = new Date();
  const ms = ELECTION_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function ElectionProposalPage() {
  const [dDay, setDDay] = useState<number | null>(null);

  useEffect(() => {
    setDDay(calcDDay());
    const id = setInterval(() => setDDay(calcDDay()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:py-2">
        {/* ── Section 1. 히어로 / D-Day ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-10 sm:py-14 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[11px] font-bold tracking-[0.2em] text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                ELECTION 2026 · 6·3 지방선거 출마자
              </span>
              {dDay !== null && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-[11px] font-extrabold tracking-wide text-rose-200">
                  ⏳ D-{dDay} · 캠페인 골든타임
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-3">
              <span className="block">3주의 골든타임,</span>
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                AI 검색 시대의 선거 마케팅
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-200/90 leading-relaxed max-w-3xl">
              유권자는 이제 네이버가 아니라 <strong className="text-amber-300">AI에게 묻습니다</strong>.
              네이버에 노출되어도 ChatGPT·Gemini·Perplexity 답변에 인용되지 않으면 표는 움직이지 않습니다.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-3xl">
              {[
                { label: '단가 절감', value: '80%' },
                { label: '동시 톤 생성', value: '10가지' },
                { label: '색인 도달', value: '24~72h' },
                { label: 'AI 인용 점유', value: '3배' },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-3 text-center">
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-300">{s.value}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2. 패러다임 전환 (Problem) ── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 ring-2 ring-rose-300/50 flex items-center justify-center text-sm font-bold shadow-md">1</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">패러다임 전환 — 유권자 정보 탐색 채널이 바뀌었다</h2>
          </div>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            네이버에 노출되어도 <strong className="text-rose-700">AI 답변에 인용되지 않으면</strong> 결정 단계 유권자는 후보를 인식하지 못합니다.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-500 mb-1 tracking-wide">📰 구시대</div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-2">명함·현수막·문자</h4>
              <p className="text-xs text-gray-600 leading-relaxed">도달률은 낮고 차단·스팸 처리 빈번. 단방향 메시지로 신뢰 형성 어려움.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="text-xs font-bold text-amber-700 mb-1 tracking-wide">🔍 전환기</div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-2">네이버 SEO·검색광고</h4>
              <p className="text-xs text-gray-700 leading-relaxed">색인까지 2~4주 소요 — 선거가 끝난 뒤에 효과 발생. 광고비 비례 도달.</p>
            </div>
            <div className="relative bg-gradient-to-br from-emerald-50 via-cyan-50 to-emerald-50 border-2 border-emerald-300 ring-2 ring-emerald-200/60 rounded-xl p-4 shadow-md">
              <span className="absolute -top-2 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">정답</span>
              <div className="text-xs font-bold text-emerald-700 mb-1 tracking-wide">🤖 AI 시대</div>
              <h4 className="text-sm font-extrabold text-emerald-900 mb-2">ChatGPT·Gemini·Perplexity 답변에 인용</h4>
              <p className="text-xs text-gray-800 leading-relaxed"><strong>결정 단계 유권자의 73%</strong>가 AI 답변에서 인용된 후보를 신뢰. 즉시 전환.</p>
            </div>
          </div>
        </section>

        {/* ── Section 3. 시간 압박 (Urgency) ── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-300/50 flex items-center justify-center text-sm font-bold shadow-md">2</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">3주 캠페인 — 일반 SEO는 선거 끝나고 효과</h2>
          </div>

          <div className="overflow-x-auto -mx-1 px-1 mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="text-left p-3 font-bold text-slate-700">방식</th>
                  <th className="text-center p-3 font-bold text-slate-700">색인·노출 시작</th>
                  <th className="text-center p-3 font-bold text-slate-700">효과 발생</th>
                  <th className="text-center p-3 font-bold text-slate-700">3주 안에 가능?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-3 text-gray-700">일반 SEO·검색광고</td>
                  <td className="p-3 text-center text-gray-600">2~4주</td>
                  <td className="p-3 text-center text-gray-600">1~2개월</td>
                  <td className="p-3 text-center"><span className="text-rose-600 font-bold">❌</span></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-3 text-gray-700">SNS 광고 (페이스북·인스타)</td>
                  <td className="p-3 text-center text-gray-600">즉시</td>
                  <td className="p-3 text-center text-gray-600">광고비 비례</td>
                  <td className="p-3 text-center"><span className="text-amber-600 font-bold">△</span><span className="block text-[10px] text-gray-500">고비용</span></td>
                </tr>
                <tr className="bg-emerald-50/50 border-b-2 border-emerald-300">
                  <td className="p-3 font-extrabold text-emerald-900">GEO-AIO ⭐</td>
                  <td className="p-3 text-center font-bold text-emerald-700">수일 내</td>
                  <td className="p-3 text-center font-bold text-emerald-700">24~72시간 AI 인용</td>
                  <td className="p-3 text-center"><span className="text-emerald-600 font-extrabold">✅</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 강조 카드 — 게시 즉시 효과 (LIVE 카드 패턴 재사용) */}
          <div className="relative mt-2">
            <span className="absolute -top-3 left-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-20 ring-2 ring-white/50 whitespace-nowrap">
              ⭐ 즉시 효과 발생
            </span>
            <div className="relative bg-gradient-to-br from-cyan-100 via-sky-100 to-cyan-100 rounded-2xl p-5 sm:p-6 border-2 border-cyan-400 ring-2 ring-cyan-200/70 shadow-[0_12px_40px_-8px_rgba(8,145,178,0.45)] overflow-hidden">
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-300/40 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-sky-300/40 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <h4 className="text-base sm:text-lg font-extrabold text-cyan-900 mb-3 flex items-center gap-2 leading-snug">
                  <span className="text-2xl">🚀</span>
                  <span>게시 즉시 검색 색인 + AI 인용·추천 효과 발생</span>
                </h4>
                <p className="text-sm text-gray-800 leading-relaxed">
                  콘텐츠를 게시하거나 업로드·공개하면 <strong className="text-cyan-700">수 일 내에 구글 검색엔진이 색인</strong>하여, 이후
                  <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-white rounded-md text-xs font-bold text-cyan-700 shadow-sm border border-cyan-200">
                    ChatGPT · Gemini · Perplexity
                  </span>
                  등 <strong className="text-cyan-700">AI 대화에서 인용·추천</strong>되어 <strong className="text-orange-600 text-base">선거 기간 내 효과가 발생</strong>합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4. ROI 실증 사례 ── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 ring-2 ring-emerald-300/50 flex items-center justify-center text-sm font-bold shadow-md">3</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">선거 당선 가능성을 높이는 부가 서비스</h2>
          </div>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            아래 두 사례는 <strong>GEO-AIO 홍보 마케팅 콘텐츠 생성 서비스</strong>에 더해, <strong className="text-emerald-700">후보자의 선거 당선 가능성을 높이기 위해 함께 제공되는 부가 서비스</strong>입니다 — 100개 공약 자동 정리·33일 유세 동선 AI 추천 등 캠페인 의사결정을 끌어올리는 도구. 클릭해 직접 확인하세요.
          </p>

          <div className="space-y-5">
            {/* 사례 1 — 100공약 */}
            <div className="relative">
              <span className="absolute -top-2.5 left-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 z-10 tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                LIVE · 실제 운영 중
              </span>
              <a href="https://buzzlab-busan-bukgu-pledge100.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-amber-50 via-amber-100/80 to-amber-50 border-2 border-amber-300 rounded-2xl shadow-[0_8px_28px_-6px_rgba(251,191,36,0.45)] ring-2 ring-amber-200/60 hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_rgba(251,191,36,0.55)] hover:border-amber-500 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0 shadow-md ring-2 ring-amber-300/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-amber-700 mb-1 tracking-wide uppercase">📌 사례 ① 부산 북구갑 후보 100개 공약 제안서</p>
                  <p className="text-base font-extrabold text-slate-900 leading-snug">10분야 × 10개 = <span className="text-amber-700">100개 공약</span> · 시기·실행방안·기대효과 자동 구조화</p>
                </div>
                <svg className="w-6 h-6 text-amber-700 group-hover:translate-x-1.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* 사례 2 — 33일 유세 */}
            <div className="relative">
              <span className="absolute -top-2.5 left-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 z-10 tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                LIVE · 실제 운영 중
              </span>
              <a href="https://buzzlab-busan-bukgu-route.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-rose-50 via-pink-100/80 to-rose-50 border-2 border-pink-300 rounded-2xl shadow-[0_8px_28px_-6px_rgba(236,72,153,0.45)] ring-2 ring-pink-200/60 hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_rgba(236,72,153,0.55)] hover:border-pink-500 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center shrink-0 shadow-md ring-2 ring-pink-300/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0L6.343 16.657a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-pink-700 mb-1 tracking-wide uppercase">📌 사례 ② AI 기반 33일 유세 동선 전략보고서</p>
                  <p className="text-base font-extrabold text-slate-900 leading-snug">4단계 일정 · <span className="text-pink-700">48 거점</span> 분석 · 5대 필승 전략 자동 매핑</p>
                </div>
                <svg className="w-6 h-6 text-pink-700 group-hover:translate-x-1.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── Section 5. 채택 안내 (CTA) ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-8 sm:py-10 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 ring-2 ring-amber-400/50 text-amber-300 flex items-center justify-center text-sm font-bold">4</span>
              <h2 className="text-xl sm:text-2xl font-extrabold">지금 채택하면 받는 것</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: '📝', title: '100개 공약 콘텐츠 자동 생성', desc: '10분야 × 10편 — 시기·실행방안·기대효과 구조화' },
                { icon: '🎭', title: '10가지 톤 동시 발행', desc: '전문·친근·감성·스토리·뉴스 등 — SNS 채널별 최적화' },
                { icon: '🚀', title: '티스토리·블로그 자동 업로드', desc: 'GSC 색인 모니터링 대시보드 포함' },
                { icon: '🗺️', title: '유세 동선 AI 추천', desc: '시간대·거점·메시지 자동 매핑' },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 flex items-start gap-3">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-sm font-extrabold text-amber-200 mb-0.5">{item.title}</div>
                    <div className="text-xs text-slate-300 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 도입 일정 */}
            <div className="bg-amber-500/10 border border-amber-400/40 rounded-xl p-4 sm:p-5 mb-5">
              <div className="text-xs font-bold text-amber-300 tracking-wide mb-3">⚡ 48시간 도입 로드맵</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: '오늘', title: '무료 시연 신청', desc: '후보자 자료 1건만 업로드' },
                  { step: '24시간', title: '첫 콘텐츠 5편 검토', desc: '실제 톤·구조 확인' },
                  { step: '48시간', title: '정식 도입 결정', desc: '캠페인 즉시 시작' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-3">
                    <div className="text-[10px] font-extrabold text-amber-300 tracking-widest mb-1">STEP {i + 1} · {s.step}</div>
                    <div className="text-sm font-bold text-white mb-0.5">{s.title}</div>
                    <div className="text-[11px] text-slate-300 leading-snug">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 연락처 + CTA 버튼 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/8 border border-white/15 rounded-xl p-4 sm:p-5">
              <div>
                <div className="text-[11px] font-bold text-amber-300 tracking-wide mb-1">상담·시연 문의</div>
                <div className="text-base font-extrabold text-white mb-0.5">AX Biz Group · 심재우 대표</div>
                <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a href="tel:010-2397-5734" className="hover:text-white">📞 010-2397-5734</a>
                  <a href="mailto:jaiwshim@gmail.com" className="hover:text-white">✉ jaiwshim@gmail.com</a>
                </div>
              </div>
              <Link
                href="/landing"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/30 transition-all whitespace-nowrap shrink-0"
              >
                ⚡ 무료 시연 신청하기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Section 6. 풋터 / 법적 정보 ── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 text-xs text-gray-500 leading-relaxed">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="font-bold text-gray-700 mb-1">출처·근거</p>
              <p>BuzzLab 후보자 시뮬레이션 (n=1,000) · 특허 출원번호 10-2026-0073485 (다중 LLM 에이전트 예측 시스템) · 작성일 2026-05-01</p>
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-1">법무 안내</p>
              <p>본 제안은 GEO-AIO 마케팅 솔루션 도입 안내이며, 캠페인 메시지·게시물의 공직선거법 적합성은 캠프 법률 전문가의 별도 검토가 권고됩니다.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
