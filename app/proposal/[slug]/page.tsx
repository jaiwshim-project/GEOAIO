import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES: Record<string, { label: string; color: string }> = {
  'geo-aio':  { label: 'GEO-AIO', color: 'from-indigo-500 to-violet-600' },
  'regenmed': { label: '리젠메드컨설팅', color: 'from-emerald-500 to-teal-600' },
  'brewery':  { label: '대전맥주장 수제맥주', color: 'from-amber-500 to-orange-600' },
  'dental':   { label: '치과병원', color: 'from-sky-500 to-blue-600' },
};

const EXTRA_COLORS = [
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
  'from-orange-500 to-red-600',
];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getCategoryData(slug: string) {
  const supabase = getSupabase();
  const { data: posts } = await supabase
    .from('blog_articles')
    .select('id, title, content, created_at')
    .eq('category', slug)
    .order('created_at', { ascending: false })
    .limit(50);

  // 모든 카테고리 (탭용)
  const { data: allPosts } = await supabase
    .from('blog_articles')
    .select('category');
  const categoryStats: Record<string, number> = {};
  (allPosts || []).forEach((r: { category: string }) => {
    if (r.category) categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
  });

  return { posts: posts || [], categoryStats };
}

function getMeta(slug: string) {
  if (DEFAULT_CATEGORIES[slug]) return DEFAULT_CATEGORIES[slug];
  const idx = Math.abs(slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % EXTRA_COLORS.length;
  return { label: slug, color: EXTRA_COLORS[idx] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const meta = getMeta(slug);
  return {
    title: `${meta.label} 제안서 — GEO-AIO`,
    description: `${meta.label} 맞춤형 자동화 콘텐츠 솔루션 제안서`,
  };
}

export default async function ProposalCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const meta = getMeta(slug);
  const { posts, categoryStats } = await getCategoryData(slug);

  // 모든 카테고리 (탭 네비게이션용)
  const allCategories = Object.entries(categoryStats).map(([s, count]) => {
    const m = getMeta(s);
    return { slug: s, label: m.label, color: m.color, count };
  });

  const sampleTitles = posts.slice(0, 3).map(p => p.title);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/proposal"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          전체 제안서 목록으로
        </Link>

        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-orange-600 to-amber-600 text-white px-6 sm:px-10 py-8 mb-6">
          <div className="relative">
            <p className="text-xs font-semibold text-white/70 mb-2">PROPOSAL TO</p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {meta.label} <span className="text-white/95">AI 최적화 마케팅(GEO-AIO) 제안서</span>
            </h1>
            <p className="text-white/90 text-sm leading-relaxed">
              {meta.label}을 위한 맞춤형 자동화 콘텐츠 솔루션 제안서
            </p>
          </div>
        </section>

        {/* 다른 카테고리 탭 (네비게이션) */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6 sticky top-16 z-20 bg-gray-50/95 backdrop-blur-sm py-2 -mx-2 px-2">
            {allCategories.map((cat) => {
              const isActive = cat.slug === slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/proposal/${encodeURIComponent(cat.slug)}`}
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
                </Link>
              );
            })}
          </div>
        )}

        {/* 제안서 본문 */}
        <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${meta.color}`} />
          <div className="p-6 sm:p-10 space-y-8">

            {/* 표지 */}
            <header className="border-b border-gray-100 pb-6">
              <p className="text-xs font-semibold text-gray-400 mb-2">PROPOSAL TO</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {meta.label}
                <span className="block text-lg sm:text-xl text-indigo-600 font-bold mt-1">
                  AI 최적화 마케팅(GEO-AIO) 제안서
                </span>
              </h2>
              <p className="text-base text-gray-600 mb-4">
                AI 검색 시대, <strong className="text-gray-900">자동화 콘텐츠 생성 플랫폼</strong>으로 마케팅 비용을 80% 절감하고
                AI 검색 노출 점유율을 3배 높이는 방법
              </p>
              <Link
                href={`/blog/category/${encodeURIComponent(slug)}`}
                className="group inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-indigo-500 font-medium mb-0.5">📌 실제 운영 중인 블로그 보기</p>
                  <p className="text-sm font-bold text-gray-900">{meta.label} 카테고리에 게시된 {posts.length}편의 AI 최적화 콘텐츠</p>
                </div>
                <svg className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </header>

            {/* 1. 현황 진단 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold">1</span>
                <h3 className="text-xl font-bold text-gray-900">현황 진단: {meta.label}이 직면한 콘텐츠 마케팅의 한계</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  ChatGPT, Google AI Overview, Perplexity 등 <strong>AI 검색엔진이 전체 검색 트래픽의 40% 이상을 점유</strong>하고 있습니다.
                  하지만 기존 SEO 방식으로 작성된 콘텐츠 중 <strong className="text-rose-600">90%는 AI에 인용되지 못합니다.</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">●</span><span><strong>콘텐츠 1편당 작성 시간:</strong> 평균 4~8시간 (외주 시 건당 10~15만원)</span></li>
                  <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">●</span><span><strong>AI 인용 가능성:</strong> 일반 SEO 콘텐츠 비율 70% / AI 인용 가능성 5% 미만</span></li>
                  <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">●</span><span><strong>월간 발행량 한계:</strong> 인력 1명 기준 월 15~30편 (시즌별 마케팅 대응 불가)</span></li>
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
                  <p className="text-xs text-gray-700 leading-relaxed">{meta.label}의 PDF/문서를 업로드하면 AI가 <strong>해당 업체의 실제 정보·수치</strong>를 본문에 자동 반영.</p>
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

            {/* 3. SEO vs E-E-A-T 심층 비교 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="text-xl font-bold text-gray-900">SEO 방식 vs E-E-A-T 방식 심층 비교</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                기존 SEO 기반 마케팅과 GEO-AIO의 E-E-A-T 기반 AI 최적화는 본질적으로 다른 접근법입니다.
                9가지 관점에서 비교한 결과를 보세요.
              </p>

              {/* 1. 전체 비교 요약 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 1. 전체 비교 요약
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">구분</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">SEO 방식 (검색 최적화)</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-700">E-E-A-T 방식 (AI 최적화)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr><td className="px-3 py-2 font-medium">목적</td><td className="px-3 py-2 text-gray-600">검색 노출</td><td className="px-3 py-2 text-purple-700 font-medium">AI 인용 + 신뢰 확보</td></tr>
                      <tr><td className="px-3 py-2 font-medium">핵심 전략</td><td className="px-3 py-2 text-gray-600">키워드 반복</td><td className="px-3 py-2 text-purple-700 font-medium">지식 구조화</td></tr>
                      <tr><td className="px-3 py-2 font-medium">콘텐츠 유형</td><td className="px-3 py-2 text-gray-600">스토리 중심</td><td className="px-3 py-2 text-purple-700 font-medium">정보 + 구조 중심</td></tr>
                      <tr><td className="px-3 py-2 font-medium">생산 방식</td><td className="px-3 py-2 text-gray-600">템플릿 반복</td><td className="px-3 py-2 text-purple-700 font-medium">구조 기반 생성</td></tr>
                      <tr><td className="px-3 py-2 font-medium">타겟</td><td className="px-3 py-2 text-gray-600">검색 사용자</td><td className="px-3 py-2 text-purple-700 font-medium">AI + 사용자</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. 구조 차이 비교 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 2. 구조 차이 비교 (핵심)
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">항목</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-700">E-E-A-T 방식</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr><td className="px-3 py-2 font-medium">도입부</td><td className="px-3 py-2 text-gray-600">일반론·공통 문장 반복</td><td className="px-3 py-2 text-purple-700 font-medium">문제 정의</td></tr>
                      <tr><td className="px-3 py-2 font-medium">본문 구조</td><td className="px-3 py-2 text-gray-600">사건·스토리 중심</td><td className="px-3 py-2 text-purple-700 font-medium">정의 → 기준 → 구조</td></tr>
                      <tr><td className="px-3 py-2 font-medium">정보성</td><td className="px-3 py-2 text-gray-600">낮음</td><td className="px-3 py-2 text-purple-700 font-medium">매우 높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">논리 구조</td><td className="px-3 py-2 text-gray-600">약함</td><td className="px-3 py-2 text-purple-700 font-medium">명확</td></tr>
                      <tr><td className="px-3 py-2 font-medium">요약</td><td className="px-3 py-2 text-gray-600">없음</td><td className="px-3 py-2 text-purple-700 font-medium">핵심 요약 존재</td></tr>
                      <tr><td className="px-3 py-2 font-medium">리스트</td><td className="px-3 py-2 text-gray-600">거의 없음</td><td className="px-3 py-2 text-purple-700 font-medium">필수 요소</td></tr>
                      <tr><td className="px-3 py-2 font-medium">단계 설명</td><td className="px-3 py-2 text-gray-600">없음</td><td className="px-3 py-2 text-purple-700 font-medium">단계별 전략</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
                  <strong>👉 핵심 차이:</strong> SEO는 &quot;읽히는 글&quot; / E-E-A-T는 &quot;설명되고 인용되는 글&quot;
                </div>
              </div>

              {/* 3. E-E-A-T 품질 요소 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 3. 콘텐츠 품질 요소 비교
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">요소</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-700">E-E-A-T 방식</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr><td className="px-3 py-2 font-medium">Experience (경험)</td><td className="px-3 py-2 text-gray-600">있음 (사례 중심)</td><td className="px-3 py-2 text-purple-700 font-medium">있음 + 구조화</td></tr>
                      <tr><td className="px-3 py-2 font-medium">Expertise (전문성)</td><td className="px-3 py-2 text-gray-600">약함</td><td className="px-3 py-2 text-purple-700 font-medium">강함</td></tr>
                      <tr><td className="px-3 py-2 font-medium">Authority (권위)</td><td className="px-3 py-2 text-gray-600">낮음</td><td className="px-3 py-2 text-purple-700 font-medium">높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">Trust (신뢰)</td><td className="px-3 py-2 text-gray-600">중간 이하</td><td className="px-3 py-2 text-purple-700 font-medium">매우 높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">데이터/근거</td><td className="px-3 py-2 text-gray-600">부족</td><td className="px-3 py-2 text-purple-700 font-medium">포함 가능</td></tr>
                      <tr><td className="px-3 py-2 font-medium">재사용성</td><td className="px-3 py-2 text-gray-600">낮음</td><td className="px-3 py-2 text-purple-700 font-medium">매우 높음</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. AI 관점 비교 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 4. AI 관점 비교
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">항목</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-700">E-E-A-T 방식</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr><td className="px-3 py-2 font-medium">AI 이해도</td><td className="px-3 py-2 text-gray-600">낮음</td><td className="px-3 py-2 text-purple-700 font-medium">높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">인용 가능성</td><td className="px-3 py-2 text-gray-600">매우 낮음</td><td className="px-3 py-2 text-purple-700 font-medium">매우 높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">요약 가능성</td><td className="px-3 py-2 text-gray-600">낮음</td><td className="px-3 py-2 text-purple-700 font-medium">매우 높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">구조 인식</td><td className="px-3 py-2 text-gray-600">어려움</td><td className="px-3 py-2 text-purple-700 font-medium">쉬움</td></tr>
                      <tr><td className="px-3 py-2 font-medium">지식 추출</td><td className="px-3 py-2 text-gray-600">어려움</td><td className="px-3 py-2 text-purple-700 font-medium">용이</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
                  <strong>👉 핵심:</strong> SEO 콘텐츠는 AI가 &quot;읽지만 쓰지 않는 콘텐츠&quot; / E-E-A-T 콘텐츠는 AI가 &quot;그대로 활용하는 콘텐츠&quot;
                </div>
              </div>

              {/* 5. SEO vs AIO 성능 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 5. SEO vs AIO 성능 비교
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">항목</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-700">E-E-A-T 방식</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr><td className="px-3 py-2 font-medium">검색 노출</td><td className="px-3 py-2 text-gray-600">매우 높음</td><td className="px-3 py-2 text-purple-700 font-medium">높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">클릭률</td><td className="px-3 py-2 text-gray-600">높음</td><td className="px-3 py-2 text-purple-700 font-medium">중~높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">체류시간</td><td className="px-3 py-2 text-gray-600">높음</td><td className="px-3 py-2 text-purple-700 font-medium">높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">AI 인용률</td><td className="px-3 py-2 text-gray-600">매우 낮음</td><td className="px-3 py-2 text-purple-700 font-medium">매우 높음</td></tr>
                      <tr><td className="px-3 py-2 font-medium">AI Overview 노출</td><td className="px-3 py-2 text-gray-600">거의 없음</td><td className="px-3 py-2 text-purple-700 font-medium">가능</td></tr>
                      <tr><td className="px-3 py-2 font-medium">GEO/AIO 효과</td><td className="px-3 py-2 text-gray-600">없음</td><td className="px-3 py-2 text-purple-700 font-medium">강함</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. 생산 구조 차이 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 6. 생산 구조 차이
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">항목</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-700">E-E-A-T 방식</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr><td className="px-3 py-2 font-medium">글 생성 방식</td><td className="px-3 py-2 text-gray-600">템플릿 반복</td><td className="px-3 py-2 text-purple-700 font-medium">구조 기반 생성</td></tr>
                      <tr><td className="px-3 py-2 font-medium">자동화 수준</td><td className="px-3 py-2 text-gray-600">단순</td><td className="px-3 py-2 text-purple-700 font-medium">고급 (VCOS 적용 가능)</td></tr>
                      <tr><td className="px-3 py-2 font-medium">확장 방식</td><td className="px-3 py-2 text-gray-600">키워드 확장</td><td className="px-3 py-2 text-purple-700 font-medium">산업·지식 확장</td></tr>
                      <tr><td className="px-3 py-2 font-medium">데이터화</td><td className="px-3 py-2 text-gray-600">어려움</td><td className="px-3 py-2 text-purple-700 font-medium">가능</td></tr>
                      <tr><td className="px-3 py-2 font-medium">RAG 활용</td><td className="px-3 py-2 text-gray-600">불가능</td><td className="px-3 py-2 text-purple-700 font-medium">가능</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7. 비즈니스 전환력 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 7. 비즈니스 전환력 비교
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">항목</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-semibold text-purple-700">E-E-A-T 방식</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr><td className="px-3 py-2 font-medium">상담 유도</td><td className="px-3 py-2 text-gray-600">강함</td><td className="px-3 py-2 text-purple-700 font-medium">강함</td></tr>
                      <tr><td className="px-3 py-2 font-medium">신뢰 형성</td><td className="px-3 py-2 text-gray-600">중간</td><td className="px-3 py-2 text-purple-700 font-medium">매우 강함</td></tr>
                      <tr><td className="px-3 py-2 font-medium">전문가 브랜딩</td><td className="px-3 py-2 text-gray-600">약함</td><td className="px-3 py-2 text-purple-700 font-medium">매우 강함</td></tr>
                      <tr><td className="px-3 py-2 font-medium">플랫폼 연결</td><td className="px-3 py-2 text-gray-600">제한적</td><td className="px-3 py-2 text-purple-700 font-medium">매우 강함</td></tr>
                      <tr><td className="px-3 py-2 font-medium">장기 자산화</td><td className="px-3 py-2 text-gray-600">낮음</td><td className="px-3 py-2 text-purple-700 font-medium">매우 높음</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 8. 핵심 구조 한눈에 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 8. 핵심 구조 한눈에 비교
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-rose-700 mb-2">🔴 SEO 방식</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      키워드 → 스토리 → 감정 → 위기 → 상담 유도
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 mb-2">🔵 E-E-A-T 방식</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      정의 → 기준 → 구조 → 사례 → 분석 → 전략 → 요약 → 상담
                    </p>
                  </div>
                </div>
              </div>

              {/* 9. 가장 중요한 차이 3가지 */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <span className="text-base">📊</span> 9. 가장 중요한 차이 3가지
                </h4>
                <div className="space-y-2">
                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-800 mb-1">① 콘텐츠의 본질</p>
                    <p className="text-xs text-gray-600">SEO: 마케팅 중심 콘텐츠 ↔ <strong className="text-purple-700">E-E-A-T: 지식 중심 콘텐츠</strong></p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-800 mb-1">② AI 활용 가능성</p>
                    <p className="text-xs text-gray-600">SEO: 소비형 콘텐츠 ↔ <strong className="text-purple-700">E-E-A-T: 학습·인용 가능한 콘텐츠</strong></p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-800 mb-1">③ 확장성</p>
                    <p className="text-xs text-gray-600">SEO: 블로그 단위 ↔ <strong className="text-purple-700">E-E-A-T: 플랫폼/데이터 단위</strong></p>
                  </div>
                </div>
              </div>

              {/* 최종 결론 */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
                <p className="text-xs font-semibold text-white/70 mb-2">🔥 최종 결론</p>
                <div className="space-y-1.5 mb-4 text-sm">
                  <p>👉 <strong>SEO 방식</strong>은 &quot;트래픽을 만드는 구조&quot;</p>
                  <p>👉 <strong>E-E-A-T 방식</strong>은 &quot;신뢰와 인용을 만드는 구조&quot;</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-xs font-semibold text-white/70 mb-1">전략 한 문장</p>
                  <p className="text-base font-bold">
                    👉 &quot;SEO로 유입을 만들고, E-E-A-T 구조로 AI가 인용하게 만든다&quot;
                  </p>
                </div>
              </div>
            </section>

            {/* 4. 적용 사례 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">4</span>
                <h3 className="text-xl font-bold text-gray-900">{meta.label} 실제 운영 콘텐츠 보기</h3>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-3">
                <p className="text-sm text-sky-800 leading-relaxed">
                  💡 <strong>아래 제목을 클릭</strong>하면 GEO-AIO 블로그에 실제 게시된 콘텐츠를 직접 확인하실 수 있습니다.
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-3">현재 게시된 <strong className="text-indigo-700">{posts.length}편</strong> 중 최신 3편 미리보기:</p>
              <div className="space-y-2">
                {sampleTitles.map((title, i) => (
                  <Link
                    key={i}
                    href={`/blog/${posts[i].id}`}
                    className="group block bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-indigo-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <p className="text-sm text-gray-800 flex-1 group-hover:text-indigo-600 transition-colors">{title}</p>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href={`/blog/category/${encodeURIComponent(slug)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg hover:from-indigo-600 hover:to-violet-600 hover:shadow-md transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {meta.label} 블로그 전체 {posts.length}편 보기
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all"
                >
                  전체 카테고리 보기
                </Link>
              </div>
            </section>

            {/* 5. ROI */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold">5</span>
                <h3 className="text-xl font-bold text-gray-900">예상 ROI: 3개월 후 변화</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                기존 방식 대비 콘텐츠 생산성·AI 인용률·마케팅 비용·고객 유입까지 모든 지표가 향상됩니다.
              </p>

              {/* 핵심 지표 카드 (3개) */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-semibold text-emerald-600 mb-1">콘텐츠 생산성</p>
                  <p className="text-2xl font-extrabold text-emerald-700">5~10배</p>
                  <p className="text-[10px] text-gray-500 mt-1">월 15~30편 → 100~150편</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-semibold text-indigo-600 mb-1">AI 인용률</p>
                  <p className="text-2xl font-extrabold text-indigo-700">12배 ↑</p>
                  <p className="text-[10px] text-gray-500 mt-1">5% 미만 → 60%+</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-semibold text-rose-600 mb-1">신규 고객 유입</p>
                  <p className="text-2xl font-extrabold text-rose-700">2~3배</p>
                  <p className="text-[10px] text-gray-500 mt-1">평균 +150~280%</p>
                </div>
              </div>

              {/* 상세 비교 표 (9개 지표) */}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">항목</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">기존 방식 (도입 전)</th>
                      <th className="px-4 py-3 text-left font-semibold text-emerald-700">GEO-AIO 도입 후 (3개월)</th>
                      <th className="px-4 py-3 text-left font-semibold text-violet-700 hidden sm:table-cell">변화</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">월간 콘텐츠 발행량</td>
                      <td className="px-4 py-3 text-gray-500">15~30편</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">100~150편</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">5~10배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">콘텐츠 1편 작성 시간</td>
                      <td className="px-4 py-3 text-gray-500">4~8시간</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">1~2분</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">240배 ↓</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">콘텐츠 1편당 단가</td>
                      <td className="px-4 py-3 text-gray-500">10~15만원 (외주)</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">약 1.3~2만원</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">단가 1/8 ↓</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">AI 인용 가능성</td>
                      <td className="px-4 py-3 text-gray-500">5% 미만</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">60%+</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">12배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">AI Overview 노출률</td>
                      <td className="px-4 py-3 text-gray-500">0~5%</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">40~55%</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">10배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">월간 마케팅 비용</td>
                      <td className="px-4 py-3 text-gray-500">200~300만원</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">월 200만원 (동일)</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">양 ~10배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">동시 운영 채널</td>
                      <td className="px-4 py-3 text-gray-500">1~2개 (블로그)</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">5채널 자동 변환</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">멀티 채널화</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">신규 고객 유입</td>
                      <td className="px-4 py-3 text-gray-500">기준 (100%)</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">220~280%</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">2.2~2.8배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">콘텐츠 자산 가치</td>
                      <td className="px-4 py-3 text-gray-500">단발성·소비형</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">영구 자산화</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">장기 누적</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 회수 기간 */}
              <div className="mt-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-800 mb-1">투자 회수 기간 (예상)</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      평균 <strong className="text-emerald-700">2~4개월</strong> 내 회수.
                      AI 검색 노출 증가 → 신규 유입 → 매출 증대 → 추가 투자 여력 확보의 선순환 구조 진입.
                      도입 1년 후 누적 콘텐츠 1,800편 + AI 인용 자산 영구 보유.
                    </p>
                  </div>
                </div>
              </div>

              {/* 면책 */}
              <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                ※ 위 수치는 동종 업계 평균 도입 사례를 기반으로 한 예상치입니다. 실제 결과는 업체 특성·콘텐츠 품질·시장 환경에 따라 달라질 수 있습니다.
              </p>
            </section>

            {/* 6. 가격표 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">6</span>
                <h3 className="text-xl font-bold text-gray-900">가격표</h3>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-emerald-800 mb-1">기존 마케팅 업체 vs GEO-AIO</p>
                    <p className="text-gray-700">
                      월 200~300만원으로 포스팅 15개 → <strong className="text-emerald-700">동일 비용으로 100~150개</strong> (1편당 단가 1/10)
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* 프로 플랜 */}
                <div className="relative bg-white rounded-xl border-2 border-blue-300 p-5">
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-bold rounded-full">
                    프로 (Pro)
                  </div>
                  <div className="mt-1 mb-3">
                    <p className="text-[11px] font-semibold text-gray-500 mb-0.5">월간 결제</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-blue-600">200</span>
                      <span className="text-sm font-bold text-gray-700">만원/월</span>
                    </div>
                    <p className="text-[11px] text-gray-500">부가세 별도 · 연 2,400만원</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 border-t border-gray-100 pt-3">
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">✓</span><span><strong className="text-blue-700">월 100건</strong> (연 1,200건)</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">✓</span><span>E-E-A-T 포맷 자동 적용</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">✓</span><span>기술 지원·상담</span></li>
                  </ul>
                </div>
                {/* 맥스 플랜 */}
                <div className="relative bg-white rounded-xl border-2 border-rose-300 p-5">
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[11px] font-bold rounded-full">
                    맥스 (Max)
                  </div>
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] font-bold rounded-full">
                    40% 할인
                  </div>
                  <div className="mt-1 mb-3">
                    <p className="text-[11px] font-semibold text-gray-500 mb-0.5">연간 결제 (추천)</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-violet-600">1,440</span>
                      <span className="text-sm font-bold text-gray-700">만원</span>
                      <span className="text-[11px] text-gray-400 line-through">2,440만원</span>
                    </div>
                    <p className="text-[11px] font-bold text-rose-600">월 120만원 상당 · 연 40% 절감</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 border-t border-gray-100 pt-3">
                    <li className="flex items-start gap-1.5"><span className="text-violet-500 mt-0.5">✓</span><span><strong className="text-violet-700">월 150건</strong> (연 1,800건)</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-violet-500 mt-0.5">✓</span><span>우선 기술 지원</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-rose-500 mt-0.5">★</span><span className="font-semibold text-rose-600">브랜드뉴스 기사 2회</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-rose-500 mt-0.5">★</span><span className="font-semibold text-rose-600">유튜브 소개영상 2회</span></li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all"
                >
                  전체 가격표 자세히 보기
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500">
                  ※ 부가세 10% 별도
                </span>
              </div>
            </section>

            {/* 7. CTA */}
            <section className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white">
              <h3 className="text-xl font-bold mb-2">{meta.label} 전용 데모, 30분 안에 직접 확인하세요</h3>
              <p className="text-sm text-white/80 mb-5 leading-relaxed">
                {meta.label}의 PDF 1개를 업로드하면, 30분 안에 10가지 톤의 E-E-A-T 최적화 콘텐츠가 완성됩니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/generate" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all">
                  무료 체험 시작
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition-all">요금제 보기</Link>
                <Link href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition-all">도입 문의</Link>
              </div>
            </section>

            {/* Footer info */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex flex-wrap items-center gap-3">
              <span>📞 010-2397-5734</span><span>·</span>
              <span>✉️ jaiwshim@gmail.com</span><span>·</span>
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
