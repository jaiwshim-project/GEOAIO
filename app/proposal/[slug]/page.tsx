import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import PdfDownloadButton from '@/components/PdfDownloadButton';

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

// ─────────────────────────────────────────
// 제안서 온톨로지 (Proposal Ontology) — 가벼운 시작
// schema.org 타입 매핑 (JSON-LD 자동 출력용)
// ─────────────────────────────────────────
type IndustryClass =
  | 'LegalService' | 'AccountingService' | 'Dentist'
  | 'LodgingBusiness' | 'Store' | 'EducationalOrganization'
  | 'SoftwareApplication' | 'WebSite' | 'ProfessionalService';

// 카테고리별 외부 티스토리 블로그 URL (있으면 표지에 핑크 버튼으로 노출)
const TISTORY_MAP: Record<string, string> = {
  '디지털스마일치과': 'https://digitalsmile.tistory.com/',
};

const INDUSTRY_MAP: Record<string, IndustryClass> = {
  '선명회계법인': 'AccountingService',
  '로엘-법무법인': 'LegalService',
  '디지털스마일치과': 'Dentist',
  '백제호텔': 'LodgingBusiness',
  '덕산-백제호텔': 'LodgingBusiness',
  '에블린영풍': 'Store',
  '틴트라이프tintlife': 'Store',
  '바이브코딩-클로드코드': 'EducationalOrganization',
  'ai선거솔루션-워룸': 'ProfessionalService',
  'ax온톨로지-진단': 'ProfessionalService',
  'ax덴탈그룹': 'ProfessionalService',
  'ax-biz': 'ProfessionalService',
  'geo-aio': 'SoftwareApplication',
  '라이프스타일': 'WebSite',
};

