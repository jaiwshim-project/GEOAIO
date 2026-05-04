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

// SEO/AI 색인 친화: ISR로 1시간마다 갱신 (force-dynamic은 no-store 헤더로 색인 거부됨)
export const revalidate = 3600;

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

async function getServerBlogData() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Supabase max-rows 1000 cap을 우회하기 위한 페이지네이션 (전체 글 정확히 수집).
    const PAGE_SIZE = 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postsData: any[] = [];
    for (let page = 0; page < 50; page++) { // 최대 50,000건 안전 가드
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      // ISR fallback 사이즈 폭증 방지 — content 본문은 목록에서 안 씀.
      // content 포함 시 1,291건 × ~15KB = ~19MB로 Vercel 한도(FALLBACK_BODY_TOO_LARGE) 초과.
      // 목록 카드에 필요한 메타 필드만 선택.
      const { data, error } = await supabase
        .from('blog_articles')
        .select('id, title, category, tags, author, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) {
        console.error('[blog] page', page, '에러:', error.message);
        break;
      }
      if (!data || data.length === 0) break;
      postsData.push(...data);
      if (data.length < PAGE_SIZE) break;
    }

    const posts: BlogPost[] = postsData.map(row => {
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

    // Build categories from DB
    const dbCategorySlugs = [...new Set(posts.map(p => p.category).filter(Boolean))];
    const categories = [...DEFAULT_CATEGORIES];
    let extraIdx = 0;
    for (const slug of dbCategorySlugs) {
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

    return { posts, categories };
  } catch {
    return { posts: [], categories: DEFAULT_CATEGORIES };
  }
}

export default async function BlogPage() {
  const { posts, categories } = await getServerBlogData();

  return <BlogClient initialPosts={posts} initialCategories={categories} />;
}
