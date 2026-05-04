'use client';

// 백링크 실행 로드맵 — 카테고리 선택 → 10주 자동 일정 + AI 본문 생성
// Tistory와 LinkedIn 채널을 매주 번갈아 발행

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CategoryItem { slug: string; count: number }

interface RoadmapPost {
  postNo: number;
  weekNum: number;
  channel: 'Tistory' | 'LinkedIn';
  date: string;
  weekday: string;
  title: string;
  body: string;
  tags: string[];
  categoryLink: string;
}

interface RoadmapResponse {
  categorySlug: string;
  categoryLabel: string;
  totalWeeks: number;
  totalPosts: number;
  posts: RoadmapPost[];
  generatedAt: string;
}

export default function BacklinkPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [filter, setFilter] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // 내일부터
    return d.toISOString().slice(0, 10);
  });
  const [weeks, setWeeks] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPost, setCopiedPost] = useState<number | null>(null);

  // 생성된 로드맵을 슬러그별로 누적 저장 (localStorage 영구) + 탭 전환
  const STORAGE_KEY = 'geoaio_backlink_roadmaps';
  const [savedRoadmaps, setSavedRoadmaps] = useState<Record<string, RoadmapResponse>>({});
  const [activeSlug, setActiveSlug] = useState<string>('');

  // 마운트 시 카테고리 목록 + 저장된 로드맵 로드
  useEffect(() => {
    fetch('/api/backlink', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => setCategories([]));

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: Record<string, RoadmapResponse> = JSON.parse(raw);
          setSavedRoadmaps(parsed);
          const slugs = Object.keys(parsed);
          if (slugs.length > 0) setActiveSlug(slugs[slugs.length - 1]);
        }
      } catch {}
    }
  }, []);

  // 저장된 로드맵 변경 시 localStorage 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoadmaps)); } catch {}
  }, [savedRoadmaps]);

  const visibleCategories = filter
    ? categories.filter(c => c.slug.toLowerCase().includes(filter.toLowerCase()))
    : categories;

  // 현재 활성 탭의 로드맵
  const roadmap: RoadmapResponse | null = activeSlug ? (savedRoadmaps[activeSlug] || null) : null;
  const savedSlugs = Object.keys(savedRoadmaps);

  const handleGenerate = async () => {
    if (!selectedSlug) { setError('카테고리를 선택하세요'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/backlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorySlug: selectedSlug, startDate, weeks }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '생성 실패'); return; }
      // 슬러그별 누적 저장 (같은 슬러그 재생성 시 덮어씀)
      setSavedRoadmaps(prev => ({ ...prev, [data.categorySlug]: data }));
      setActiveSlug(data.categorySlug);
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = (slug: string) => {
    if (!confirm(`"${slug}" 로드맵을 삭제하시겠습니까?`)) return;
    setSavedRoadmaps(prev => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    if (activeSlug === slug) {
      const remaining = Object.keys(savedRoadmaps).filter(s => s !== slug);
      setActiveSlug(remaining[remaining.length - 1] || '');
    }
  };

  const handleClearAll = () => {
    if (!confirm('모든 로드맵을 삭제하시겠습니까?')) return;
    setSavedRoadmaps({});
    setActiveSlug('');
  };

  const handleCopy = async (post: RoadmapPost) => {
    const text = post.channel === 'Tistory'
      ? `[제목] ${post.title}\n\n[태그] ${post.tags.join(', ')}\n\n[본문]\n${post.body}`
      : `${post.title}\n\n${post.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPost(post.postNo);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch {
      alert('복사 실패 — 직접 선택 후 Ctrl+C');
    }
  };

  const handlePrint = () => {
    const prev = document.title;
    document.title = `백링크_로드맵_${roadmap?.categorySlug}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    setTimeout(() => { document.title = prev; }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          header, footer, nav, .print-hide { display: none !important; }
          main { padding: 0 !important; max-width: none !important; }
          section, .post-card { page-break-inside: avoid; break-inside: avoid; }
          h1, h2, h3, h4 { page-break-after: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-8 sm:py-12 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[11px] font-bold tracking-[0.2em] text-amber-300 mb-3">
              🔗 BACKLINK ROADMAP
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">
              <span className="block">10주 백링크 실행 로드맵 자동 생성</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-200/95 leading-relaxed max-w-3xl">
              카테고리 1개를 선택하면 <strong className="text-amber-300">Tistory + LinkedIn에 매주 2개씩 총 20개 포스트</strong>를
              자동 작성합니다. 각 포스트는 카테고리 페이지로 백링크를 향하는 자연스러운 보조 콘텐츠입니다.
            </p>
          </div>
        </section>

        {/* 입력 폼 */}
        <section className="print-hide bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-6 mb-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-4">📁 카테고리 선택</h2>

          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="카테고리명으로 검색…"
            className="w-full mb-3 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />

          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 mb-4">
            {visibleCategories.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                {categories.length === 0 ? '카테고리 로딩 중…' : '검색 결과 없음'}
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {visibleCategories.map(c => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(c.slug)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                        selectedSlug === c.slug
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-white hover:bg-amber-50 text-slate-800'
                      }`}
                    >
                      <span className="truncate flex-1">{c.slug}</span>
                      <span className="ml-2 text-[11px] text-slate-500 shrink-0">{c.count}편</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">진행 주 수 (기본 10주)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={weeks}
                onChange={e => setWeeks(parseInt(e.target.value, 10) || 10)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {selectedSlug && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-slate-800">
              ✅ 선택된 카테고리: <strong className="text-amber-800">{selectedSlug}</strong> · 매주 화(LinkedIn) + 목(Tistory) = <strong>총 {weeks * 2}개 포스트</strong>
            </div>
          )}

          {error && (
            <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              ❌ {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !selectedSlug}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold rounded-xl hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 transition-colors shadow-lg shadow-orange-300/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI 생성 중… (약 30~90초)
              </>
            ) : (
              <>🔗 10주 백링크 로드맵 생성</>
            )}
          </button>
        </section>

        {/* 저장된 로드맵 탭 — 항상 표시, 비어있으면 안내 */}
        <section className="print-hide bg-white rounded-2xl shadow-md border-2 border-amber-300 ring-2 ring-amber-200/60 p-4 mb-6">
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">
              📂 저장된 로드맵 {savedSlugs.length > 0 && `(${savedSlugs.length}개)`}
            </h2>
            {savedSlugs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-bold"
              >
                🗑 전체 삭제
              </button>
            )}
          </div>
          {savedSlugs.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
              <p className="text-sm text-slate-700 font-bold mb-1">아직 생성된 로드맵이 없습니다</p>
              <p className="text-xs text-slate-500">위에서 카테고리를 선택하고 <strong className="text-amber-700">🔗 10주 백링크 로드맵 생성</strong> 버튼을 클릭하세요.</p>
              <p className="text-[10px] text-slate-400 mt-1">생성 후 이 영역에 카테고리별 탭이 추가됩니다.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {savedSlugs.map(slug => {
                  const r = savedRoadmaps[slug];
                  const isActive = activeSlug === slug;
                  return (
                    <div key={slug} className="relative group">
                      <button
                        type="button"
                        onClick={() => setActiveSlug(slug)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors border-2 ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-md ring-2 ring-amber-300/60'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        <span className="text-base leading-none">{isActive ? '📌' : '📁'}</span>
                        <span className="truncate max-w-[200px]" title={slug}>{slug}</span>
                        <span className={`text-[10px] ${isActive ? 'text-amber-100' : 'text-slate-500'}`}>
                          {r.totalPosts}개
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); handleDeleteRoadmap(slug); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDeleteRoadmap(slug); } }}
                          className={`ml-1 text-[10px] font-extrabold ${isActive ? 'text-amber-100 hover:text-white' : 'text-slate-400 hover:text-rose-600'} cursor-pointer`}
                          title="이 로드맵 삭제"
                        >
                          ✕
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                💡 카테고리별 백링크 로드맵이 누적 저장됩니다. 같은 슬러그 재생성 시 덮어씀, 새 슬러그는 추가.
              </p>
            </>
          )}
        </section>

        {/* 로드맵 결과 */}
        {roadmap && (
          <section className="space-y-5">
            <div className="flex items-baseline justify-between flex-wrap gap-2 print-hide">
              <h2 className="text-lg font-extrabold text-slate-900">
                📋 {roadmap.categorySlug} — {roadmap.totalWeeks}주 / {roadmap.totalPosts}개 포스트
              </h2>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                PDF 다운로드
              </button>
            </div>

            {/* 주별 그룹화 */}
            {Array.from({ length: roadmap.totalWeeks }, (_, i) => i + 1).map(weekNum => {
              const weekPosts = roadmap.posts.filter(p => p.weekNum === weekNum);
              if (weekPosts.length === 0) return null;
              return (
                <div key={weekNum} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-extrabold text-slate-700 tracking-wide mb-3 pb-2 border-b border-slate-200">
                    Week {weekNum}
                  </h3>
                  <div className="space-y-4">
                    {weekPosts.map(post => (
                      <article
                        key={post.postNo}
                        className={`post-card relative bg-gradient-to-br ${
                          post.channel === 'Tistory'
                            ? 'from-orange-50 to-amber-50 border-orange-200'
                            : 'from-blue-50 to-indigo-50 border-blue-200'
                        } border-2 rounded-xl p-4 shadow-sm`}
                      >
                        <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                              post.channel === 'Tistory'
                                ? 'bg-orange-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}>
                              {post.channel === 'Tistory' ? '📝 Tistory' : '💼 LinkedIn'}
                            </span>
                            <span className="text-xs text-slate-700 font-bold">Post {post.postNo} · {post.date}({post.weekday})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(post)}
                            className={`print-hide text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                              copiedPost === post.postNo
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {copiedPost === post.postNo ? '✓ 복사됨' : '📋 복사'}
                          </button>
                        </div>

                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mb-2 leading-snug">
                          {post.title}
                        </h4>

                        <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-3">
                          {post.body}
                        </div>

                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {post.tags.map((tag, i) => (
                              <span key={i} className="text-[10px] text-orange-800 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <a
                          href={post.categoryLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-bold hover:underline"
                        >
                          🔗 {post.categoryLink}
                        </a>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
