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

// 콘텐츠 언어 자동 감지 (제목 + 본문 앞부분 샘플 기준)
type DetectedLang = 'ko' | 'en' | 'zh' | 'ja';
function detectLanguage(text: string): DetectedLang {
  if (!text) return 'ko';
  const sample = text.slice(0, 1500);
  const counts = {
    ko: (sample.match(/[가-힣]/g) || []).length, // 한글
    ja: (sample.match(/[぀-ゟ゠-ヿ]/g) || []).length, // 히라가나·가타카나 (일본어 고유)
    zh: (sample.match(/[一-鿿]/g) || []).length, // CJK 한자 (중국어/일본어 공통)
    en: (sample.match(/[a-zA-Z]/g) || []).length, // 라틴
  };
  // 1순위: 가나가 5+ 보이면 일본어 (한자가 섞여 있어도)
  if (counts.ja >= 5) return 'ja';
  // 2순위: 한글 10+ 면 한국어
  if (counts.ko >= 10) return 'ko';
  // 3순위: 한자 10+ 인데 가나 없으면 중국어
  if (counts.zh >= 10) return 'zh';
  // 4순위: 라틴 위주면 영어
  if (counts.en >= 20) return 'en';
  // 기본: 한국어
  return 'ko';
}

async function getCategoryPosts(slug: string): Promise<BlogPost[]> {
  // 페이지네이션으로 모든 글 가져오기 — Supabase max-rows 한도 우회.
  // 한 번에 1000개씩, 최대 50페이지(=50,000개)까지 안전 가드.
  const PAGE_SIZE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRows: any[] = [];
  const supabase = getSupabase();
  for (let page = 0; page < 50; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('category', slug)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) break;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break; // 마지막 페이지
  }

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

  // 각 포스트의 언어 자동 감지 (제목 + 본문 앞부분 샘플)
  const postsWithLang = allPosts.map(p => ({
    ...p,
    detectedLang: detectLanguage(`${p.title || ''}\n${(p.content || '').slice(0, 1500)}`),
  }));
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          전체 카테고리로
        </Link>

        {/* 카테고리 헤더 */}
        <section className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${meta.color} text-white px-6 sm:px-10 py-8 mb-6`}>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{meta.label}</h1>
            {meta.description && <p className="text-white/90 text-sm leading-relaxed">{meta.description}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                전체 {allPosts.length}개
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/25 rounded-full text-xs font-medium">
                {LANG_LABELS[activeLang].flag} {LANG_LABELS[activeLang].label} {posts.length}개
              </span>
            </div>
          </div>
        </section>

        {/* 언어 탭 — 자동 감지된 언어별 포스트 분류 */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {validLangs.map(lang => {
              const isActive = lang === activeLang;
              const count = langCounts[lang];
              const isEmpty = count === 0;
              const href = `/blog/category/${rawSlug}${lang === 'ko' ? '' : `?lang=${lang}`}`;
              return (
                <Link
                  key={lang}
                  href={isEmpty ? '#' : href}
                  className={`flex flex-col items-center justify-center gap-0.5 py-3 px-2 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      : isEmpty
                      ? 'text-gray-300 cursor-not-allowed pointer-events-none'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-disabled={isEmpty}
                >
                  <span className="text-base">{LANG_LABELS[lang].flag}</span>
                  <span className="text-xs font-semibold">{LANG_LABELS[lang].label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-emerald-100' : isEmpty ? 'text-gray-300' : 'text-gray-400'}`}>
                    {count}개
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 포스트 목록 */}
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group">
                <Link href={`/blog/${post.id}`} className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {post.tag && (
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${TAG_COLORS[post.tag] || 'bg-gray-100 text-gray-600'}`}>
                          {post.tag}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                      {post.targetKeyword && (
                        <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full hidden sm:inline">{post.targetKeyword}</span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1.5">{post.title}</h2>
                    <p className="text-sm text-gray-500 line-clamp-2">{post.summary}</p>
                  </div>
                  <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-white opacity-60 group-hover:opacity-100 transition-opacity`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-400 font-medium">이 카테고리에 포스트가 없습니다</p>
            <Link href="/generate" className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all">
              콘텐츠 생성하러 가기
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
