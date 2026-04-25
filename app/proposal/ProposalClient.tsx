'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-orange-600 to-amber-600 text-white px-6 sm:px-10 py-8 mb-8">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">맞춤형 솔루션 제안서</h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              각 업체의 콘텐츠 운영 현황과 GEO-AIO 자동화 솔루션이 가져올 변화를 정리했습니다.
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium mt-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {categories.length}개 업체 제안서
            </span>
          </div>
        </section>

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
