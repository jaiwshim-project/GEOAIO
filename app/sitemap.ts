import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/introduction`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/community`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/manual`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 블로그 개별 글 URL 동적 추가
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: posts } = await supabase
      .from('blog_articles')
      .select('id, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10000);

    if (posts) {
      for (const post of posts) {
        staticPages.push({
          url: `${siteUrl}/blog/${post.id}`,
          lastModified: new Date(post.updated_at || post.created_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {
    // Supabase 접속 실패 시 정적 페이지만 반환
  }

  return staticPages;
}
