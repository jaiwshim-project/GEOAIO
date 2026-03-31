import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
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
    const supabase = await createClient();

    const { data: postsData } = await supabase
      .from('blog_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const posts: BlogPost[] = (postsData || []).map(row => {
      let meta: Record<string, unknown> = {};
      if (row.author) {
        try { meta = JSON.parse(row.author); } catch { /* ignore */ }
      }
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

    return { posts, categories };
  } catch {
    return { posts: [], categories: DEFAULT_CATEGORIES };
  }
}

export default async function BlogPage() {
  const { posts, categories } = await getServerBlogData();

  return <BlogClient initialPosts={posts} initialCategories={categories} />;
}
