'use client';

import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState(categories[0]?.slug || '');
  const current = categories.find(c => c.slug === activeTab) || categories[0];

  if (!current) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">제안서가 없습니다</h1>
          <p className="text-gray-500">먼저 블로그 콘텐츠를 게시하면 카테고리별 제안서가 자동 생성됩니다.</p>
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium mt-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {categories.length}개 업체 제안서
            </span>
          </div>
        </section>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 mb-6 sticky top-16 z-20 bg-gray-50/95 backdrop-blur-sm py-2 -mx-2 px-2">
          {categories.map((cat) => {
            const isActive = activeTab === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveTab(cat.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{cat.count}</span>
              </button>
            );
          })}
        </div>

        {/* 제안서 본문 */}
        <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${current.color}`} />
          <div className="p-6 sm:p-10 space-y-8">

            {/* 표지 */}
            <header className="border-b border-gray-100 pb-6">
              <p className="text-xs font-semibold text-gray-400 mb-2">PROPOSAL TO</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{current.label}</h2>
              <p className="text-lg text-gray-600">
                AI 검색 시대, <strong className="text-gray-900">자동화 콘텐츠 생성 플랫폼</strong>으로 마케팅 비용을 80% 절감하고
                AI 검색 노출 점유율을 3배 높이는 방법
              </p>
            </header>

            {/* 1. 현황 진단 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold">1</span>
                <h3 className="text-xl font-bold text-gray-900">현황 진단: {current.label}이 직면한 콘텐츠 마케팅의 한계</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  ChatGPT, Google AI Overview, Perplexity 등 <strong>AI 검색엔진이 전체 검색 트래픽의 40% 이상을 점유</strong>하고 있습니다.
                  하지만 기존 SEO 방식으로 작성된 콘텐츠 중 <strong className="text-rose-600">90%는 AI에 인용되지 못합니다.</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">●</span>
                    <span><strong>콘텐츠 1편당 작성 시간:</strong> 평균 4~8시간 (외주 시 건당 30~80만원)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">●</span>
                    <span><strong>AI 인용 가능성:</strong> 일반 SEO 콘텐츠 10~15% / E-E-A-T 최적화 콘텐츠 60%+</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">●</span>
                    <span><strong>월간 발행량 한계:</strong> 인력 1명 기준 월 4~8편 (시즌별 마케팅 대응 불가)</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 2. 솔루션 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="text-xl font-bold text-gray-900">GEO-AIO 솔루션: 클릭 한 번으로 10가지 톤 콘텐츠 자동 생성</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-800 mb-2">🤖 멀티 에이전트 병렬 생성</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">전문적·친근한·설득적·스토리텔링·교육형 등 <strong>10가지 톤을 동시에 생성</strong>. 같은 주제로 SNS 채널별 최적화 콘텐츠 확보.</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-800 mb-2">📚 RAG 기반 정확성</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">{current.label}의 PDF/문서를 업로드하면 AI가 <strong>해당 업체의 실제 정보·수치</strong>를 본문에 자동 반영.</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="text-sm font-bold text-amber-800 mb-2">⚡ E-E-A-T 자동 구조화</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">도입부 → H2 섹션 7개 → FAQ → 비교표 → CTA <strong>구조 자동 적용</strong>. AI 인용 가능성 4배 향상.</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                  <h4 className="text-sm font-bold text-rose-800 mb-2">🎨 즉시 게시 + SNS 변환</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">생성된 콘텐츠를 <strong>블로그·인스타·링크드인·네이버블로그·카드뉴스</strong>로 자동 변환·게시.</p>
                </div>
              </div>
            </section>

            {/* 3. 적용 사례 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="text-xl font-bold text-gray-900">{current.label} 적용 결과 미리보기</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">현재 GEO-AIO에 게시된 {current.label} 카테고리 콘텐츠 <strong>{current.count}편</strong> 샘플:</p>
              <div className="space-y-2">
                {current.sampleTitles.map((title, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-indigo-300 transition-all">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 mt-0.5 font-mono">{String(i + 1).padStart(2, '0')}</span>
                      <p className="text-sm text-gray-800 flex-1">{title}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href={`/blog/category/${encodeURIComponent(current.slug)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all"
              >
                전체 {current.count}편 보기
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </section>

            {/* 4. ROI */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold">4</span>
                <h3 className="text-xl font-bold text-gray-900">예상 ROI: 3개월 후 변화</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">항목</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">기존 방식</th>
                      <th className="px-4 py-3 text-left font-semibold text-emerald-700">GEO-AIO 도입 후</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">월간 콘텐츠 발행량</td>
                      <td className="px-4 py-3 text-gray-500">4~8편</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">40~80편 (10배)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">콘텐츠 1편당 시간</td>
                      <td className="px-4 py-3 text-gray-500">4~8시간</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">2분 (240배)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">AI 검색 노출 점유율</td>
                      <td className="px-4 py-3 text-gray-500">10~15%</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">60%+ (4배)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">월간 마케팅 비용</td>
                      <td className="px-4 py-3 text-gray-500">300~600만원</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">월 9.9만원 (80% 절감)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. CTA */}
            <section className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white">
              <h3 className="text-xl font-bold mb-2">{current.label} 전용 데모, 30분 안에 직접 확인하세요</h3>
              <p className="text-sm text-white/80 mb-5 leading-relaxed">
                {current.label}의 PDF 1개를 업로드하면, 30분 안에 10가지 톤의 E-E-A-T 최적화 콘텐츠가 완성됩니다.
                지금 무료로 체험하고 AI 검색 시대를 선점하세요.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="/generate" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all">
                  무료 체험 시작
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
                <a href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition-all">
                  요금제 보기
                </a>
                <a href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition-all">
                  도입 문의
                </a>
              </div>
            </section>

            {/* Footer info */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex flex-wrap items-center gap-3">
              <span>📞 010-2397-5734</span>
              <span>·</span>
              <span>✉️ jaiwshim@gmail.com</span>
              <span>·</span>
              <span>🌐 www.geo-aio.com</span>
              <span className="ml-auto">제안 일자: {new Date().toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
