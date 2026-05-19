import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProposalClient from './ProposalClient';

export const metadata: Metadata = {
  title: '제안서 — GEO-AIO',
  description: '카테고리별 맞춤 자동화 콘텐츠 솔루션 제안서',
};

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES = [
  { slug: 'geo-aio', label: 'GEO-AIO', color: 'from-indigo-500 to-violet-600' },
  { slug: 'regenmed', label: '리젠메드컨설팅', color: 'from-emerald-500 to-teal-600' },
  { slug: 'brewery', label: '대전맥주장 수제맥주', color: 'from-amber-500 to-orange-600' },
  { slug: 'dental', label: '치과병원', color: 'from-sky-500 to-blue-600' },
  { slug: '로엘-법무법인', label: '로엘-법무법인', color: 'from-blue-500 to-indigo-600' },
];

const EXTRA_COLORS = [
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
  'from-orange-500 to-red-600',
];

async function getCategories() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase
      .from('blog_articles')
      .select('category, title')
      .order('created_at', { ascending: false });

    const categoryStats: Record<string, { count: number; sampleTitles: string[] }> = {};
    (data || []).forEach((row: { category: string; title: string }) => {
      const cat = row.category;
      if (!cat) return;
      if (!categoryStats[cat]) categoryStats[cat] = { count: 0, sampleTitles: [] };
      categoryStats[cat].count++;
      if (categoryStats[cat].sampleTitles.length < 3) {
        categoryStats[cat].sampleTitles.push(row.title);
      }
    });

    // DEFAULT_CATEGORIES는 항상 포함 (blog 글 여부 무관)
    const categories = DEFAULT_CATEGORIES.map(c => ({
      ...c,
      count: categoryStats[c.slug]?.count || 0,
      sampleTitles: categoryStats[c.slug]?.sampleTitles || [],
    }));

    // 추가 카테고리 (DEFAULT에 없는 것, 글이 있는 것만)
    let extraIdx = 0;
    Object.entries(categoryStats).forEach(([slug, stats]) => {
      if (!DEFAULT_CATEGORIES.find(c => c.slug === slug) && stats.count > 0) {
        categories.push({
          slug,
          label: slug,
          color: EXTRA_COLORS[extraIdx % EXTRA_COLORS.length],
          count: stats.count,
          sampleTitles: stats.sampleTitles,
        });
        extraIdx++;
      }
    });

    return categories;
  } catch {
    return DEFAULT_CATEGORIES.map(c => ({ ...c, count: 0, sampleTitles: [] }));
  }
}

export default async function ProposalPage() {
  const categories = await getCategories();
  console.log('[ProposalPage] categories:', JSON.stringify(categories, null, 2));
  return <ProposalClient categories={categories} />;
}
