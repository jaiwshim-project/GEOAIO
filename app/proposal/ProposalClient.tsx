'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogHeroCallout from '@/components/BlogHeroCallout';

interface Category {
  slug: string;
  label: string;
  color: string;
  count: number;
  sampleTitles: string[];
}

interface ProposalClientProps {
  categories: Category[];
}

export default function ProposalClient({ categories }: ProposalClientProps) {
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">제안서가 없습니다</h1>
          <p className="text-gray-500">먼저 블로그 콘텐츠를 게시하면 카테고리별 제안서가 자동 생성됩니다.</p>
          <Link href="/generate" className="inline-flex mt-6 px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-semibold text-sm hover:bg-indigo-600">
            콘텐츠 생성하러 가기
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-orange-600 to-amber-600 text-white px-6 sm:px-10 py-8 mb-6">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">맞춤형 솔루션 제안서</h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              각 업체의 콘텐츠 운영 현황과 GEO-AIO 자동화 솔루션이 가져올 변화를 정리했습니다.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {categories.length}개 업체 제안서
              </span>
              {/* 정치인 종합 제안서 진입 버튼 */}
              <Link
                href="/proposal/election-2026"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] bg-white text-rose-700 hover:bg-amber-50 active:bg-amber-100 rounded-full text-xs font-extrabold shadow-md transition-all hover:scale-105"
              >
                <span>🗳️</span>
                <span>정치인 종합 제안서</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* 강조 콜아웃 — 색인·AI 인용 최적화 메시지 */}
        <div className="mb-8">
          <BlogHeroCallout />
        </div>

        {/* ⭐ 6·3 지방선거 후보자용 1페이지 제안서 — 강조 진입 카드 */}
        <div className="relative mb-6 mt-2">
          <span className="absolute -top-3 left-5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 z-20 ring-2 ring-white/60 whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            NEW · 6·3 지방선거 한정
          </span>
          <Link
            href="/proposal/election-2026"
            className="group relative block bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 ring-2 ring-amber-400/40 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.5)] hover:shadow-[0_24px_56px_-16px_rgba(15,23,42,0.6)] hover:scale-[1.01] transition-all overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md ring-2 ring-amber-300/50 text-2xl">
                🗳️
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold tracking-[0.2em] text-amber-300 mb-1">ELECTION 2026 · 6·3 지방선거 후보자 전용</div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-1">
                  3주의 골든타임, <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">AI 검색 시대의 선거 마케팅</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  유권자가 ChatGPT·Gemini에 묻기 전에 답이 되어야 합니다. 광고비 80% 절감 · 24~72h 색인 · AI 인용 3배.
                </p>
              </div>
              <div className="flex items-center gap-2 text-amber-300 font-extrabold shrink-0 group-hover:translate-x-1 transition-transform">
                <span className="text-sm">제안서 보기</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* 안내 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            💡 아래 <strong>업체 카드를 클릭</strong>하면 해당 업체 전용 맞춤 제안서 페이지로 이동합니다.
            각 제안서에는 해당 카테고리에 게시된 실제 블로그 콘텐츠 링크도 포함되어 있습니다.
          </p>
        </div>

        {/* 카테고리 카드 그리드 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/proposal/${encodeURIComponent(cat.slug)}`}
              className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={`h-2 bg-gradient-to-r ${cat.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400">PROPOSAL TO</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r ${cat.color} text-white`}>
                    {cat.count}편 게시
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {cat.label}
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  맞춤 자동화 콘텐츠 솔루션 제안서
                </p>
                {cat.sampleTitles.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {cat.sampleTitles.slice(0, 2).map((title, i) => (
                      <p key={i} className="text-xs text-gray-600 line-clamp-1 flex items-start gap-1.5">
                        <span className="text-gray-300">·</span>
                        <span>{title}</span>
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                    제안서 보기
                  </span>
                  <svg className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
