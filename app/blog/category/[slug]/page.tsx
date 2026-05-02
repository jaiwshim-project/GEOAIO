import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogHeroCallout from '@/components/BlogHeroCallout';
import type { BlogPost } from '@/lib/supabase-storage';

// 카테고리 페이지는 ?lang= searchParams로 언어 필터링 — 본질적으로 동적.
// 색인 우선 대상은 /blog (LIST) + /blog/[id] (SINGLE) 두 곳이며 /blog/category는 보조 네비.
// generateStaticParams + searchParams 조합은 빌드 충돌(500)을 일으켜 dynamic 유지.
export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES: Record<string, { label: string; description: string; color: string }> = {
  'geo-aio':  { label: 'GEO-AIO', description: 'AI 검색 최적화 관련 콘텐츠', color: 'from-indigo-500 to-violet-600' },
  'regenmed': { label: '리젠메드컨설팅', description: '컨설팅 관련 콘텐츠', color: 'from-emerald-500 to-teal-600' },
  'brewery':  { label: '대전맥주장 수제맥주', description: '수제맥주 관련 콘텐츠', color: 'from-amber-500 to-orange-600' },
  'dental':   { label: '치과병원', description: '치과 관련 콘텐츠', color: 'from-sky-500 to-blue-600' },
};

const EXTRA_COLORS = [
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
  'from-orange-500 to-red-600',
];

// 카테고리별 대표/연락처/주소 표기 — 히어로 섹션에 노출
// 신뢰 신호(E-E-A-T)·로컬 검색 색인·AI 검색 인용에 모두 도움.
// 데이터 없는 카테고리는 자동으로 비표시.
interface CategoryContact {
  representative?: string;  // 대표자명·직함
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}
const CATEGORY_CONTACTS: Record<string, CategoryContact> = {
  '디지털스마일치과': {
    representative: '박찬익 원장',
    address: '대전광역시 중구',
    website: 'https://digitalsmile.tistory.com',
  },
  'dental': {
    representative: '박찬익 원장',
    address: '대전광역시 중구',
    website: 'https://digitalsmile.tistory.com',
  },
  'geo-aio': {
    representative: '심재우 대표 · AI선거솔루션',
    email: 'jaiwshim@gmail.com',
    phone: '010-2397-5734',
    website: 'https://www.geo-aio.com',
  },
};

