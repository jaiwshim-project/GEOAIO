import { Metadata } from 'next';
import { createClient as createServerClient } from '@supabase/supabase-js';
import BlogClient from './BlogClient';
import type { BlogPost, BlogCategory } from '@/lib/supabase-storage';

export const metadata: Metadata = {
  title: 'GEO-AIO 블로그 — AI 검색 최적화 콘텐츠',
  description: 'AI 검색 최적화(GEO) 전략, 의료기기 컨설팅, 수제맥주, 치과병원 등 다양한 업종의 AI 최적화 콘텐츠를 확인하세요.',
  openGraph: {
    title: 'GEO-AIO 블로그 — AI 검색 최적화 콘텐츠',
    description: 'AI 검색 최적화(GEO) 전략부터 다양한 업종별 실제 사례까지',
    type: 'website',
  },
};

// SEO/AI 색인 친화 — ISR 1시간 갱신.
// 페이지네이션 도입으로 fallback 사이즈를 안전 범위(~수백 KB)로 유지 → FALLBACK_BODY_TOO_LARGE 방지.
// 글 1만, 10만건이 되어도 영향 없음 (페이지당 LIMIT만 fetch).
// 카테고리별 정확한 카운트는 /api/blog/category-counts에서 BlogClient가 별도 fetch.
export const revalidate = 3600;

const POSTS_PER_PAGE = 20; // 메인 페이지 1번에 보여주는 글 수 (사용자 요구)

const DEFAULT_CATEGORIES: BlogCategory[] = [
  { id: '1', slug: 'geo-aio', label: 'GEO-AIO', description: 'AI 검색 최적화 관련 콘텐츠', color: 'from-indigo-500 to-violet-600', icon: 'search', sortOrder: 0 },
  { id: '2', slug: 'regenmed', label: '리젠메드컨설팅', description: '컨설팅 관련 콘텐츠', color: 'from-emerald-500 to-teal-600', icon: 'building', sortOrder: 1 },
  { id: '3', slug: 'brewery', label: '대전맥주장 수제맥주', description: '수제맥주 관련 콘텐츠', color: 'from-amber-500 to-orange-600', icon: 'badge', sortOrder: 2 },
  { id: '4', slug: 'dental', label: '치과병원', description: '치과 관련 콘텐츠', color: 'from-sky-500 to-blue-600', icon: 'heart', sortOrder: 3 },
];

const EXTRA_COLORS = [
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
  'from-orange-500 to-red-600',
];

const EXTRA_ICONS = ['document', 'document', 'document', 'document', 'document'];

async function getServerBlogData(pageNum: number) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // 페이지네이션: pageNum(1-base)에 해당하는 N건만 fetch.
    const safePage = Math.max(1, pageNum);
    const from = (safePage - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    // 모든 distinct 카테고리 슬러그 가져오기 — 1000행 cap 우회 위해 페이지네이션
    const fetchAllCategorySlugs = async (): Promise<string[]> => {
      const PAGE_SIZE = 1000;
      const set = new Set<string>();
      for (let p = 0; p < 50; p++) {
        const fromP = p * PAGE_SIZE;
        const toP = fromP + PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from('blog_articles')
          .select('category')
          .order('created_at', { ascending: false })
          .range(fromP, toP);
        if (error || !data || data.length === 0) break;
        for (const r of data) {
          if (r.category) set.add(r.category);
        }
        if (data.length < PAGE_SIZE) break;
      }
      return Array.from(set);
    };

    // posts(현재 페이지) + total + 모든 distinct 카테고리 슬러그를 병렬 fetch
    const [{ data: postsData, error: pErr }, { count: totalCount }, allCategorySlugs] = await Promise.all([
      supabase
        .from('blog_articles')
        .select('id, title, category, tags, author, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(from, to),
      supabase.from('blog_articles').select('*', { count: 'exact', head: true }),
      fetchAllCategorySlugs(),
    ]);
    if (pErr) {
      console.error('[blog] page', safePage, '에러:', pErr.message);
    }
    const rows = postsData || [];

    const posts: BlogPost[] = rows.map(row => {
      let meta: Record<string, unknown> = {};
      if (row.author) {
        try { meta = JSON.parse(row.author); } catch { /* ignore */ }
      }
      return {
        id: row.id,
        title: row.title,
        content: '', // 목록 페이지 — 본문은 /blog/[id]에서만 fetch
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

    // 모든 distinct 카테고리(현재 페이지 포함 안 된 것까지)로 그리드 구성
    const categories = [...DEFAULT_CATEGORIES];
    let extraIdx = 0;
    for (const slug of allCategorySlugs) {
      if (!categories.find(c => c.slug === slug)) {
        categories.push({
          id: `custom-${extraIdx}`,
          slug,
          label: slug,
          description: '',
          color: EXTRA_COLORS[extraIdx % EXTRA_COLORS.length],
          icon: EXTRA_ICONS[extraIdx % EXTRA_ICONS.length],
          sortOrder: DEFAULT_CATEGORIES.length + extraIdx,
        });
        extraIdx++;
      }
    }
    // 카테고리 카드 가나다·알파벳 순 정렬 (한글 우선, 영문 뒤)
    categories.sort((a, b) => a.label.localeCompare(b.label, 'ko-KR', { sensitivity: 'base' }));

    return {
      posts,
      categories,
      total: totalCount || posts.length,
      page: safePage,
      totalPages: Math.max(1, Math.ceil((totalCount || posts.length) / POSTS_PER_PAGE)),
    };
  } catch {
    return { posts: [], categories: DEFAULT_CATEGORIES, total: 0, page: 1, totalPages: 1 };
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const pageNum = parseInt(sp.page || '1', 10) || 1;
  const { posts, categories, total, page, totalPages } = await getServerBlogData(pageNum);

  return <BlogClient initialPosts={posts} initialCategories={categories} page={page} totalPages={totalPages} total={total} />;
}
