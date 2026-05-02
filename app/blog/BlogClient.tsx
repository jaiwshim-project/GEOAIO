'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';
import { deleteBlogPost, type BlogPost, type BlogCategory } from '@/lib/supabase-storage';
import BlogHeroCallout from '@/components/BlogHeroCallout';

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

// 콘텐츠 언어 자동 감지 — 카테고리 페이지와 동일 휴리스틱
type DetectedLang = 'ko' | 'en' | 'zh' | 'ja';
function detectLanguage(text: string): DetectedLang {
  if (!text) return 'ko';
  const sample = text.slice(0, 1500);
  const ko = (sample.match(/[가-힣]/g) || []).length;
  const ja = (sample.match(/[぀-ゟ゠-ヿ]/g) || []).length;
  const zh = (sample.match(/[一-鿿]/g) || []).length;
  const en = (sample.match(/[a-zA-Z]/g) || []).length;
  if (ja >= 5) return 'ja';
  const candidates: Array<[DetectedLang, number]> = [['ko', ko], ['en', en], ['zh', zh]];
  candidates.sort((a, b) => b[1] - a[1]);
  const [topLang, topCount] = candidates[0];
  if (topCount === 0) return 'ko';
  if (topLang === 'zh' && ja >= 2) return 'ja';
  return topLang;
}

const LANG_BADGE: Record<DetectedLang, { flag: string; label: string }> = {
  ko: { flag: '🇰🇷', label: '한국어' },
  en: { flag: '🇺🇸', label: 'English' },
  zh: { flag: '🇨🇳', label: '中文' },
  ja: { flag: '🇯🇵', label: '日本語' },
};