function getSupabase() {
  // Server-side: service role 우선 (Supabase max-rows 우회 + RLS 우회로 전체 글 fetch).
  // 없으면 anon key 폴백.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

// 콘텐츠 언어 자동 감지 — 승자독식(highest count wins) 방식
// 영문 글에 한국어 회사명이 몇 개 섞여 있어도 영어로 정확히 분류되도록.
type DetectedLang = 'ko' | 'en' | 'zh' | 'ja';
function detectLanguage(text: string): DetectedLang {
  if (!text) return 'ko';
  const sample = text.slice(0, 3000);
  const ko = (sample.match(/[가-힣]/g) || []).length; // 한글 음절
  const ja = (sample.match(/[぀-ゟ゠-ヿ]/g) || []).length; // 히라가나·가타카나 (일본어 고유)
  const zh = (sample.match(/[一-鿿]/g) || []).length; // CJK 한자 (중·일 공통)
  const en = (sample.match(/[a-zA-Z]/g) || []).length; // 라틴 알파벳

  // 가나(히라가나·가타카나)는 일본어 고유 — 일정량 보이면 무조건 일본어
  if (ja >= 10) return 'ja';

  // 그 외는 가장 많이 등장한 문자 종류가 승리
  const candidates: Array<[DetectedLang, number]> = [
    ['ko', ko],
    ['en', en],
    ['zh', zh],
  ];
  candidates.sort((a, b) => b[1] - a[1]);
  const [topLang, topCount] = candidates[0];
  if (topCount === 0) return 'ko'; // 콘텐츠 비어있음

  // 한자가 1등인데 가나가 조금이라도 있으면(5+) 일본어로 보정
  if (topLang === 'zh' && ja >= 5) return 'ja';
  return topLang;
}

async function getCategoryPosts(slug: string): Promise<BlogPost[]> {
  // 페이지네이션으로 모든 글 가져오기.
  // PAGE_SIZE를 100으로 작게 설정 — Supabase의 어떤 max-rows 설정(100/1000 등)에도 안전.
  // 한 페이지가 PAGE_SIZE(100)보다 적게 오면 마지막 페이지로 판단.
  const PAGE_SIZE = 100;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRows: any[] = [];
  const supabase = getSupabase();
  for (let page = 0; page < 500; page++) { // 최대 50,000개까지 안전 가드
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('category', slug)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) {
      console.error(`[blog-category] page ${page} 오류:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break; // 마지막 페이지
  }
  console.log(`[blog-category] ${slug} 카테고리 ${allRows.length}개 fetch 완료`);

  return allRows.map(row => {
    let meta: Record<string, unknown> = {};
    try { meta = JSON.parse(row.author || '{}'); } catch {}
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      summary: (meta.summary as string) || '',
      category: row.category || '',
      tag: (meta.tag as string) || '',
      hashtags: Array.isArray(row.tags) ? row.tags : [],
      metadata: (meta.metadata as Record<string, unknown>) || {},
      targetKeyword: (meta.targetKeyword as string) || '',
      historyId: (meta.historyId as string) || '',
      published: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

async function getCategoryMeta(slug: string): Promise<{ label: string; description: string; color: string }> {
  if (DEFAULT_CATEGORIES[slug]) return DEFAULT_CATEGORIES[slug];
  // 동적 카테고리: DB에서 존재 확인
  const { data } = await getSupabase()
    .from('blog_articles')
    .select('category')
    .eq('category', slug)
    .limit(1);
  if (!data || data.length === 0) return { label: slug, description: '', color: 'from-gray-500 to-gray-600' };
  const idx = Math.abs(slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % EXTRA_COLORS.length;
  return { label: slug, description: '', color: EXTRA_COLORS[idx] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const meta = await getCategoryMeta(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';
  const slugPath = `/blog/category/${rawSlug}`;
  const url = `${baseUrl}${slugPath}`;
  return {
    title: `${meta.label} — GEO-AIO 블로그`,
    description: meta.description || `${meta.label} 카테고리의 AI 최적화 콘텐츠`,
    openGraph: { title: `${meta.label} — GEO-AIO 블로그`, type: 'website', url, locale: 'ko_KR' },
    // hreflang: ?lang= 파라미터로 언어별 변형 노출 — Google·AI 검색이 사용자 언어에 맞는 변형 제공
    alternates: {
      canonical: url,
      languages: {
        'ko': url,
        'en': `${url}?lang=en`,
        'zh': `${url}?lang=zh`,
        'ja': `${url}?lang=ja`,
        'x-default': url,
      },
    },
  };
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const sp = await searchParams;
  // URL 인코딩된 한글 슬러그 디코딩 (예: %EB%9D%BC... → 라이프스타일)
  const slug = decodeURIComponent(rawSlug);
  const [allPosts, meta] = await Promise.all([getCategoryPosts(slug), getCategoryMeta(slug)]);

  // 각 포스트의 언어 결정:
  // 1순위 — metadata.lang (발행 시 박힌 명시적 언어 태그, 100% 정확)
  // 2순위 — 본문 자동 감지 (구 글 호환)
  const postsWithLang = allPosts.map(p => {
    const metaLang = (p.metadata as { lang?: string } | undefined)?.lang;
    const validLangs: DetectedLang[] = ['ko', 'en', 'zh', 'ja'];
    const detectedLang: DetectedLang = (metaLang && validLangs.includes(metaLang as DetectedLang))
      ? (metaLang as DetectedLang)
      : detectLanguage(`${p.title || ''}\n${(p.content || '').slice(0, 1500)}`);
    return { ...p, detectedLang };
  });
  const langCounts: Record<DetectedLang, number> = {
    ko: postsWithLang.filter(p => p.detectedLang === 'ko').length,
    en: postsWithLang.filter(p => p.detectedLang === 'en').length,
    zh: postsWithLang.filter(p => p.detectedLang === 'zh').length,
    ja: postsWithLang.filter(p => p.detectedLang === 'ja').length,
  };

  // URL ?lang= 파라미터로 필터. 없으면 가장 많은 언어 자동 선택
  const validLangs: DetectedLang[] = ['ko', 'en', 'zh', 'ja'];
  const requestedLang = sp.lang as DetectedLang | undefined;
  const activeLang: DetectedLang = (requestedLang && validLangs.includes(requestedLang))
    ? requestedLang
    : (Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0][0] as DetectedLang);
  const posts = postsWithLang.filter(p => p.detectedLang === activeLang);

  const LANG_LABELS: Record<DetectedLang, { label: string; flag: string }> = {
    ko: { label: '한국어', flag: '🇰🇷' },
    en: { label: 'English', flag: '🇺🇸' },
    zh: { label: '中文', flag: '🇨🇳' },
    ja: { label: '日本語', flag: '🇯🇵' },
  };

  // 동적 카테고리도 허용 — 포스트가 없으면 빈 페이지로 표시
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const TAG_COLORS: Record<string, string> = {
    '가이드':   'bg-blue-50 text-blue-700 border border-blue-200',
    '전략':     'bg-purple-50 text-purple-700 border border-purple-200',
    '비교분석': 'bg-rose-50 text-rose-700 border border-rose-200',
    '입문':     'bg-green-50 text-green-700 border border-green-200',
    '서비스':   'bg-emerald-50 text-emerald-700 border border-emerald-200',
    '소개':     'bg-amber-50 text-amber-700 border border-amber-200',
    '마케팅':   'bg-sky-50 text-sky-700 border border-sky-200',
    '분석':     'bg-indigo-50 text-indigo-700 border border-indigo-200',
    '팁':       'bg-orange-50 text-orange-700 border border-orange-200',
    '사례':     'bg-teal-50 text-teal-700 border border-teal-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-amber-50/40 relative">
      {/* 프리미엄 화이트 배경 — 미세 골드 도트 + 따뜻한 크림/바이올렛 블롭 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(180 83 9) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-100/40 rounded-full blur-[120px] pointer-events-none" />
      <Header />

      <main className="relative max-w-5xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5">
        {/* 뒤로가기 — 골드 캡슐 (화이트) */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-wider uppercase text-amber-700 hover:text-amber-900 mb-3 transition-all border border-amber-300 bg-white rounded-full hover:border-amber-500 hover:bg-amber-50 shadow-sm"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          전체 카테고리
        </Link>

        {/* 카테고리 헤더 — 프리미엄 화이트 카드 + 카테고리 색상 상단 리본 */}
        <section className="relative mb-4">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-amber-300/50 via-amber-400/25 to-amber-300/50 blur-[2px] opacity-70" />
          <div className="relative overflow-hidden rounded-xl bg-white border border-amber-200/70 px-4 sm:px-6 py-4 sm:py-5 shadow-xl shadow-amber-100/40">
            {/* 카테고리 색상 상단 리본 (식별색 유지) */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.color}`} />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 via-white to-violet-50/40 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(252,211,77,0.18),transparent_55%)] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="relative">
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-[9px] tracking-[0.25em] uppercase text-amber-700 font-semibold">Collection</p>
                <span className="text-[9px] text-slate-400">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-800">
                  <span className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                  {allPosts.length}
                </span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r ${meta.color}`} style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
                    {meta.label}
                  </h1>
                  {meta.description && (
                    <p className="text-slate-800 text-[11px] leading-snug max-w-xl mt-1 line-clamp-1">
                      {meta.description}
                    </p>
                  )}

                  {/* 대표·연락처·주소 — E-E-A-T·로컬 검색·AI 인용 신뢰 신호 */}
                  {CATEGORY_CONTACTS[slug] && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      {CATEGORY_CONTACTS[slug].representative && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-800 font-semibold">
                          <svg className="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-3.866 0-9 1.95-9 5.834V22h18v-2.166C21 15.95 15.866 14 12 14z" />
                          </svg>
                          {CATEGORY_CONTACTS[slug].representative}
                        </span>
                      )}
                      {CATEGORY_CONTACTS[slug].address && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-800 font-semibold">
                          <svg className="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2C7.589 2 4 5.589 4 9.995 4 16.394 11.111 21.78 11.398 22a1 1 0 001.205-.001C12.889 21.779 20 16.394 20 10c0-4.411-3.589-8-8-8zm0 12a4 4 0 110-8 4 4 0 010 8z" />
                          </svg>
                          {CATEGORY_CONTACTS[slug].address}
                        </span>
                      )}
                      {CATEGORY_CONTACTS[slug].phone && (
                        <a href={`tel:${CATEGORY_CONTACTS[slug].phone?.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-1 text-[11px] text-slate-800 font-semibold hover:text-amber-800 transition-colors">
                          <svg className="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.05 15.05 0 01-6.59-6.58l2.2-2.21c.27-.27.35-.65.24-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
                          </svg>
                          {CATEGORY_CONTACTS[slug].phone}
                        </a>
                      )}
                      {CATEGORY_CONTACTS[slug].email && (
                        <a href={`mailto:${CATEGORY_CONTACTS[slug].email}`} className="inline-flex items-center gap-1 text-[11px] text-slate-800 font-semibold hover:text-amber-800 transition-colors">
                          <svg className="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.236l-8 5.333-8-5.333V6l8 5.333L20 6v2.236z" />
                          </svg>
                          {CATEGORY_CONTACTS[slug].email}
                        </a>
                      )}
                      {CATEGORY_CONTACTS[slug].website && (
                        <a href={CATEGORY_CONTACTS[slug].website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold hover:text-amber-900 transition-colors">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          홈페이지
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {validLangs.map((lang) => {
                    const count = langCounts[lang];
                    const isActive = lang === activeLang;
                    return (
                      <span
                        key={lang}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] tracking-wide border transition-all ${
                          isActive
                            ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-[0_0_10px_-2px_rgba(245,158,11,0.4)]'
                            : count > 0
                            ? 'bg-white border-slate-200 text-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px]">{LANG_LABELS[lang].flag}</span>
                        {LANG_LABELS[lang].label}
                        <span className={isActive ? 'text-amber-700 font-semibold' : 'text-slate-800'}>{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 강조 문장 — 색인·인용 최적화 메시지 (공유 컴포넌트) */}
              <BlogHeroCallout />
            </div>
          </div>
        </section>

        {/* 언어 탭 — 프리미엄 화이트 세그먼트 (골드 글로우) — 가독성 최대화·볼드체 */}
        <div className="relative mb-4">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-300/40 via-amber-400/20 to-amber-300/40 blur-[2px] opacity-50" />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-md shadow-amber-100/30 p-1">
            <div className="grid grid-cols-4 gap-0.5">
              {validLangs.map(lang => {
                const isActive = lang === activeLang;
                const count = langCounts[lang];
                const isEmpty = count === 0;
                const href = `/blog/category/${rawSlug}${lang === 'ko' ? '' : `?lang=${lang}`}`;
                return (
                  <Link
                    key={lang}
                    href={isEmpty ? '#' : href}
                    className={`relative flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all duration-300 font-bold ${
                      isActive
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/40'
                        : isEmpty
                        ? 'text-slate-500 cursor-not-allowed pointer-events-none bg-slate-50'
                        : 'text-slate-900 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                    aria-disabled={isEmpty}
                  >
                    {isActive && (
                      <span className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                    )}
                    <span className="text-base leading-none">{LANG_LABELS[lang].flag}</span>
                    <span className="text-[12px] sm:text-[13px] tracking-wide font-bold">{LANG_LABELS[lang].label}</span>
                    <span className={`text-[11px] tracking-[0.05em] font-extrabold ${
                      isActive ? 'text-white' : isEmpty ? 'text-slate-500' : 'text-amber-800'
                    }`}>
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 포스트 목록 — 프리미엄 다크 글래스 카드 */}
        {posts.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <p className="text-[9px] tracking-[0.2em] uppercase text-amber-700 font-semibold">Articles</p>
              <p className="text-[10px] text-slate-800">
                <span className="text-amber-700 font-semibold">{posts.length}</span> of {allPosts.length}
              </p>
            </div>
            <div className="space-y-1.5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group relative bg-white rounded-lg border border-slate-200 hover:border-amber-300 transition-all duration-200 overflow-hidden hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.18)] hover:bg-amber-50/30"
                >
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <Link href={`/blog/${post.id}`} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {post.tag && (
                          <span className={`px-1.5 py-0 text-[9px] tracking-wider uppercase rounded-full ${TAG_COLORS[post.tag] || 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                            {post.tag}
                          </span>
                        )}
                        <span className="text-[10px] tracking-wide text-slate-800">
                          {formatDate(post.createdAt)}
                        </span>
                        {post.targetKeyword && (
                          <span className="text-[9px] tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0 rounded-full hidden sm:inline">
                            {post.targetKeyword}
                          </span>
                        )}
                      </div>
                      <h2
                        className="text-sm sm:text-[15px] font-semibold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug tracking-tight line-clamp-1"
                        style={{ fontFamily: 'ui-serif, Georgia, serif' }}
                      >
                        {post.title}
                      </h2>
                      {post.summary && (
                        <p className="text-[12px] text-slate-800 line-clamp-1 leading-snug mt-0.5">
                          {post.summary}
                        </p>
                      )}
                    </div>
                    <div
                      className={`shrink-0 w-7 h-7 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center text-white opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 shadow-sm ring-1 ring-amber-200/60`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 bg-amber-50/50 rounded-xl border border-dashed border-amber-300">
            <p className="text-xs text-slate-800 tracking-wider font-medium">No articles in this collection</p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 mt-3 text-[11px] font-semibold tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/30"
            >
              Create Content
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