// 카테고리별 한계 및 문제점 (Critical Weakness) 분석 데이터
// 일반적 디지털 마케팅·DX 분석 프레임 기반 — 회사 고유 사실은 미포함
const WEAKNESS_DATA: Record<string, Array<{ title: string; bullets: string[] }>> = {
  '선명회계법인': [
    { title: '❶ 디지털 전략 부재', bullets: ['SEO 거의 없음', '콘텐츠 없음', 'AI 검색 대응 없음'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['랜딩 페이지 없음', '상담 유도 구조 없음', 'CTA 없음'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['메시지가 추상적', '"왜 이 회사인가?" 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['분석 플랫폼 없음', '리포트 자동화 없음'] },
  ],
  '로엘-법무법인': [
    { title: '❶ 디지털 전략 부재', bullets: ['법률 콘텐츠 SEO 약함', 'AI 검색 대응 없음', '전문 분야 키워드 전략 부재'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['상담 예약 시스템 없음', '전화·이메일 의존', '사건별 CTA 없음'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['일반 법무법인 메시지', '핵심 전문 분야 강조 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['사례 자동 분석 없음', '판례·법률 리포트 자동화 없음'] },
  ],
  '디지털스마일치과': [
    { title: '❶ 디지털 전략 부재', bullets: ['치과 SEO 일반 수준', 'AI 검색 노출 거의 없음', '환자 검색어 분석 없음'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['온라인 예약 시스템 약함', '후기 수집 자동화 없음', '재방문 유도 구조 없음'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['일반 치과 메시지', '디지털 스마일 디자인 강조 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['환자 데이터 분석 없음', '진료 결과 시각화 없음'] },
  ],
  '백제호텔': [
    { title: '❶ 디지털 전략 부재', bullets: ['OTA 채널 의존', '자체 SEO 약함', 'AI 검색 노출 없음'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['직접 예약 유도 부족', 'OTA 수수료 부담', '회원 가입 채널 약함'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['지역 호텔 메시지 추상적', '차별화된 경험 강조 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['고객 분석 없음', '시즌별 가격 최적화 자동화 없음'] },
  ],
  '덕산-백제호텔': [
    { title: '❶ 디지털 전략 부재', bullets: ['OTA 채널 의존', '자체 SEO 약함', 'AI 검색 노출 없음'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['직접 예약 유도 부족', 'OTA 수수료 부담', '회원 가입 채널 약함'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['지역 호텔 메시지 추상적', '차별화된 경험 강조 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['고객 분석 없음', '시즌별 가격 최적화 자동화 없음'] },
  ],
  '에블린영풍': [
    { title: '❶ 디지털 전략 부재', bullets: ['브랜드 콘텐츠 SEO 약함', 'AI 검색 대응 없음', '키워드 전략 부재'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['직접 유입 채널 한정', '구매 유도 CTA 약함', '재구매 동선 없음'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['일반 브랜드 메시지', '독자적 가치 제안 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['판매·고객 데이터 분석 없음', '리포트 자동화 없음'] },
  ],
  '틴트라이프tintlife': [
    { title: '❶ 디지털 전략 부재', bullets: ['뷰티 SEO 약함', '인스타·블로그 일관성 부족', 'AI 검색 대응 없음'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['직접 구매 유도 부족', '인플루언서 의존', '재구매 락인 약함'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['일반 뷰티 메시지', '컨셉·스토리 차별화 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['고객 취향 분석 없음', '트렌드 자동 추적 없음'] },
  ],
  '바이브코딩-클로드코드': [
    { title: '❶ 디지털 전략 부재', bullets: ['코딩 교육 SEO 약함', '커뮤니티 유입 한정', 'AI 검색 노출 부족'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['수강 모집 채널 한정', '무료→유료 전환 구조 약함', 'CTA 분산'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['타 부트캠프와 메시지 유사', '클로드코드 특화 강조 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['학습 진도 분석 없음', '학습 성과 리포트 자동화 없음'] },
  ],
  'ai선거솔루션-워룸': [
    { title: '❶ 디지털 전략 부재', bullets: ['정책·이슈 콘텐츠 SEO 약함', 'AI 검색 대응 없음', '키워드 추적 자동화 없음'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['후보·캠프 직접 contact 의존', '온라인 데모 유도 약함', 'CTA 분산'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['전통 컨설팅과의 차별화 부족', 'AI 솔루션 가치 강조 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['유권자 데이터 통합 부족', '여론·이슈 자동 리포트 부재'] },
  ],
  'geo-aio': [
    { title: '❶ 시장 인지도 확대 필요', bullets: ['B2B 의사결정자 도달 한정', '국내 GEO 시장 초기 단계', '경쟁 우위 인식 미흡'] },
    { title: '❷ 도입 채널 다변화 필요', bullets: ['직접 영업 비중 큼', '파트너 채널 미구축', '셀프 가입 동선 강화 필요'] },
    { title: '❸ 사례·증거 자산 누적', bullets: ['도입 케이스 스터디 부족', '효과 정량 데이터 누적 단계', '업종별 벤치마크 미흡'] },
    { title: '❹ 통합 분석 대시보드 강화', bullets: ['ROI 자동 계산 미흡', 'AI 인용률 모니터링 부재', '경쟁 키워드 추적 자동화 강화'] },
  ],
  '라이프스타일': [
    { title: '❶ 디지털 전략 부재', bullets: ['통합 SEO 전략 부재', '플랫폼별 톤 일관성 부족', 'AI 검색 대응 없음'] },
    { title: '❷ 고객 유입 구조 약함', bullets: ['콘텐츠→상담·구매 동선 약함', '랜딩 페이지 미흡', 'CTA 분산'] },
    { title: '❸ 브랜드 차별성 약함', bullets: ['일반 라이프스타일 메시지', '독자적 컨셉·스토리 부족'] },
    { title: '❹ 데이터 기반 서비스 없음', bullets: ['독자 행동 데이터 분석 없음', '트렌드 자동 추적 부재'] },
  ],
};

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

  // 카테고리별 한계 섹션 데이터 (있으면 1번에 추가, 후속 섹션 번호 +1 시프트)
  const weaknessData = WEAKNESS_DATA[slug];
  const hasWeakness = !!weaknessData;
  const isSeonmyeong = slug === '선명회계법인'; // AX 분석·개선 전략 전용
  const sectionNum = (base: number) => base + (hasWeakness ? 1 : 0);

  // FAQ 데이터 (모든 제안서 공통, 카테고리 라벨 동적 치환)
  const FAQS = [
    {
      q: 'AI 인용률은 정말 16배 향상되나요?',
      a: '일반 SEO 콘텐츠의 AI 인용 가능성은 5% 미만이지만, E-E-A-T 7단계 구조 + schema.org 온톨로지를 함께 적용하면 ChatGPT·Perplexity·Gemini 등 AI 검색엔진이 80% 이상 정확히 인용할 수 있습니다. 본 제안서 자체에도 동일 방법론이 적용되어 있습니다.',
    },
    {
      q: '도입 후 효과는 언제부터 나타나나요?',
      a: '계약 체결 즉시 운영을 시작하며, AI 검색엔진 인덱싱과 인용 효과는 평균 2~4주 내 가시화됩니다. 누적 효과로 3개월차에 AI 노출 점유율이 큰 폭으로 증가하며, 평균 2~4개월 내 투자 회수가 예상됩니다.',
    },
    {
      q: '콘텐츠는 누가 작성하나요? 품질은 어떻게 보장하나요?',
      a: 'GEO-AIO 플랫폼이 제미나이 AI 엔진으로 자동 생성합니다. 회사 RAG 파일(자료)을 기반으로 하므로 회사명·대표자명·주소·전화번호 등 사실 정보는 자료에 있는 그대로만 인용되며, 임의 생성·외부 통계 사용은 차단됩니다. 10가지 톤으로 생성 후 E-E-A-T 7단계 구조로 자동 변환됩니다.',
    },
    {
      q: '특정 업종(법무·의료·금융 등) 전문 용어도 정확히 처리되나요?',
      a: '예. 회사가 업로드한 RAG 자료(소개서·매뉴얼·내부 가이드 등)를 기반으로 콘텐츠가 생성되므로, 해당 업종의 전문 용어와 회사 고유의 표현이 그대로 반영됩니다. 본 제안서의 한계 분석 4가지(디지털 전략·유입·차별성·데이터)도 카테고리별로 분리되어 있습니다.',
    },
    {
      q: '계약 해지·환불 정책은 어떻게 되나요?',
      a: '월간 결제(프로 플랜)는 다음 결제일 전 해지 시 즉시 적용됩니다. 연간 결제(맥스 플랜)는 사용 잔여 기간을 일할 계산하여 환불 가능합니다. 자세한 사항은 010-2397-5734 또는 jaiwshim@gmail.com으로 문의해주세요.',
    },
  ];

  // ─── 온톨로지 → JSON-LD 자동 생성 (AI 인용률↑) ───
  const industryType: IndustryClass = INDUSTRY_MAP[slug] || 'ProfessionalService';
  const proposalUrl = `https://www.geo-aio.com/proposal/${encodeURIComponent(slug)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${meta.label} AI 최적화 마케팅(GEO-AIO) 제안서`,
    description: `${meta.label}을 위한 AI 검색 최적화(GEO-AIO) 자동화 콘텐츠 솔루션 제안서. 마케팅 비용 절감, AI 인용률 16배, 신규 고객 유입 3~4배 증대.`,
    url: proposalUrl,
    datePublished: new Date().toISOString().slice(0, 10),
    author: {
      '@type': 'Organization',
      name: 'GEO-AIO',
      url: 'https://www.geo-aio.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'GEO-AIO',
      url: 'https://www.geo-aio.com',
      logo: { '@type': 'ImageObject', url: 'https://www.geo-aio.com/icon.png' },
    },
    about: {
      '@type': industryType,
      name: meta.label,
      description: `${meta.label}은(는) AI 최적화 콘텐츠 마케팅(GEO-AIO) 솔루션의 도입 대상 업체입니다.`,
    },
    mentions: weaknessData
      ? weaknessData.map(w => ({
          '@type': 'Thing',
          name: w.title.replace(/^[❶❷❸❹]\s*/, ''),
          description: w.bullets.join(' / '),
        }))
      : undefined,
    offers: [
      {
        '@type': 'Offer',
        name: '프로 플랜',
        price: '200',
        priceCurrency: 'KRW',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '200', priceCurrency: 'KRW', unitText: '월', valueAddedTaxIncluded: false },
      },
      {
        '@type': 'Offer',
        name: '맥스 플랜',
        price: '1440',
        priceCurrency: 'KRW',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '1440', priceCurrency: 'KRW', unitText: '연', valueAddedTaxIncluded: false },
      },
      {
        '@type': 'Offer',
        name: '프리미엄 플랜',
        price: '2160',
        priceCurrency: 'KRW',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '540', priceCurrency: 'KRW', unitText: '분기', valueAddedTaxIncluded: false },
      },
    ],
  };

  // FAQ 별도 JSON-LD (Google FAQ rich result 호환)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
      {/* AI 인용률↑ schema.org JSON-LD (Article + FAQPage) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 프리미엄 배경 텍스처 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.08),_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.06),_transparent_60%)] pointer-events-none" />

      <Header />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/proposal"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-100 hover:text-white mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          전체 제안서 목록으로
        </Link>

        {/* 히어로 — 프리미엄 다크 + 골드 */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 sm:px-10 py-10 mb-6 ring-1 ring-amber-400/20 shadow-[0_20px_60px_-15px_rgba(251,191,36,0.25)]">
          {/* 골드 메탈릭 액센트 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.15),_transparent_50%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-amber-300">PROPOSAL TO</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
              <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">{meta.label}</span>
              <span className="block text-white/95 mt-1">AI 최적화 마케팅(GEO-AIO) 제안서</span>
            </h1>
            <p className="text-white/95 text-sm leading-relaxed mt-3">
              {meta.label}을 위한 맞춤형 자동화 콘텐츠 솔루션 제안서
            </p>
          </div>
        </section>

        {/* 다른 카테고리 탭 — 글래스모피즘 + 골드 액센트 */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6 sticky top-16 z-20 bg-slate-950/80 backdrop-blur-md py-2 -mx-2 px-2 rounded-xl">
            {allCategories.map((cat) => {
              const isActive = cat.slug === slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/proposal/${encodeURIComponent(cat.slug)}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-[0_4px_20px_-2px_rgba(251,191,36,0.5)] ring-1 ring-amber-300'
                      : 'bg-white/5 text-white/95 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-amber-400/30 hover:text-amber-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-slate-900/20 text-slate-900' : 'bg-white/10 text-white/85'
                  }`}>{cat.count}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* 제안서 본문 — 프리미엄 카드 (라이트 본문 + 골드 ring) */}
        <article className="bg-white rounded-2xl ring-1 ring-amber-200/40 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)] overflow-hidden">
          {/* 골드 메탈릭 상단 바 */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          <div className="p-6 sm:p-10 space-y-8">

            {/* 표지 */}
            <header className="relative border-b border-gray-100 pb-6">
              {/* PDF 저장 버튼 — 표지 우측 상단 */}
              <div className="absolute top-0 right-0 z-10">
                <PdfDownloadButton targetSelector="article" filename={`${meta.label}-제안서`} />
              </div>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="w-8 h-px bg-gradient-to-r from-amber-400 to-transparent" />
                <p className="text-[10px] font-bold tracking-[0.25em] text-amber-600">PROPOSAL TO</p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight">
                {meta.label}
                <span className="block text-lg sm:text-xl mt-1 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent font-bold">
                  AI 최적화 마케팅(GEO-AIO) 제안서
                </span>
              </h2>
              <p className="text-base text-gray-600 mb-4">
                AI 검색 시대, <strong className="text-slate-900">자동화 콘텐츠 생성 플랫폼</strong>으로 마케팅 비용을 80% 절감하고
                AI 검색 노출 점유율을 3배 높이는 방법
              </p>
              <Link
                href={`/blog/category/${encodeURIComponent(slug)}`}
                className="group inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/70 rounded-xl hover:shadow-[0_8px_24px_-6px_rgba(251,191,36,0.4)] hover:border-amber-400 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-700 font-semibold mb-0.5">📌 실제 운영 중인 블로그 보기</p>
                  <p className="text-sm font-bold text-slate-900">{meta.label} 카테고리에 게시된 {posts.length}편의 AI 최적화 콘텐츠</p>
                </div>
                <svg className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              {/* 외부 티스토리 블로그 (카테고리별) */}
              {TISTORY_MAP[slug] && (
                <a
                  href={TISTORY_MAP[slug]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-5 py-3 mt-3 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border border-pink-300 rounded-xl hover:shadow-[0_8px_24px_-6px_rgba(236,72,153,0.4)] hover:border-pink-400 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 17.5c-4.142 0-7.5-3.358-7.5-7.5S7.858 4.5 12 4.5s7.5 3.358 7.5 7.5-3.358 7.5-7.5 7.5zm0-12.5a5 5 0 100 10 5 5 0 000-10zm0 7.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-pink-700 font-semibold mb-0.5">📌 실제 운영 중인 티스토리 보기</p>
                    <p className="text-sm font-bold text-slate-900 break-all">{TISTORY_MAP[slug]}</p>
                  </div>
                  <svg className="w-5 h-5 text-pink-600 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              )}
            </header>

            {/* 1. 한계 및 문제점 (Critical Weakness) — 카테고리별 데이터 기반 */}
            {hasWeakness && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 ring-2 ring-rose-300/50 flex items-center justify-center text-sm font-bold shadow-md">1</span>
                  <h3 className="text-xl font-bold text-gray-900">한계 및 문제점 (Critical Weakness)</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  현재 구조에서 가장 시급하게 해결해야 할 부분입니다. 디지털·콘텐츠·데이터 영역에서 구조적 공백이 명확합니다.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {weaknessData.map((w, i) => (
                    <div key={i} className="relative bg-gradient-to-br from-rose-50 via-white to-rose-50 ring-1 ring-rose-200/70 rounded-xl p-4 overflow-hidden shadow-[0_4px_16px_-4px_rgba(244,63,94,0.15)]">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />
                      <p className="text-sm font-bold text-rose-700 mb-2 flex items-center gap-1.5">
                        {w.title}
                      </p>
                      <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside marker:text-rose-400">
                        {w.bullets.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 1. 현황 진단 (선명회계법인은 2번) */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 ring-2 ring-rose-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(1)}</span>
                <h3 className="text-xl font-bold text-gray-900">현황 진단: {meta.label}이 직면한 콘텐츠 마케팅의 한계</h3>
              </div>
              <div className="bg-gradient-to-br from-rose-50/40 via-white to-orange-50/40 rounded-xl p-5 border border-rose-100/70 space-y-4 shadow-[0_4px_20px_-8px_rgba(244,63,94,0.15)]">
                <p className="text-sm text-gray-700 leading-relaxed">
                  ChatGPT, Google AI Overview, Perplexity 등 <strong>AI 검색엔진이 전체 검색 트래픽의 40% 이상을 점유</strong>하고 있습니다.
                  하지만 기존 SEO 방식으로 작성된 콘텐츠 중 <strong className="text-rose-600">90%는 AI에 인용되지 못합니다.</strong>
                </p>

                {/* AI 검색 점유율 시각화 도넛 (CSS conic-gradient) */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="text-center bg-white rounded-xl p-3 border border-rose-100">
                    <div className="relative w-16 h-16 mx-auto mb-1.5">
                      <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#f43f5e 0% 40%, #fee2e2 40% 100%)' }} />
                      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <span className="text-sm font-extrabold text-rose-600">40%+</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-700">AI 검색 점유율</p>
                    <p className="text-[9px] text-gray-700">전체 검색 트래픽</p>
                  </div>
                  <div className="text-center bg-white rounded-xl p-3 border border-rose-100">
                    <div className="relative w-16 h-16 mx-auto mb-1.5">
                      <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#fbbf24 0% 5%, #fef3c7 5% 100%)' }} />
                      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <span className="text-sm font-extrabold text-amber-600">5%</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-700">AI 인용 가능성</p>
                    <p className="text-[9px] text-gray-700">일반 SEO 기준</p>
                  </div>
                  <div className="text-center bg-white rounded-xl p-3 border border-rose-100">
                    <div className="relative w-16 h-16 mx-auto mb-1.5">
                      <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#f43f5e 0% 90%, #fee2e2 90% 100%)' }} />
                      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <span className="text-sm font-extrabold text-rose-600">90%</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-700">미인용 콘텐츠</p>
                    <p className="text-[9px] text-gray-700">기존 SEO 방식</p>
                  </div>
                </div>

                {/* 핵심 지표 막대 그래프 */}
                <div className="space-y-2.5 bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700 mb-2">📊 기존 방식 핵심 지표</p>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700"><strong>콘텐츠 1편 작성 시간</strong></span>
                      <span className="text-xs font-bold text-rose-600">4~8시간 / 10~15만원</span>
                    </div>
                    <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700"><strong>AI 인용 가능성</strong> (일반 SEO)</span>
                      <span className="text-xs font-bold text-rose-600">5% 미만</span>
                    </div>
                    <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500" style={{ width: '5%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700"><strong>월간 발행량</strong> (인력 1명)</span>
                      <span className="text-xs font-bold text-rose-600">15~30편</span>
                    </div>
                    <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. 솔루션 (선명회계법인은 3번) */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 ring-2 ring-emerald-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(2)}</span>
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
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 ring-2 ring-purple-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(3)}</span>
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
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-amber-100">구분</th>
                        <th className="px-3 py-2 text-left font-bold text-white">SEO 방식 (검색 최적화)</th>
                        <th className="px-3 py-2 text-left font-bold text-fuchsia-200">E-E-A-T 방식 (AI 최적화)</th>
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
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-amber-100">항목</th>
                        <th className="px-3 py-2 text-left font-bold text-white">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-bold text-fuchsia-200">E-E-A-T 방식</th>
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
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-amber-100">요소</th>
                        <th className="px-3 py-2 text-left font-bold text-white">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-bold text-fuchsia-200">E-E-A-T 방식</th>
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
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-amber-100">항목</th>
                        <th className="px-3 py-2 text-left font-bold text-white">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-bold text-fuchsia-200">E-E-A-T 방식</th>
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
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-amber-100">항목</th>
                        <th className="px-3 py-2 text-left font-bold text-white">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-bold text-fuchsia-200">E-E-A-T 방식</th>
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
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-amber-100">항목</th>
                        <th className="px-3 py-2 text-left font-bold text-white">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-bold text-fuchsia-200">E-E-A-T 방식</th>
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
                    <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-amber-100">항목</th>
                        <th className="px-3 py-2 text-left font-bold text-white">SEO 방식</th>
                        <th className="px-3 py-2 text-left font-bold text-fuchsia-200">E-E-A-T 방식</th>
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
                <p className="text-xs font-semibold text-white/95 mb-2">🔥 최종 결론</p>
                <div className="space-y-1.5 mb-4 text-sm">
                  <p>👉 <strong>SEO 방식</strong>은 &quot;트래픽을 만드는 구조&quot;</p>
                  <p>👉 <strong>E-E-A-T 방식</strong>은 &quot;신뢰와 인용을 만드는 구조&quot;</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-xs font-semibold text-white/95 mb-1">전략 한 문장</p>
                  <p className="text-base font-bold">
                    👉 &quot;SEO로 유입을 만들고, E-E-A-T 구조로 AI가 인용하게 만든다&quot;
                  </p>
                </div>
              </div>
            </section>

            {/* 4. 적용 사례 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700 ring-2 ring-sky-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(4)}</span>
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
                      <span className="text-xs text-gray-600 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
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

            {/* [선명회계법인 전용] AX 분석·개선 전략 */}
            {slug === '선명회계법인' && (
              <>
                {/* AX/AI 관점 분석 — Level Map */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 ring-2 ring-indigo-300/50 flex items-center justify-center text-sm font-bold shadow-md">AX</span>
                    <h3 className="text-xl font-bold text-gray-900">AX / AI 관점 분석</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">대표님 관점에서 핵심입니다. 현 위치와 도달 가능한 미래 단계를 4단계로 표현했습니다.</p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-gray-100 border border-gray-300 rounded-xl p-4">
                      <span className="shrink-0 w-14 h-14 rounded-xl bg-gray-300 text-gray-800 flex flex-col items-center justify-center text-[10px] font-bold">
                        <span className="text-xl">1</span>현재
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">전통 회계법인</p>
                        <p className="text-xs text-gray-600">오프라인 상담 + 수기 리포트 중심. 디지털·AI 자산 부재.</p>
                      </div>
                    </div>
                    <div className="text-center text-gray-600">↓</div>
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <span className="shrink-0 w-14 h-14 rounded-xl bg-emerald-200 text-emerald-800 flex flex-col items-center justify-center text-[10px] font-bold">
                        <span className="text-xl">2</span>전환
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-800">AI 회계 컨설팅 플랫폼</p>
                        <p className="text-xs text-gray-700">AI 상담 엔진 + 자동 리포트 + GEO-AIO 콘텐츠 자산 확보.</p>
                      </div>
                    </div>
                    <div className="text-center text-gray-600">↓</div>
                    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <span className="shrink-0 w-14 h-14 rounded-xl bg-indigo-200 text-indigo-800 flex flex-col items-center justify-center text-[10px] font-bold">
                        <span className="text-xl">3</span>확장
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-indigo-800">AX Ontology 기반 기업 분석 SaaS</p>
                        <p className="text-xs text-gray-700">설문→데이터→그래프→전략의 구조화된 기업 진단 SaaS화.</p>
                      </div>
                    </div>
                    <div className="text-center text-gray-600">↓</div>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-xl p-4">
                      <span className="shrink-0 w-14 h-14 rounded-xl bg-violet-200 text-violet-800 flex flex-col items-center justify-center text-[10px] font-bold">
                        <span className="text-xl">4</span>최종
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-violet-800">Palantir형 기업 데이터 플랫폼</p>
                        <p className="text-xs text-gray-700">기업·산업·시장 데이터 통합 분석 + 의사결정 지원 플랫폼.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 7. 대표님 기준 개선 전략 */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-300/50 flex items-center justify-center text-sm font-bold shadow-md">★</span>
                    <h3 className="text-xl font-bold text-gray-900">대표님 기준 개선 전략 (핵심)</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-white border-2 border-emerald-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-emerald-600 mb-1">1️⃣ 콘텐츠</p>
                      <p className="text-sm font-bold text-gray-900 mb-2">GEO + AIO 콘텐츠 전략</p>
                      <p className="text-[11px] text-gray-700 mb-2">현재: 없음 → 반드시 필요</p>
                      <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                        <li>세무조사 대응 방법</li>
                        <li>법인 절세 전략</li>
                        <li>부동산 세금 구조</li>
                      </ul>
                      <p className="text-[11px] text-emerald-700 mt-2 font-medium">👉 AI가 인용하는 콘텐츠 제작</p>
                    </div>
                    <div className="bg-white border-2 border-indigo-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-indigo-600 mb-1">2️⃣ 상담</p>
                      <p className="text-sm font-bold text-gray-900 mb-2">AI 상담 엔진</p>
                      <p className="text-xs text-gray-700 mb-2">방문 → 질문 → 분석 → 솔루션 제시</p>
                      <p className="text-[11px] text-indigo-700 font-medium">👉 대표님 AI톡허브 적용 가능</p>
                    </div>
                    <div className="bg-white border-2 border-violet-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-violet-600 mb-1">3️⃣ 플랫폼</p>
                      <p className="text-sm font-bold text-gray-900 mb-2">AX Ontology 플랫폼</p>
                      <p className="text-xs text-gray-700 mb-2">기업 입력 → 설문 → 데이터 → 그래프 → 전략</p>
                      <p className="text-[11px] text-violet-700 font-medium">👉 완전 고부가가치 전환</p>
                    </div>
                    <div className="bg-white border-2 border-rose-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-rose-600 mb-1">4️⃣ 대시보드</p>
                      <p className="text-sm font-bold text-gray-900 mb-2">KPI 기반 대시보드</p>
                      <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                        <li>세무 리스크 점수</li>
                        <li>재무 건강도</li>
                        <li>성장 예측</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* 5. ROI */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 ring-2 ring-violet-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(5)}</span>
                <h3 className="text-xl font-bold text-gray-900">예상 ROI: 3개월 후 변화</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                기존 방식 대비 콘텐츠 생산성·AI 인용률·마케팅 비용·고객 유입까지 모든 지표가 향상됩니다.
              </p>

              {/* 핵심 지표 카드 (3개) — 프리미엄 다크 + 골드 액센트 */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="relative bg-gradient-to-br from-slate-900 to-emerald-950 ring-1 ring-emerald-400/30 rounded-xl p-4 text-center overflow-hidden shadow-[0_8px_30px_-10px_rgba(16,185,129,0.3)]">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                  <p className="text-[11px] font-bold text-emerald-200 mb-1 tracking-wide">콘텐츠 생산성</p>
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">5~10배</p>
                  <p className="text-[10px] text-white/75 mt-1">월 15~30편 → 100~150편</p>
                </div>
                <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 ring-1 ring-amber-400/40 rounded-xl p-4 text-center overflow-hidden shadow-[0_8px_30px_-10px_rgba(251,191,36,0.4)]">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                  <p className="text-[11px] font-semibold text-amber-300 mb-1 tracking-wide">AI 인용률</p>
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">16배 ↑</p>
                  <p className="text-[10px] text-white/75 mt-1">5% 미만 → 80%+</p>
                </div>
                <div className="relative bg-gradient-to-br from-slate-900 to-rose-950 ring-1 ring-rose-400/30 rounded-xl p-4 text-center overflow-hidden shadow-[0_8px_30px_-10px_rgba(244,63,94,0.3)]">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />
                  <p className="text-[11px] font-semibold text-rose-300 mb-1 tracking-wide">신규 고객 유입</p>
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-rose-300 to-orange-200 bg-clip-text text-transparent">3~4배</p>
                  <p className="text-[10px] text-white/75 mt-1">평균 +220~380%</p>
                </div>
              </div>

              {/* 상세 비교 표 (9개 지표) */}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-amber-100">항목</th>
                      <th className="px-4 py-3 text-left font-bold text-white">기존 방식 (도입 전)</th>
                      <th className="px-4 py-3 text-left font-bold text-emerald-200">GEO-AIO 도입 후 (3개월)</th>
                      <th className="px-4 py-3 text-left font-bold text-violet-200 hidden sm:table-cell">변화</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">월간 콘텐츠 발행량</td>
                      <td className="px-4 py-3 text-gray-700">15~30편</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">100~150편</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">5~10배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">콘텐츠 1편당 단가</td>
                      <td className="px-4 py-3 text-gray-700">10~15만원 (외주)</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">약 1.3~2만원</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">단가 1/8 ↓</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">AI 인용 가능성</td>
                      <td className="px-4 py-3 text-gray-700">5% 미만</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">80%+</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">16배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">AI Overview 노출률</td>
                      <td className="px-4 py-3 text-gray-700">0~5%</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">80~85%</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">16배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">월간 마케팅 비용</td>
                      <td className="px-4 py-3 text-gray-700">200~300만원</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">월 200만원 (동일)</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">양 ~10배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">동시 운영 채널</td>
                      <td className="px-4 py-3 text-gray-700">1~2개 (블로그)</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">5채널 자동 변환</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">멀티 채널화</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">신규 고객 유입</td>
                      <td className="px-4 py-3 text-gray-700">기준 (100%)</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">320~380%</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">3.2~3.8배 ↑</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">콘텐츠 자산 가치</td>
                      <td className="px-4 py-3 text-gray-700">단발성·소비형</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">영구 자산화</td>
                      <td className="px-4 py-3 text-violet-700 font-bold hidden sm:table-cell">장기 누적</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 회수 기간 */}
              <div className="relative mt-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 ring-1 ring-amber-400/40 rounded-xl p-4 overflow-hidden shadow-[0_8px_30px_-10px_rgba(251,191,36,0.4)]">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_60%)]" />
                <div className="relative flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-200 mb-1 tracking-wide">투자 회수 기간 (예상)</p>
                    <p className="text-xs text-white/95 leading-relaxed">
                      평균 <strong className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">2~4개월</strong> 내 회수.
                      AI 검색 노출 증가 → 신규 유입 → 매출 증대 → 추가 투자 여력 확보의 선순환 구조 진입.
                      도입 1년 후 누적 콘텐츠 1,800편 + AI 인용 자산 영구 보유.
                    </p>
                  </div>
                </div>
              </div>

              {/* 면책 */}
              <p className="mt-3 text-[11px] text-gray-600 leading-relaxed">
                ※ 위 수치는 동종 업계 평균 도입 사례를 기반으로 한 예상치입니다. 실제 결과는 업체 특성·콘텐츠 품질·시장 환경에 따라 달라질 수 있습니다.
              </p>
            </section>

            {/* 6. 온톨로지(schema.org) 적용 안내 — AI 인용 최적화 */}
            <section className="relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-yellow-300 text-slate-900 ring-2 ring-amber-400/60 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(6)}</span>
                <h3 className="text-xl font-bold text-gray-900">AI 인용 최적화 — schema.org 온톨로지 적용</h3>
                <span className="ml-auto text-[10px] font-bold tracking-[0.2em] bg-gradient-to-r from-amber-600 to-yellow-700 bg-clip-text text-transparent">AUTOMATED</span>
              </div>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                이 제안서는 <strong className="text-slate-900">schema.org 기반 온톨로지(구조화 데이터)</strong>로 자동 출력되어,
                GPT·Perplexity·Gemini 등 AI 검색엔진이 정확히 인용할 수 있습니다.
                같은 데이터가 본문 렌더링과 AI 메타데이터에 동시 사용되는 <strong className="text-slate-900">단일 소스 구조</strong>입니다.
              </p>

              {/* 적용된 온톨로지 구조 다이어그램 */}
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ring-1 ring-amber-400/30 rounded-2xl p-5 mb-4 overflow-hidden shadow-[0_12px_40px_-15px_rgba(251,191,36,0.4)]">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.08),_transparent_60%)]" />
                <div className="relative">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-amber-300 mb-3">ONTOLOGY MAP</p>
                  {/* 3단 흐름: 카테고리 → schema.org 클래스 → AI 인용 */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="text-center">
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                        <p className="text-[10px] text-white/75 mb-1">카테고리</p>
                        <p className="text-sm font-bold text-white truncate">{meta.label}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-amber-400 text-2xl">→</div>
                      <p className="text-[9px] text-amber-300/80 -mt-1">매핑</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-amber-400/20 to-yellow-500/10 backdrop-blur-sm border border-amber-400/40 rounded-xl p-3">
                        <p className="text-[10px] text-amber-300 mb-1">schema.org 클래스</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent truncate">{industryType}</p>
                      </div>
                    </div>
                  </div>
                  {/* 하단 라벨들 */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {['Article', 'Organization', industryType, ...(weaknessData ? ['mentions×4'] : []), 'Offer×2'].map((tag, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-amber-400/30 text-amber-200 rounded-full">@type:{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI 인용률 시각화 */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                <p className="text-sm font-bold text-gray-900 mb-3">AI 인용률 비교 (콘텐츠 방식별)</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">일반 SEO 콘텐츠</span>
                      <span className="text-xs font-bold text-gray-700">~5%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full" style={{ width: '5%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">E-E-A-T 적용 콘텐츠</span>
                      <span className="text-xs font-bold text-emerald-600">~60%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-amber-700">+ schema.org 온톨로지 (본 제안서)</span>
                      <span className="text-xs font-extrabold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">80%+</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.6)]" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-3 leading-relaxed">
                  ※ 일반론적 추정치. AI 검색엔진별·키워드별로 차이가 있을 수 있음. 같은 콘텐츠라도 schema.org 적용 시 AI가 출처를 정확히 인용할 가능성이 크게 향상됩니다.
                </p>
              </div>

              {/* 적용 효과 4가지 카드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { icon: '🤖', label: 'AI 인용', desc: 'GPT·Perplexity 정확히 출처 인용' },
                  { icon: '🔍', label: '구글 Rich Result', desc: 'Article·Offer rich snippet' },
                  { icon: '🧬', label: '단일 소스', desc: '본문↔메타 동기화' },
                  { icon: '⚡', label: '자동 출력', desc: '카테고리 추가만으로 확장' },
                ].map((b, i) => (
                  <div key={i} className="relative bg-gradient-to-br from-white to-amber-50 ring-1 ring-amber-200/70 rounded-xl p-3 overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                    <div className="text-xl mb-1">{b.icon}</div>
                    <p className="text-xs font-bold text-amber-800 mb-0.5">{b.label}</p>
                    <p className="text-[10px] text-gray-600 leading-snug">{b.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. 가격표 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(7)}</span>
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 프로 플랜 */}
                <div className="relative bg-white rounded-xl border-2 border-blue-300 p-5">
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-bold rounded-full">
                    프로 (Pro)
                  </div>
                  <div className="mt-1 mb-3">
                    <p className="text-[11px] font-semibold text-gray-700 mb-0.5">1년 계약 · 월간 결제</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-blue-600">200</span>
                      <span className="text-sm font-bold text-gray-700">만원/월</span>
                    </div>
                    <p className="text-[11px] text-gray-700">부가세 별도 · 연 2,400만원</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 border-t border-gray-100 pt-3">
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">✓</span><span><strong className="text-blue-700">월 100건</strong> (연 1,200건)</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">✓</span><span>E-E-A-T 포맷 자동 적용</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">✓</span><span>기술 지원·상담</span></li>
                  </ul>
                </div>
                {/* 프리미엄 플랜 — 라이트 indigo */}
                <div className="relative bg-white rounded-xl border-2 border-indigo-300 p-5">
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[11px] font-bold rounded-full">
                    프리미엄 (Premium)
                  </div>
                  <div className="mt-1 mb-3">
                    <p className="text-[11px] font-semibold text-gray-700 mb-0.5">1년 계약 · 분기별 결제</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-indigo-600">540</span>
                      <span className="text-sm font-bold text-gray-700">만원/분기</span>
                    </div>
                    <p className="text-[11px] font-bold text-indigo-600">연 2,160만원 (4회 분기 결제)</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">부가세 별도</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-700 border-t border-gray-100 pt-3">
                    <li className="flex items-start gap-1.5"><span className="text-indigo-500 mt-0.5">✓</span><span><strong className="text-indigo-700">월 120건</strong> (연 1,440건)</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-indigo-500 mt-0.5">✓</span><span>E-E-A-T 포맷 자동 적용</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-indigo-500 mt-0.5">✓</span><span>기술 지원·상담</span></li>
                  </ul>
                </div>
                {/* 맥스 플랜 */}
                <div className="relative bg-white rounded-xl border-2 border-rose-300 p-5">
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[11px] font-bold rounded-full">
                    맥스 (Max)
                  </div>
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] font-bold rounded-full">
                    20% 할인
                  </div>
                  <div className="mt-1 mb-3">
                    <p className="text-[11px] font-semibold text-gray-700 mb-0.5">연간 결제 (추천)</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-2xl font-extrabold text-violet-600">1,440</span>
                      <span className="text-sm font-bold text-gray-700">만원</span>
                      <span className="text-[11px] text-gray-600 line-through">1,920만원</span>
                      <span className="text-[10px] font-bold text-rose-600">(20% 할인)</span>
                    </div>
                    <p className="text-[11px] font-bold text-rose-600">월 120만원 상당 · 연 20% 절감</p>
                    <p className="text-[9px] text-gray-600 mt-1 leading-snug">※ 본 할인 이벤트는 사전 예고 없이 원래 가격으로 환원될 수 있습니다.</p>
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
                <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700">
                  ※ 부가세 10% 별도
                </span>
              </div>
            </section>

            {/* 8. 도입 절차 (4단계 타임라인) */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 ring-2 ring-emerald-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(8)}</span>
                <h3 className="text-xl font-bold text-gray-900">도입 절차 — 평균 3~4일 내 운영 시작</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">상담부터 운영 시작까지 단순한 4단계입니다. 복잡한 시스템 통합 없이 즉시 도입 가능합니다.</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                {[
                  { num: 1, icon: '📞', title: '상담 문의', desc: '전화·이메일로 요구사항 확인', time: '1일' },
                  { num: 2, icon: '📋', title: '견적 협의', desc: '플랜·기간·맞춤 옵션 결정', time: '1~2일' },
                  { num: 3, icon: '✍️', title: '계약 체결', desc: '서면 계약·결제 진행', time: '1일' },
                  { num: 4, icon: '🚀', title: '운영 시작', desc: 'RAG 자료 업로드·즉시 콘텐츠 생성', time: '즉시' },
                ].map((s, i) => (
                  <div key={i} className="relative">
                    {/* 화살표 (모바일 미노출) */}
                    {i < 3 && (
                      <div className="hidden sm:block absolute top-1/2 -right-2 -translate-y-1/2 z-10 text-emerald-400 text-xl font-bold">→</div>
                    )}
                    <div className="relative bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/60 ring-1 ring-emerald-200/70 rounded-xl p-4 h-full shadow-[0_4px_16px_-6px_rgba(16,185,129,0.2)] overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-emerald-300/40">{s.num}</span>
                        <span className="text-xl">{s.icon}</span>
                        <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{s.time}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{s.title}</p>
                      <p className="text-xs text-gray-600 leading-snug">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 9. 신뢰 시그널 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 ring-2 ring-indigo-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(9)}</span>
                <h3 className="text-xl font-bold text-gray-900">신뢰 시그널 — 검증된 실적·자산</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="relative bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/40 ring-1 ring-indigo-200/70 rounded-xl p-4 text-center shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
                  <div className="flex items-baseline justify-center gap-0.5 mb-1">
                    <span className="text-3xl font-extrabold bg-gradient-to-br from-indigo-600 to-indigo-700 bg-clip-text text-transparent">14</span>
                    <span className="text-sm font-bold text-indigo-700">개</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">운영 카테고리</p>
                  <p className="text-[10px] text-gray-700 mt-1 leading-snug">실제 운영 중인 업체 카테고리</p>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/40 ring-1 ring-emerald-200/70 rounded-xl p-4 text-center shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                  <div className="flex items-baseline justify-center gap-0.5 mb-1">
                    <span className="text-3xl font-extrabold bg-gradient-to-br from-emerald-600 to-emerald-700 bg-clip-text text-transparent">357</span>
                    <span className="text-sm font-bold text-emerald-700">편</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">누적 콘텐츠</p>
                  <p className="text-[10px] text-gray-700 mt-1 leading-snug">AI 인용 가능 자산 누적 보유</p>
                </div>
                <div className="relative bg-gradient-to-br from-amber-50/40 via-white to-amber-50/40 ring-1 ring-amber-200/70 rounded-xl p-4 text-center shadow-[0_4px_16px_-6px_rgba(251,191,36,0.2)] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                  <div className="flex items-baseline justify-center gap-0.5 mb-1">
                    <span className="text-3xl font-extrabold bg-gradient-to-br from-amber-600 to-yellow-700 bg-clip-text text-transparent">16</span>
                    <span className="text-sm font-bold text-amber-700">배</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">AI 인용률 향상</p>
                  <p className="text-[10px] text-gray-700 mt-1 leading-snug">5% → 80%+ (E-E-A-T+온톨로지)</p>
                </div>
                <div className="relative bg-gradient-to-br from-rose-50/40 via-white to-rose-50/40 ring-1 ring-rose-200/70 rounded-xl p-4 text-center shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
                  <div className="flex items-baseline justify-center gap-0.5 mb-1">
                    <span className="text-3xl font-extrabold bg-gradient-to-br from-rose-600 to-rose-700 bg-clip-text text-transparent">✓</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">특허·저작권</p>
                  <p className="text-[10px] text-gray-700 mt-1 leading-snug">제미나이 AI 기반 등록 완료</p>
                </div>
              </div>
            </section>

            {/* 10. FAQ */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 ring-2 ring-purple-300/50 flex items-center justify-center text-sm font-bold shadow-md">{sectionNum(10)}</span>
                <h3 className="text-xl font-bold text-gray-900">자주 묻는 질문 (FAQ)</h3>
                <span className="ml-auto text-[10px] font-bold tracking-[0.2em] bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">SCHEMA.ORG</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                도입 검토 시 자주 받는 질문에 대한 답변입니다. schema.org/FAQPage 구조로 자동 출력되어 AI 검색엔진과 구글 rich result에서도 노출됩니다.
              </p>
              <div className="space-y-2.5">
                {FAQS.map((f, i) => (
                  <details key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 transition-all">
                    <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 hover:bg-purple-50/40 transition-colors">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 ring-1 ring-purple-300/50 flex items-center justify-center text-[11px] font-bold">Q</span>
                      <span className="text-sm font-semibold text-gray-900 flex-1">{f.q}</span>
                      <svg className="w-4 h-4 text-purple-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-4 pb-4 pt-1 flex items-start gap-3 border-t border-purple-100/60">
                      <span className="w-6 h-6 shrink-0 mt-0.5 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 ring-1 ring-emerald-300/50 flex items-center justify-center text-[11px] font-bold">A</span>
                      <p className="text-xs text-gray-700 leading-relaxed">{f.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* 7. CTA — 프리미엄 다크 + 골드 */}
            <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white overflow-hidden ring-1 ring-amber-400/20 shadow-[0_20px_60px_-15px_rgba(251,191,36,0.3)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.18),_transparent_60%)]" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[10px] font-bold tracking-[0.2em] text-amber-300">EXCLUSIVE DEMO</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">{meta.label}</span> 전용 데모, 30분 안에 직접 확인하세요
                </h3>
                <p className="text-sm text-white/95 mb-5 leading-relaxed">
                  {meta.label}의 PDF 1개를 업로드하면, 30분 안에 10가지 톤의 E-E-A-T 최적화 콘텐츠가 완성됩니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/blog/category/${encodeURIComponent(slug)}`}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 rounded-lg font-bold text-sm hover:shadow-[0_8px_24px_-4px_rgba(251,191,36,0.6)] hover:scale-[1.02] transition-all ring-1 ring-amber-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    AI 최적화 콘텐츠 보기
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-sm text-amber-100 border border-amber-400/30 rounded-lg font-semibold text-sm hover:bg-white/10 hover:border-amber-400/60 transition-all">요금제 보기</Link>
                  <Link href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-sm text-amber-100 border border-amber-400/30 rounded-lg font-semibold text-sm hover:bg-white/10 hover:border-amber-400/60 transition-all">도입 문의</Link>
                </div>
              </div>
            </section>

            {/* Footer info */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-600 flex flex-wrap items-center gap-3">
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