// 화이트 프리미엄 테마용 태그 컬러 — 라이트 배경 + 진한 텍스트 + 미세 보더
const TAG_COLORS: Record<string, string> = {
  '가이드':   'bg-blue-50 text-blue-700 border border-blue-200',
  '전략':     'bg-purple-50 text-purple-700 border border-purple-200',
  '비교분석': 'bg-rose-50 text-rose-700 border border-rose-200',
  '입문':     'bg-green-50 text-green-700 border border-green-200',
  '서비스':   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  '소개':     'bg-amber-50 text-amber-700 border border-amber-200',
  '마케팅':   'bg-sky-50 text-sky-700 border border-sky-200',
  '분석':     'bg-indigo-50 text-indigo-700 border border-indigo-200',
  '팁':       'bg-orange-50 text-orange-700 border border-orange-200',
  '사례':     'bg-teal-50 text-teal-700 border border-teal-200',
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

  // 언어별 카운트 — metadata.lang 우선(발행 시 박힌 명시 태그), 없으면 title 휴리스틱
  // 총 글 수 = ko + en + zh + ja 합산
  const langCounts = posts.reduce<Record<DetectedLang, number>>((acc, p) => {
    const explicit = (p.metadata as { lang?: string } | undefined)?.lang as DetectedLang | undefined;
    const validLangs: DetectedLang[] = ['ko', 'en', 'zh', 'ja'];
    const lang: DetectedLang = (explicit && validLangs.includes(explicit))
      ? explicit
      : detectLanguage(`${p.title || ''} ${p.summary || ''}`);
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, { ko: 0, en: 0, zh: 0, ja: 0 });
  const langTotal = langCounts.ko + langCounts.en + langCounts.zh + langCounts.ja;

  // 마운트 시 실시간 fetch — 페이지가 ISR(1시간 캐시)이라 새 글 발행 직후
  // 카운트가 갱신되지 않는 문제 해결. 초기 렌더는 ISR 캐시(빠름), 그 다음 5초 이내에
  // 최신 데이터로 덮어씌움. 카운트 + 리스트 모두 동기화.
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch('/api/blog/posts', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const fresh = (data.posts || []) as Array<{
          id: string; title: string; summary?: string; category: string;
          tag?: string; hashtags?: string[]; target_keyword?: string;
          published?: boolean; created_at: string; updated_at: string;
          author?: string | null;
        }>;
        // BlogPost 형태로 정규화 — author JSON에서 metadata 파싱 (lang 등 보존)
        const normalized: BlogPost[] = fresh.map(r => {
          let parsedMeta: Record<string, unknown> = {};
          if (r.author) {
            try {
              const m = JSON.parse(r.author);
              parsedMeta = (m?.metadata as Record<string, unknown>) || m || {};
            } catch {}
          }
          return {
            id: r.id,
            title: r.title,
            content: '',  // 리스트는 content 미필요 (카드 표시용 메타만)
            summary: r.summary || '',
            category: r.category || '',
            tag: r.tag || '',
            hashtags: Array.isArray(r.hashtags) ? r.hashtags : [],
            metadata: parsedMeta,
            targetKeyword: r.target_keyword || '',
            historyId: '',
            published: r.published ?? true,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        });
        // 기존 initialPosts와 병합 — 새 데이터가 있으면 교체, 없는 항목은 유지
        // (실시간 fetch가 실패한 항목 보존을 위해 두 set을 합집합으로)
        const map = new Map<string, BlogPost>();
        // 기존 우선 → 새 데이터로 덮어씌움
        initialPosts.forEach(p => map.set(p.id, p));
        normalized.forEach(p => map.set(p.id, p));
        setPosts(Array.from(map.values()).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch {
        // 무시 — 네트워크 실패 시 ISR 캐시 데이터로 그대로 사용
      }
    };
    refresh();
    return () => { cancelled = true; };
  }, [initialPosts]);

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
        .replace(/^### (.*$)/gm, '<h3 style="font-size:1em;font-weight:700;color:#1f2937;margin:20px 0 6px;padding-left:12px;border-left:3px solid #c7d2fe">$1</h3>')
        .replace(/^# (.*$)/gm, '<h1 style="font-size:1.3em;font-weight:800;color:#4f46e5;margin:24px 0 12px">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1e293b">$1</strong>')
        .replace(/^\- (.*$)/gm, '<li style="margin-left:20px;list-style:none;margin-bottom:4px;padding-left:8px;position:relative"><span style="position:absolute;left:-14px;color:#6366f1;font-weight:bold">&#8226;</span>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li style="margin-left:20px;list-style:decimal;margin-bottom:4px;color:#1f2937">$1</li>')
        .replace(/^> (.*$)/gm, '<blockquote style="border-left:4px solid #818cf8;padding:10px 16px;margin:12px 0;background:#eef2ff;border-radius:0 10px 10px 0;color:#1f2937;font-style:italic">$1</blockquote>');
      const trimmed = html.trim();
      if (/^<(h[1-6]|li|blockquote|div|table)/.test(trimmed)) return html;
      return `<p style="margin-bottom:0.8em;line-height:1.8;color:#1f2937">${html.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-amber-50/40 relative">
      {/* 프리미엄 화이트 배경 — 미세 골드 도트 + 따뜻한 크림/바이올렛 블롭 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(180 83 9) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-100/40 rounded-full blur-[120px] pointer-events-none" />

      <Header />

      <main className="relative max-w-5xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5">
        {/* 히어로 섹션 — 프리미엄 화이트 카드 */}
        <section className="relative mb-4">
          {/* 부드러운 골드 글로우 보더 */}
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-amber-300/50 via-amber-400/25 to-amber-300/50 blur-[2px] opacity-70" />
          <div className="relative overflow-hidden rounded-xl bg-white border border-amber-200/70 px-4 sm:px-6 py-4 sm:py-5 shadow-xl shadow-amber-100/40">
            {/* 미세 크림 그라디언트 + 좌상단 라이트 글로우 */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 via-white to-violet-50/40 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(252,211,77,0.18),transparent_55%)] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="relative">
              <p className="text-[9px] font-semibold tracking-[0.3em] uppercase text-amber-700 mb-1.5">GEO-AIO Press Room</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none text-slate-900" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
                블로그 · 기사 · 방송
              </h1>
              <p className="text-slate-700 text-[12px] sm:text-[13px] leading-snug mt-1.5 max-w-2xl">
                다양한 업종의 블로그·언론 기사·방송 콘텐츠를 한곳에서. AI 검색엔진에 최적화된 실제 운영 사례.
              </p>

              {/* 강조 문장 — 색인·인용 최적화 메시지 (공유 컴포넌트) */}
              <BlogHeroCallout />

              <div className="flex items-center flex-wrap gap-1.5 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold tracking-wider text-slate-900 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
                  TOTAL · {langTotal}
                </span>
                {/* 언어별 분해 — 한·영·중·일 합이 TOTAL과 동일 */}
                {(['ko', 'en', 'zh', 'ja'] as DetectedLang[]).map((lng) => (
                  langCounts[lng] > 0 && (
                    <span
                      key={lng}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold tracking-wide text-slate-900 shadow-sm"
                      title={`${LANG_BADGE[lng].label} ${langCounts[lng]}편`}
                    >
                      <span className="text-[12px] leading-none">{LANG_BADGE[lng].flag}</span>
                      {langCounts[lng]}
                    </span>
                  )
                ))}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold tracking-wider text-slate-900 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                  {categories.length} CATEGORIES
                </span>
                <button
                  onClick={() => router.push('/generate')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-full text-[10px] font-semibold tracking-wider transition-all shadow-md shadow-amber-500/30"
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

        {/* 탭 네비게이션 — 프리미엄 화이트 카드 */}
        <div className="relative mb-4">
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-300/40 via-amber-400/20 to-amber-300/40 blur-[2px] opacity-50" />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-md shadow-amber-100/30 p-1.5">
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => {
                const isActive = activeTab === cat.slug;
                const postCount = posts.filter(p => p.category === cat.slug).length;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => router.push(`/blog/category/${encodeURIComponent(cat.slug)}`)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${cat.color} text-white font-semibold shadow-md ring-1 ring-amber-300/60`
                        : 'bg-slate-50 text-slate-700 font-medium border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                    )}
                    <span className={isActive ? 'text-white' : 'text-amber-600'}>{ICON_MAP[cat.icon] || ICON_MAP.document}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                    {postCount > 0 && (
                      <span className={`ml-0.5 px-1.5 py-0 text-[9px] font-semibold rounded-full ${
                        isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
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
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
            {currentCategory?.label}
          </h2>
          {currentCategory?.description && (
            <p className="text-[11px] text-slate-700 mt-0.5">{currentCategory.description}</p>
          )}
        </div>

        {/* 포스트 상세 보기 */}
        {selectedPost && (
          <div className="mb-4">
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium tracking-wider uppercase text-amber-700 hover:text-amber-900 mb-3 transition-all border border-amber-300 bg-white rounded-full hover:border-amber-500 hover:bg-amber-50 shadow-sm"
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
                    <span className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full ${TAG_COLORS[selectedPost.tag] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      {selectedPost.tag}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{formatDate(selectedPost.createdAt)}</span>
                  {selectedPost.targetKeyword && (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{selectedPost.targetKeyword}</span>
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
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
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
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-amber-700">Articles</p>
              <p className="text-[10px] text-slate-700">
                <span className="text-amber-700 font-semibold">{filteredPosts.length}</span> of {posts.length}
              </p>
            </div>
            <div className="space-y-1.5">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group relative bg-white rounded-lg border border-slate-200 hover:border-amber-300 transition-all duration-200 overflow-hidden hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.18)] hover:bg-amber-50/30"
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <a
                        href={`/blog/${post.id}`}
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={(e) => { e.preventDefault(); router.push(`/blog/${post.id}`); }}
                      >
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {post.tag && (
                            <span className={`px-1.5 py-0 text-[9px] font-semibold tracking-wider uppercase rounded-full ${TAG_COLORS[post.tag] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                              {post.tag}
                            </span>
                          )}
                          <span className="text-[10px] tracking-wide text-slate-700">
                            {formatDate(post.createdAt)}
                          </span>
                          {post.targetKeyword && (
                            <span className="text-[9px] font-medium tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0 rounded-full hidden sm:inline">
                              {post.targetKeyword}
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-sm sm:text-[15px] font-semibold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug tracking-tight line-clamp-1"
                          style={{ fontFamily: 'ui-serif, Georgia, serif' }}
                        >
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="text-[12px] text-slate-700 line-clamp-1 leading-snug mt-0.5">
                            {post.summary}
                          </p>
                        )}
                      </a>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingId === post.id}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all rounded-md hover:bg-red-50"
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
                        <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${currentCategory?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 shadow-sm ring-1 ring-amber-200/60`}>
                          <span className="scale-[0.55]">{ICON_MAP[currentCategory?.icon || 'document']}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="text-center py-10 bg-amber-50/50 rounded-xl border border-dashed border-amber-300">
                  <svg className="w-10 h-10 mx-auto text-amber-500/70 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-xs text-slate-800 font-medium tracking-wider">이 카테고리에 포스트가 없습니다</p>
                  <p className="text-[11px] text-slate-700 mt-1 mb-3">콘텐츠를 생성한 후 블로그에 게시해보세요.</p>
                  <button
                    onClick={() => router.push('/generate')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/30"
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
