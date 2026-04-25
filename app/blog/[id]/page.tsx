import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

interface BlogRow {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[] | null;
  author: string | null;
  created_at: string;
  updated_at: string;
}

function parseMeta(author: string | null) {
  if (!author) return { summary: '', tag: '', targetKeyword: '', historyId: '', metadata: {} };
  try { return JSON.parse(author); } catch { return { summary: '', tag: '', targetKeyword: '' }; }
}

async function getPost(id: string): Promise<BlogRow | null> {
  const { data } = await getSupabase()
    .from('blog_articles')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

// 동적 메타데이터
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: '글을 찾을 수 없습니다' };

  const meta = parseMeta(post.author);
  const summary = (meta.summary as string) || post.content.replace(/[#*>\-|`\n]/g, ' ').trim().slice(0, 160);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';

  return {
    title: `${post.title} — GEO-AIO 블로그`,
    description: summary,
    keywords: [
      ...(Array.isArray(post.tags) ? post.tags.map((t: string) => t.replace('#', '')) : []),
      meta.targetKeyword || '',
      'GEO', 'AIO', 'AI 검색 최적화',
    ].filter(Boolean),
    openGraph: {
      title: post.title,
      description: summary,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      url: `${siteUrl}/blog/${post.id}`,
      siteName: 'GEO-AIO',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: summary,
    },
    alternates: {
      canonical: `${siteUrl}/blog/${post.id}`,
    },
  };
}

// 마크다운 → HTML 변환
function markdownToHtml(text: string) {
  let h2Index = 0;
  const sectionColors = [
    { bg: '#eef2ff', border: '#818cf8', accent: '#4f46e5' },
    { bg: '#ecfdf5', border: '#6ee7b7', accent: '#059669' },
    { bg: '#fef3c7', border: '#fbbf24', accent: '#d97706' },
    { bg: '#fce7f3', border: '#f9a8d4', accent: '#db2777' },
    { bg: '#e0e7ff', border: '#a5b4fc', accent: '#4338ca' },
    { bg: '#f0fdf4', border: '#86efac', accent: '#16a34a' },
  ];
  return text.split(/\n\n+/).map(para => {
    let html = para;
    html = html.replace(/^## (.*$)/gm, (_m, title) => {
      const c = sectionColors[h2Index % sectionColors.length];
      h2Index++;
      return `<div style="margin:28px 0 12px;padding:10px 16px;background:${c.bg};border-left:4px solid ${c.border};border-radius:0 10px 10px 0"><h2 style="font-size:1.1em;font-weight:700;color:${c.accent};margin:0">${title}</h2></div>`;
    });
    html = html
      .replace(/^### (.*$)/gm, '<h3 style="font-size:1em;font-weight:700;color:#374151;margin:20px 0 6px;padding-left:12px;border-left:3px solid #c7d2fe">$1</h3>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size:1.3em;font-weight:800;color:#4f46e5;margin:24px 0 12px">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1e293b">$1</strong>')
      .replace(/^\- (.*$)/gm, '<li style="margin-left:20px;list-style:none;margin-bottom:4px;padding-left:8px;position:relative"><span style="position:absolute;left:-14px;color:#6366f1;font-weight:bold">&#8226;</span>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li style="margin-left:20px;list-style:decimal;margin-bottom:4px;color:#374151">$1</li>')
      .replace(/^> (.*$)/gm, '<blockquote style="border-left:4px solid #818cf8;padding:10px 16px;margin:12px 0;background:#eef2ff;border-radius:0 10px 10px 0;color:#374151;font-style:italic">$1</blockquote>');
    const trimmed = html.trim();
    if (/^<(h[1-6]|li|blockquote|div|table)/.test(trimmed)) return html;
    return `<p style="margin-bottom:0.8em;line-height:1.8;color:#374151">${html.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const meta = parseMeta(post.author);
  const hashtags: string[] = Array.isArray(post.tags) ? post.tags : [];
  const summary = (meta.summary as string) || '';
  const tag = (meta.tag as string) || '';
  const targetKeyword = (meta.targetKeyword as string) || '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // ⭐ AI 검색 인용률을 높이기 위한 풍부한 JSON-LD 구조화 데이터

  // FAQ 자동 추출 (Q: ~ / A: ~ 패턴)
  const extractFaq = (content: string) => {
    const faqs: { '@type': 'Question'; name: string; acceptedAnswer: { '@type': 'Answer'; text: string } }[] = [];
    const faqPattern = /(?:^|\n)\s*\*?\*?Q[\s:]?\s*([^\n*]+?)\*?\*?\s*\n\s*\*?\*?A[\s:]?\s*([^\n*][\s\S]*?)(?=\n\s*\*?\*?Q[\s:]|\n##|\n#|$)/gi;
    let match;
    while ((match = faqPattern.exec(content)) !== null) {
      const q = match[1].trim().replace(/[?:]$/, '').trim();
      const a = match[2].trim().replace(/^[*]+|[*]+$/g, '').trim();
      if (q && a && q.length < 200 && a.length < 1000) {
        faqs.push({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        });
      }
    }
    return faqs;
  };

  // HowTo 단계 추출 (번호 리스트)
  const extractSteps = (content: string) => {
    const steps: { '@type': 'HowToStep'; position: number; name: string }[] = [];
    const stepPattern = /^(\d+)\.\s+([^\n]+)/gm;
    let match;
    while ((match = stepPattern.exec(content)) !== null && steps.length < 12) {
      const text = match[2].trim().replace(/\*\*/g, '');
      if (text.length > 5 && text.length < 200) {
        steps.push({
          '@type': 'HowToStep',
          position: parseInt(match[1]),
          name: text,
        });
      }
    }
    return steps;
  };

  const faqEntities = extractFaq(post.content);
  const stepEntities = extractSteps(post.content);

  // Article (메인)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: summary || post.content.replace(/[#*>\-|`\n]/g, ' ').trim().slice(0, 160),
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: 'GEO-AIO',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GEO-AIO',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/logo-geoaio.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.id}`,
    },
    keywords: hashtags.map((t: string) => t.replace('#', '')).join(', '),
    articleSection: post.category,
    inLanguage: 'ko-KR',
    wordCount: post.content.length,
  };

  // FAQPage (AI Overview·Perplexity가 우선 인용)
  const faqSchema = faqEntities.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntities,
  } : null;

  // HowTo (How-to 카테고리이거나 번호 단계 3개 이상)
  const howtoSchema = stepEntities.length >= 3 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: summary,
    step: stepEntities,
  } : null;

  // BreadcrumbList (탐색 컨텍스트)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '블로그', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 2, name: post.category || '전체', item: `${siteUrl}/blog/category/${encodeURIComponent(post.category)}` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/blog/${post.id}` },
    ],
  };

  // 모든 스키마를 배열로 묶음 (구글이 권장하는 방식)
  const jsonLd = [articleSchema, breadcrumbSchema, faqSchema, howtoSchema].filter(Boolean);

  const contentHtml = markdownToHtml(post.content);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          블로그 목록
        </Link>

        <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-600" />
          <div className="p-6 sm:p-8">
            {/* 메타 정보 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-100 text-indigo-700">
                {post.category}
              </span>
              {tag && (
                <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-700">
                  {tag}
                </span>
              )}
              <time className="text-xs text-gray-400" dateTime={post.created_at}>
                {formatDate(post.created_at)}
              </time>
              {targetKeyword && (
                <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {targetKeyword}
                </span>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* 요약 */}
            {summary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
              </div>
            )}

            {/* 본문 */}
            <div
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* 해시태그 */}
            {hashtags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {hashtags.map((ht: string, i: number) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                    {ht.startsWith('#') ? ht : `#${ht}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
