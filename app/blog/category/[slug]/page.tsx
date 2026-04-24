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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getCategoryPosts(slug: string): Promise<BlogPost[]> {
  const { data } = await getSupabase()
    .from('blog_articles')
    .select('*')
    .eq('category', slug)
    .order('created_at', { ascending: false })
    .limit(100);

  return (data || []).map(row => {
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

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  // URL 인코딩된 한글 슬러그 디코딩 (예: %EB%9D%BC... → 라이프스타일)
  const slug = decodeURIComponent(rawSlug);
  const [posts, meta] = await Promise.all([getCategoryPosts(slug), getCategoryMeta(slug)]);

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
        <section className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${meta.color} text-white px-6 sm:px-10 py-8 mb-8`}>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{meta.label}</h1>
            {meta.description && <p className="text-white/90 text-sm leading-relaxed">{meta.description}</p>}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium mt-4">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
              {posts.length}개 포스트
            </span>
          </div>
        </section>

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
