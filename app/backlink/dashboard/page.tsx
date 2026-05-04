'use client';

// 백링크 발행 대시보드
// localStorage(geoaio_backlink_roadmaps)에 저장된 모든 카테고리 로드맵의 포스트를
// 일자별로 통합 정렬해서 "오늘 / 내일 / 이번 주 / 다음 주" 카드로 표시.
// 사용자가 매일 어떤 카테고리·채널에 어떤 글을 발행해야 하는지 한눈에 보여준다.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface RoadmapPost {
  postNo: number;
  weekNum: number;
  channel: 'Tistory' | 'LinkedIn';
  date: string;
  weekday: string;
  role?: string;
  intent?: string;
  signals?: string;
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

interface DashboardPost extends RoadmapPost {
  categorySlug: string;
}

const STORAGE_KEY = 'geoaio_backlink_roadmaps';

// 로컬 날짜 기준 YYYY-MM-DD (toISOString은 UTC라 한국 시간대에서 전날이 나옴 — 사용 금지)
function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayISO() {
  return localISO(new Date());
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return localISO(d);
}

function getEndOfWeek(iso: string) {
  // 일요일을 그 주의 마지막 날로 정의
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  const offsetToSunday = (7 - day) % 7;
  d.setDate(d.getDate() + offsetToSunday);
  return localISO(d);
}

function dateLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

const COPIED_STORAGE_KEY = 'geoaio_backlink_copied_posts';

