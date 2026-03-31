'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';
import { deleteBlogPost, type BlogPost, type BlogCategory } from '@/lib/supabase-storage';

const ICON_MAP: Record<string, React.ReactNode> = {
  search: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  building: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  badge: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  heart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const TAG_COLORS: Record<string, string> = {
  '가이드': 'bg-blue-100 text-blue-700',
  '전략': 'bg-purple-100 text-purple-700',
  '비교분석': 'bg-rose-100 text-rose-700',
  '입문': 'bg-green-100 text-green-700',
  '서비스': 'bg-emerald-100 text-emerald-700',
  '소개': 'bg-amber-100 text-amber-700',
  '마케팅': 'bg-sky-100 text-sky-700',
  '분석': 'bg-indigo-100 text-indigo-700',
  '팁': 'bg-orange-100 text-orange-700',
  '사례': 'bg-teal-100 text-teal-700',
};

interface BlogClientProps {
  initialPosts: BlogPost[];
  initialCategories: BlogCategory[];
}

export default function BlogClient({ initialPosts, initialCategories }: BlogClientProps) {
  const router = useRouter();
  const [categories] = useState<BlogCategory[]>(initialCategories);
  const [activeTab, setActiveTab] = useState(initialCategories[0]?.slug || 'geo-aio');
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showTesterModal, setShowTesterModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentCategory = categories.find((c) => c.slug === activeTab) || categories[0];
  const filteredPosts = posts.filter((p) => p.category === activeTab);

  const handleDeletePost = async (id: string) => {
    if (!confirm('이 포스트를 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      await deleteBlogPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const markdownToHtml = (text: string) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 히어로 섹션 */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-8 mb-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTR2LTJoNHptMC0xMHYyaC00di0yaDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">블로그 / 기사 / 방송</h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              GEO-AIO가 실제 운영하는 다양한 업종의 블로그, 언론 기사, 방송 콘텐츠를 한곳에서 확인하세요.
            </p>
            <p className="text-white/70 text-xs sm:text-sm mt-2 leading-relaxed">
              AI 검색 최적화(GEO) 전략부터 의료기기 컨설팅, 수제맥주, 치과병원까지 — 각 업종별로 AI 검색엔진에 최적화된 콘텐츠가 어떻게 작성되고 활용되는지 실제 사례를 통해 확인할 수 있습니다.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                총 {posts.length}개 포스트
              </span>
              <button
                onClick={() => router.push('/generate')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                새 콘텐츠 생성
              </button>
            </div>
          </div>
        </section>

        {/* 탭 네비게이션 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const isActive = activeTab === cat.slug;
            const postCount = posts.filter(p => p.category === cat.slug).length;
            return (
              <button
                key={cat.slug}
                onClick={() => { setActiveTab(cat.slug); setSelectedPost(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400'}>{ICON_MAP[cat.icon] || ICON_MAP.document}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                {postCount > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {postCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 탭 설명 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{currentCategory?.label}</h2>
          <p className="text-sm text-gray-500 mt-1">{currentCategory?.description}</p>
        </div>

        {/* 포스트 상세 보기 */}
        {selectedPost && (
          <div className="mb-6">
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로 돌아가기
            </button>
            <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${currentCategory?.color || 'from-gray-400 to-gray-500'}`} />
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  {selectedPost.tag && (
                    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${TAG_COLORS[selectedPost.tag] || 'bg-gray-100 text-gray-600'}`}>
                      {selectedPost.tag}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(selectedPost.createdAt)}</span>
                  {selectedPost.targetKeyword && (
                    <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{selectedPost.targetKeyword}</span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{selectedPost.title}</h1>
                <div
                  className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedPost.content) }}
                />
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    {selectedPost.hashtags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>
        )}

        {/* 포스트 목록 */}
        {!selectedPost && (
          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
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
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1.5">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{post.summary}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletingId === post.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                        title="삭제"
                      >
                        {deletingId === post.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentCategory?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white opacity-60 group-hover:opacity-100 transition-opacity`}>
                        {ICON_MAP[currentCategory?.icon || 'document']}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-sm text-gray-400 font-medium">이 카테고리에 포스트가 없습니다</p>
                <p className="text-xs text-gray-300 mt-1 mb-4">콘텐츠를 생성한 후 블로그에 게시해보세요.</p>
                <button
                  onClick={() => router.push('/generate')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  콘텐츠 생성하러 가기
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />
    </div>
  );
}
