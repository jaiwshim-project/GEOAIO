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

// 다크 테마용 태그 컬러 (불투명도 ↑, 보더 추가)
const TAG_COLORS: Record<string, string> = {
  '가이드':   'bg-blue-500/25 text-blue-100 border border-blue-400/40',
  '전략':     'bg-purple-500/25 text-purple-100 border border-purple-400/40',
  '비교분석': 'bg-rose-500/25 text-rose-100 border border-rose-400/40',
  '입문':     'bg-green-500/25 text-green-100 border border-green-400/40',
  '서비스':   'bg-emerald-500/25 text-emerald-100 border border-emerald-400/40',
  '소개':     'bg-amber-500/25 text-amber-100 border border-amber-400/40',
  '마케팅':   'bg-sky-500/25 text-sky-100 border border-sky-400/40',
  '분석':     'bg-indigo-500/25 text-indigo-100 border border-indigo-400/40',
  '팁':       'bg-orange-500/25 text-orange-100 border border-orange-400/40',
  '사례':     'bg-teal-500/25 text-teal-100 border border-teal-400/40',
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] relative">
      {/* 프리미엄 다크 배경 — 골드 도트 + violet/amber blob 글로우 */}
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
        {/* 히어로 섹션 — 프리미엄 다크 카드 */}
        <section className="relative mb-4">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-amber-400/60 via-amber-500/30 to-amber-400/60 blur-[2px] opacity-80" />
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 text-white px-4 sm:px-6 py-4 sm:py-5 shadow-2xl shadow-black/40">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_55%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.15)_100%)] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <div className="relative">
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-amber-200 mb-1.5">GEO-AIO Press Room</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
                블로그 · 기사 · 방송
              </h1>
              <p className="text-white text-[12px] sm:text-[13px] leading-snug font-medium mt-1.5 max-w-2xl">
                다양한 업종의 블로그·언론 기사·방송 콘텐츠를 한곳에서. AI 검색엔진에 최적화된 실제 운영 사례.
              </p>
              <div className="flex items-center flex-wrap gap-1.5 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-[10px] font-bold tracking-wider text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)] animate-pulse" />
                  TOTAL · {posts.length}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-[10px] font-bold tracking-wider text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.7)] animate-pulse" />
                  {categories.length} CATEGORIES
                </span>
                <button
                  onClick={() => router.push('/generate')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full text-[10px] font-bold tracking-wider transition-all shadow-md shadow-amber-500/40"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  새 콘텐츠 생성
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 탭 네비게이션 — 프리미엄 다크 글래스 */}
        <div className="relative mb-4">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-400/40 via-amber-500/20 to-amber-400/40 blur-[2px] opacity-60" />
          <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-xl border border-amber-400/20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] p-1.5">
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => {
                const isActive = activeTab === cat.slug;
                const postCount = posts.filter(p => p.category === cat.slug).length;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => router.push(`/blog/category/${encodeURIComponent(cat.slug)}`)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-lg ring-1 ring-amber-400/40`
                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-amber-400/40 hover:text-amber-100'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                    )}
                    <span className={isActive ? 'text-white' : 'text-amber-200'}>{ICON_MAP[cat.icon] || ICON_MAP.document}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                    {postCount > 0 && (
                      <span className={`ml-0.5 px-1.5 py-0 text-[9px] font-bold rounded-full ${
                        isActive ? 'bg-amber-300/30 text-amber-100' : 'bg-amber-500/20 text-amber-200'
                      }`}>
                        {postCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 탭 설명 */}
        <div className="mb-3 px-1">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
            {currentCategory?.label}
          </h2>
          {currentCategory?.description && (
            <p className="text-[11px] text-slate-200 mt-0.5 font-medium">{currentCategory.description}</p>
          )}
        </div>

        {/* 포스트 상세 보기 */}
        {selectedPost && (
          <div className="mb-4">
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-amber-100 hover:text-white mb-3 transition-all border border-amber-400/40 bg-white/5 backdrop-blur-md rounded-full hover:border-amber-300 hover:bg-amber-500/15"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로 돌아가기
            </button>
            <article className="relative bg-white rounded-xl border border-amber-300/40 shadow-2xl overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${currentCategory?.color || 'from-gray-400 to-gray-500'}`} />
              <div className="p-5 sm:p-7">
                <div className="flex items-center gap-2 mb-4">
                  {selectedPost.tag && (
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${TAG_COLORS[selectedPost.tag] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      {selectedPost.tag}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 font-medium">{formatDate(selectedPost.createdAt)}</span>
                  {selectedPost.targetKeyword && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{selectedPost.targetKeyword}</span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>{selectedPost.title}</h1>
                <div
                  className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedPost.content) }}
                />
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    {selectedPost.hashtags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>
        )}

        {/* 포스트 목록 — 프리미엄 다크 글래스 카드 */}
        {!selectedPost && (
          <>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-amber-200">Articles</p>
              <p className="text-[10px] font-semibold text-white">
                <span className="text-amber-200 font-bold">{filteredPosts.length}</span> of {posts.length}
              </p>
            </div>
            <div className="space-y-1.5">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-md rounded-lg border border-amber-400/15 hover:border-amber-400/50 transition-all duration-200 overflow-hidden hover:shadow-[0_8px_28px_-8px_rgba(252,211,77,0.25)] hover:bg-gradient-to-br hover:from-slate-800/80 hover:to-slate-900/80"
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <a
                        href={`/blog/${post.id}`}
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={(e) => { e.preventDefault(); router.push(`/blog/${post.id}`); }}
                      >
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {post.tag && (
                            <span className={`px-1.5 py-0 text-[9px] font-bold tracking-wider uppercase rounded-full ${TAG_COLORS[post.tag] || 'bg-white/15 text-white border border-white/20'}`}>
                              {post.tag}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold tracking-wide text-slate-200">
                            {formatDate(post.createdAt)}
                          </span>
                          {post.targetKeyword && (
                            <span className="text-[9px] font-bold tracking-wide text-amber-200 bg-amber-500/20 border border-amber-400/50 px-1.5 py-0 rounded-full hidden sm:inline">
                              {post.targetKeyword}
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-sm sm:text-[15px] font-bold text-white group-hover:text-amber-100 transition-colors leading-snug tracking-tight line-clamp-1"
                          style={{ fontFamily: 'ui-serif, Georgia, serif' }}
                        >
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="text-[12px] text-slate-100 line-clamp-1 leading-snug font-medium mt-0.5">
                            {post.summary}
                          </p>
                        )}
                      </a>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingId === post.id}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-all rounded-md hover:bg-red-500/10"
                          title="삭제"
                        >
                          {deletingId === post.id ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                        <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${currentCategory?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 shadow-md ring-1 ring-amber-400/30`}>
                          <span className="scale-[0.55]">{ICON_MAP[currentCategory?.icon || 'document']}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-900/40 backdrop-blur-md rounded-xl border border-dashed border-amber-400/40">
                  <svg className="w-10 h-10 mx-auto text-amber-300/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-xs text-white font-semibold tracking-wider">이 카테고리에 포스트가 없습니다</p>
                  <p className="text-[11px] text-slate-300 mt-1 mb-3">콘텐츠를 생성한 후 블로그에 게시해보세요.</p>
                  <button
                    onClick={() => router.push('/generate')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-full hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/30"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    콘텐츠 생성
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />
    </div>
  );
}