export default function BacklinkDashboardPage() {
  const [roadmaps, setRoadmaps] = useState<Record<string, RoadmapResponse>>({});
  const [loaded, setLoaded] = useState(false);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [showPast, setShowPast] = useState(true);
  const [showFuture, setShowFuture] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, RoadmapResponse> = JSON.parse(raw);
        // 마이그레이션: 옛 docx 원본의 잘못된 카테고리 URL(.../category/geo-aio)을 각 로드맵의 정확한 categoryLink로 교체
        let mutated = false;
        Object.values(parsed).forEach(roadmap => {
          const correctLink = roadmap.posts?.[0]?.categoryLink;
          if (!correctLink) return;
          roadmap.posts?.forEach(post => {
            if (post.body && /https?:\/\/www\.geo-aio\.com\/blog\/category\/geo-aio/.test(post.body)) {
              post.body = post.body.replace(/https?:\/\/www\.geo-aio\.com\/blog\/category\/geo-aio/g, correctLink);
              mutated = true;
            }
          });
        });
        if (mutated) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch {}
        }
        setRoadmaps(parsed);
      }
    } catch {}
    try {
      const rawC = localStorage.getItem(COPIED_STORAGE_KEY);
      if (rawC) setCopiedIds(new Set(JSON.parse(rawC) as string[]));
    } catch {}
    setLoaded(true);
  }, []);

  // 모든 로드맵의 포스트를 평탄화하고 categorySlug 부착
  const allPosts: DashboardPost[] = useMemo(() => {
    const flat: DashboardPost[] = [];
    Object.values(roadmaps).forEach(r => {
      (r.posts || []).forEach(p => {
        flat.push({ ...p, categorySlug: r.categorySlug });
      });
    });
    flat.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      // 같은 날: Tistory 먼저(아침), LinkedIn 나중
      if (a.channel !== b.channel) return a.channel === 'Tistory' ? -1 : 1;
      return a.categorySlug.localeCompare(b.categorySlug);
    });
    return flat;
  }, [roadmaps]);

  // 카테고리별 포스트 수 (디버그·요약용 — /backlink 저장 탭과 일치 여부 확인 가능)
  const countsByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    allPosts.forEach(p => { m[p.categorySlug] = (m[p.categorySlug] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [allPosts]);

  // 버킷 분류 (오늘 / 내일 / 이번 주 / 다음 주 / 이후 / 지난)
  const buckets: { today: DashboardPost[]; tomorrow: DashboardPost[]; thisWeek: DashboardPost[]; nextWeek: DashboardPost[]; future: DashboardPost[]; past: DashboardPost[] } = useMemo(() => {
    const today = todayISO();
    const tomorrow = addDays(today, 1);
    const thisWeekEnd = getEndOfWeek(today);
    const nextWeekStart = addDays(thisWeekEnd, 1);
    const nextWeekEnd = addDays(thisWeekEnd, 7);
    const r = { today: [] as DashboardPost[], tomorrow: [] as DashboardPost[], thisWeek: [] as DashboardPost[], nextWeek: [] as DashboardPost[], future: [] as DashboardPost[], past: [] as DashboardPost[] };
    allPosts.forEach(p => {
      if (p.date < today) r.past.push(p);
      else if (p.date === today) r.today.push(p);
      else if (p.date === tomorrow) r.tomorrow.push(p);
      else if (p.date <= thisWeekEnd) r.thisWeek.push(p);
      else if (p.date >= nextWeekStart && p.date <= nextWeekEnd) r.nextWeek.push(p);
      else r.future.push(p);
    });
    return r;
  }, [allPosts]);

  const stats = {
    roadmaps: Object.keys(roadmaps).length,
    posts: allPosts.length,
    today: buckets.today.length,
    thisWeek: buckets.today.length + buckets.tomorrow.length + buckets.thisWeek.length,
    past: buckets.past.length,
  };

  const handleCopy = async (post: DashboardPost) => {
    const id = `${post.categorySlug}-${post.postNo}`;
    if (copiedIds.has(id)) return; // 이미 복사된 항목은 무시 (버튼 disabled)
    const text = post.channel === 'Tistory'
      ? `[제목] ${post.title}\n\n[태그] ${post.tags.join(', ')}\n\n[본문]\n${post.body}`
      : `${post.title}\n\n${post.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIds(prev => {
        const next = new Set(prev);
        next.add(id);
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(COPIED_STORAGE_KEY, JSON.stringify(Array.from(next))); } catch {}
        }
        return next;
      });
    } catch {
      alert('복사 실패 — 원본 페이지에서 복사해 주세요');
    }
  };

  const resetCopied = () => {
    if (!confirm(`복사 기록 ${copiedIds.size}개를 모두 초기화하시겠습니까? 모든 카드가 다시 활성화됩니다.`)) return;
    setCopiedIds(new Set());
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(COPIED_STORAGE_KEY); } catch {}
    }
  };

  // 카테고리 통째로 삭제 — 해당 슬러그의 로드맵+모든 포스트가 일정에서 사라짐
  const handleDeleteCategory = (slug: string) => {
    const r = roadmaps[slug];
    const total = r?.totalPosts ?? r?.posts?.length ?? 0;
    if (!confirm(`"${slug}" 카테고리를 삭제하시겠습니까?\n관련 ${total}개 포스트가 모든 일정 섹션(오늘/내일/이번 주/...)에서 사라집니다. 되돌릴 수 없습니다.`)) return;
    setRoadmaps(prev => {
      const next = { ...prev };
      delete next[slug];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  };

  const renderCard = (post: DashboardPost) => {
    const id = `${post.categorySlug}-${post.postNo}`;
    const isCopied = copiedIds.has(id);
    return (
      <article
        key={id}
        className={`relative bg-gradient-to-br ${
          isCopied
            ? 'from-slate-50 to-slate-100 border-slate-300 opacity-70'
            : post.channel === 'Tistory'
              ? 'from-orange-50 to-amber-50 border-orange-200'
              : 'from-blue-50 to-indigo-50 border-blue-200'
        } border rounded-lg p-2.5 shadow-sm flex flex-col`}
      >
        <div className="flex items-start justify-between mb-1.5 gap-1">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            <span className={`text-base font-extrabold tracking-wide px-3 py-1 rounded-md ${
              post.channel === 'Tistory' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
            }`}>
              {post.channel === 'Tistory' ? '📝 Tistory' : '💼 LinkedIn'}
            </span>
            {post.role && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                post.role.startsWith('Pillar')
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : post.role.startsWith('Spoke')
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : post.role === 'Summary'
                      ? 'bg-violet-100 text-violet-800 border-violet-300'
                      : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}>
                {post.role}
              </span>
            )}
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 truncate max-w-[110px]" title={post.categorySlug}>
              📁{post.categorySlug}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(post)}
            disabled={isCopied}
            className={`shrink-0 text-lg font-bold px-3 py-1.5 rounded-md transition-colors ${
              isCopied
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title={isCopied ? '이미 복사됨' : '복사'}
          >
            {isCopied ? '✓' : '📋'}
          </button>
        </div>

        <div className="text-[9px] text-slate-500 font-semibold mb-1">
          P{post.postNo} · {post.date}({post.weekday})
        </div>

        <h4 className={`text-xs font-extrabold mb-1 leading-snug line-clamp-2 ${
          isCopied
            ? 'text-slate-500 line-through decoration-red-500 decoration-2'
            : 'text-slate-900'
        }`}>
          {post.title}
        </h4>

        {/* 스크롤 본문 — 카드 높이 고정 */}
        <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap mb-1.5 max-h-[100px] overflow-y-auto pr-1 [scrollbar-width:thin]">
          {post.body}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mb-1.5">
            {post.tags.map((tag, i) => (
              <span key={i} className="text-[8px] text-orange-800 bg-orange-100 border border-orange-200 px-1 py-0 rounded-full font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <a
          href={post.categoryLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-[9px] text-indigo-700 font-bold hover:underline truncate mt-auto"
          title={post.categoryLink}
        >
          🔗<span className="truncate">{post.categoryLink.replace(/^https?:\/\//, '')}</span>
        </a>
      </article>
    );
  };

  const renderDateGroup = (posts: DashboardPost[], dateGroupBy: boolean) => {
    if (!dateGroupBy) {
      // 한 줄 3장 (lg) / 2장 (sm) / 1장 (mobile)
      return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">{posts.map(renderCard)}</div>;
    }
    // 일자별로 그룹 + 그룹 안 3-col 그리드
    const grouped: Record<string, DashboardPost[]> = {};
    posts.forEach(p => { if (!grouped[p.date]) grouped[p.date] = []; grouped[p.date].push(p); });
    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, ps]) => (
          <div key={date}>
            <h4 className="text-xs font-extrabold text-slate-600 mb-1.5 pb-1 border-b border-slate-200">
              📅 {dateLabel(date)} <span className="text-slate-400 font-semibold">· {ps.length}개</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">{ps.map(renderCard)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white px-6 sm:px-10 py-8 sm:py-10 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[11px] font-bold tracking-[0.2em] text-emerald-300 mb-3">
              📊 BACKLINK DASHBOARD
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">
              <span className="block">백링크 발행 대시보드 — 오늘 무엇을 올려야 하나요?</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-200/95 leading-relaxed max-w-3xl">
              저장된 모든 카테고리 로드맵을 모아 <strong className="text-emerald-300">날짜별로 정렬</strong>합니다.
              매일 아침 이 페이지를 열어 오늘 발행할 Tistory·LinkedIn 포스트를 카테고리·역할별로 한눈에 확인하고, 클릭 한 번으로 복사·발행하세요.
            </p>
            <div className="mt-4">
              <Link href="/backlink" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-colors">
                ← 백링크 로드맵 생성으로
              </Link>
            </div>
          </div>
        </section>

        {/* 통계 */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: '저장 카테고리', val: stats.roadmaps, color: 'from-violet-500 to-purple-500' },
            { label: '전체 포스트', val: stats.posts, color: 'from-amber-500 to-orange-500' },
            { label: '오늘 발행', val: stats.today, color: 'from-rose-500 to-pink-500' },
            { label: '이번 주 발행', val: stats.thisWeek, color: 'from-emerald-500 to-teal-500' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 bg-gradient-to-br ${s.color} text-white shadow-md`}>
              <div className="text-[11px] font-bold opacity-90 tracking-wider uppercase">{s.label}</div>
              <div className="text-3xl font-extrabold mt-1">{s.val}</div>
            </div>
          ))}
        </section>

        {/* 카테고리별 포스트 수 — /backlink 저장 탭과 1:1 일치 검증용 */}
        {countsByCategory.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
            <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
              <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">📂 카테고리별 포스트 수 (총 {stats.posts}개)</h3>
              {copiedIds.size > 0 && (
                <button
                  type="button"
                  onClick={resetCopied}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline"
                  title="복사한 카드의 빨간 줄·비활성화 상태를 모두 풀기"
                >
                  ↺ 복사 기록 초기화 ({copiedIds.size}개)
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {countsByCategory.map(([slug, count]) => (
                <span key={slug} className="inline-flex items-center gap-1.5 text-xs font-bold pl-2.5 pr-1 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  <span className="truncate max-w-[180px]" title={slug}>{slug}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px]">{count}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(slug)}
                    title={`${slug} 카테고리의 ${count}개 포스트 모두 삭제`}
                    className="ml-0.5 w-5 h-5 inline-flex items-center justify-center rounded-full text-rose-600 hover:text-white hover:bg-rose-500 transition-colors text-[11px] font-extrabold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              💡 /backlink 페이지의 저장 탭에 표시된 카테고리·포스트 수와 동일하게 일치해야 합니다. 다르면 새 로고침 또는 시크릿 창 사용 (브라우저 다른 점 확인).
            </p>
          </section>
        )}

        {!loaded ? (
          <div className="text-center py-20 text-slate-500 text-sm">로딩 중…</div>
        ) : stats.posts === 0 ? (
          <section className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-base font-extrabold text-slate-800 mb-1">저장된 백링크 로드맵이 없습니다</h2>
            <p className="text-sm text-slate-600 mb-4">
              먼저 <Link href="/backlink" className="text-emerald-600 font-bold underline">/backlink</Link>에서 카테고리를 선택해 로드맵을 생성하세요.
            </p>
          </section>
        ) : (
          <>
            {/* 오늘 (가장 강조) */}
            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                🔥 오늘 발행 <span className="text-sm font-bold text-rose-600">{buckets.today.length}개</span>
              </h2>
              {buckets.today.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
                  오늘은 발행 예정 포스트가 없습니다. 다음 발행일은 <strong className="text-slate-800">
                    {(buckets.tomorrow[0] || buckets.thisWeek[0] || buckets.nextWeek[0] || buckets.future[0])?.date || '-'}
                  </strong>입니다.
                </div>
              ) : (
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border-2 border-rose-300 ring-2 ring-rose-200/60 p-5 shadow-md">
                  {renderDateGroup(buckets.today, false)}
                </div>
              )}
            </section>

            {/* 내일 */}
            {buckets.tomorrow.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  ☀️ 내일 발행 <span className="text-sm font-bold text-amber-600">{buckets.tomorrow.length}개</span>
                </h2>
                <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5">
                  {renderDateGroup(buckets.tomorrow, false)}
                </div>
              </section>
            )}

            {/* 이번 주 */}
            {buckets.thisWeek.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  📅 이번 주 (모레~일요일) <span className="text-sm font-bold text-emerald-600">{buckets.thisWeek.length}개</span>
                </h2>
                <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-5">
                  {renderDateGroup(buckets.thisWeek, true)}
                </div>
              </section>
            )}

            {/* 다음 주 */}
            {buckets.nextWeek.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  📆 다음 주 <span className="text-sm font-bold text-sky-600">{buckets.nextWeek.length}개</span>
                </h2>
                <div className="bg-sky-50 rounded-2xl border-2 border-sky-200 p-5">
                  {renderDateGroup(buckets.nextWeek, true)}
                </div>
              </section>
            )}

            {/* 이후 (접기 가능) */}
            {buckets.future.length > 0 && (
              <section className="mb-8">
                <button
                  type="button"
                  onClick={() => setShowFuture(!showFuture)}
                  className="text-base sm:text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2 hover:text-violet-700"
                >
                  {showFuture ? '🔽' : '▶️'} 이후 일정 <span className="text-sm font-bold text-violet-600">{buckets.future.length}개</span>
                </button>
                {showFuture && (
                  <div className="bg-violet-50 rounded-2xl border-2 border-violet-200 p-5">
                    {renderDateGroup(buckets.future, true)}
                  </div>
                )}
              </section>
            )}

            {/* 지난 일정 (접기 가능, 흐림 효과) */}
            {buckets.past.length > 0 && (
              <section className="mb-8">
                <button
                  type="button"
                  onClick={() => setShowPast(!showPast)}
                  className="text-base sm:text-lg font-extrabold text-slate-500 mb-3 flex items-center gap-2 hover:text-slate-700"
                >
                  {showPast ? '🔽' : '▶️'} 지난 일정 (이미 지난 발행 예정일) <span className="text-sm font-bold text-slate-400">{buckets.past.length}개</span>
                </button>
                {showPast && (
                  <div className="bg-slate-100 rounded-2xl border-2 border-slate-200 p-5 opacity-75">
                    {renderDateGroup(buckets.past, true)}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
