import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { BlogPost } from '@/lib/supabase-storage';

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
  return {
    title: `${meta.label} — GEO-AIO 블로그`,
    description: meta.description || `${meta.label} 카테고리의 AI 최적화 콘텐츠`,
    openGraph: { title: `${meta.label} — GEO-AIO 블로그`, type: 'website' },
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
    '가이드': 'bg-blue-100 text-blue-700', '전략': 'bg-purple-100 text-purple-700',
    '비교분석': 'bg-rose-100 text-rose-700', '입문': 'bg-green-100 text-green-700',
    '서비스': 'bg-emerald-100 text-emerald-700', '소개': 'bg-amber-100 text-amber-700',
    '마케팅': 'bg-sky-100 text-sky-700', '분석': 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] relative">
      {/* 프리미엄 배경 — 다크 그라디언트 + 미세한 광택 + 골드 텍스처 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(252 211 77) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <Header />

      <main className="relative max-w-5xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5">
        {/* 뒤로가기 — 골드 캡슐 */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-wider uppercase text-amber-100 hover:text-white mb-3 transition-all border border-amber-400/40 bg-white/5 backdrop-blur-md rounded-full hover:border-amber-300 hover:bg-amber-500/15"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          전체 카테고리
        </Link>

        {/* 카테고리 헤더 — 프리미엄 다크 카드 (골드 보더 글로우) */}
        <section className="relative mb-4">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-amber-400/60 via-amber-500/30 to-amber-400/60 blur-[2px] opacity-80" />
          <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${meta.color} text-white px-4 sm:px-6 py-4 sm:py-5 shadow-2xl shadow-black/40`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_55%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.15)_100%)] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <div className="relative">
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-[9px] tracking-[0.25em] uppercase text-amber-200">Collection</p>
                <span className="text-[9px] text-white/70">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-white">
                  <span className="w-1 h-1 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]" />
                  {allPosts.length}
                </span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
                    {meta.label}
                  </h1>
                  {meta.description && (
                    <p className="text-white text-[11px] leading-snug max-w-xl mt-1 line-clamp-1">
                      {meta.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {validLangs.map((lang) => {
                    const count = langCounts[lang];
                    const isActive = lang === activeLang;
                    return (
                      <span
                        key={lang}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] tracking-wide border backdrop-blur-sm transition-all ${
                          isActive
                            ? 'bg-white/30 border-amber-300 text-white shadow-[0_0_12px_-2px_rgba(252,211,77,0.5)]'
                            : count > 0
                            ? 'bg-white/15 border-white/30 text-white'
                            : 'bg-white/5 border-white/15 text-white/70'
                        }`}
                      >
                        <span className="text-[10px]">{LANG_LABELS[lang].flag}</span>
                        {LANG_LABELS[lang].label}
                        <span className={isActive ? 'text-amber-200' : 'text-white'}>{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 언어 탭 — 프리미엄 다크 세그먼트 (골드 글로우) */}
        <div className="relative mb-4">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-400/40 via-amber-500/20 to-amber-400/40 blur-[2px] opacity-60" />
          <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-xl border border-amber-400/20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] p-1">
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
                    className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/50'
                        : isEmpty
                        ? 'text-slate-500 cursor-not-allowed pointer-events-none'
                        : 'text-white hover:bg-white/10 hover:text-amber-200'
                    }`}
                    aria-disabled={isEmpty}
                  >
                    {isActive && (
                      <span className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-px bg-gradient-to-r from-transparent via-amber-100 to-transparent" />
                    )}
                    <span className="text-sm leading-none">{LANG_LABELS[lang].flag}</span>
                    <span className="text-[11px] tracking-wide">{LANG_LABELS[lang].label}</span>
                    <span className={`text-[9px] tracking-[0.1em] ${
                      isActive ? 'text-slate-950' : isEmpty ? 'text-slate-500' : 'text-amber-200'
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
              <p className="text-[9px] tracking-[0.2em] uppercase text-amber-200">Articles</p>
              <p className="text-[10px] text-white">
                <span className="text-amber-200">{posts.length}</span> of {allPosts.length}
              </p>
            </div>
            <div className="space-y-1.5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-md rounded-lg border border-amber-400/15 hover:border-amber-400/50 transition-all duration-200 overflow-hidden hover:shadow-[0_8px_28px_-8px_rgba(252,211,77,0.25)] hover:bg-gradient-to-br hover:from-slate-800/80 hover:to-slate-900/80"
                >
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <Link href={`/blog/${post.id}`} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {post.tag && (
                          <span className={`px-1.5 py-0 text-[9px] tracking-wider uppercase rounded-full ${TAG_COLORS[post.tag] || 'bg-white/15 text-white border border-white/20'}`}>
                            {post.tag}
                          </span>
                        )}
                        <span className="text-[10px] tracking-wide text-slate-300">
                          {formatDate(post.createdAt)}
                        </span>
                        {post.targetKeyword && (
                          <span className="text-[9px] tracking-wide text-amber-200 bg-amber-500/20 border border-amber-400/50 px-1.5 py-0 rounded-full hidden sm:inline">
                            {post.targetKeyword}
                          </span>
                        )}
                      </div>
                      <h2
                        className="text-sm sm:text-[15px] text-white group-hover:text-amber-100 transition-colors leading-snug tracking-tight line-clamp-1"
                        style={{ fontFamily: 'ui-serif, Georgia, serif' }}
                      >
                        {post.title}
                      </h2>
                      {post.summary && (
                        <p className="text-[12px] text-slate-200 line-clamp-1 leading-snug mt-0.5">
                          {post.summary}
                        </p>
                      )}
                    </div>
                    <div
                      className={`shrink-0 w-7 h-7 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center text-white opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 shadow-md ring-1 ring-amber-400/30`}
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
          <div className="text-center py-10 bg-slate-900/40 backdrop-blur-md rounded-xl border border-dashed border-amber-400/40">
            <p className="text-xs text-white tracking-wider">No articles in this collection</p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 mt-3 text-[11px] font-semibold tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-full hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/30"
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
