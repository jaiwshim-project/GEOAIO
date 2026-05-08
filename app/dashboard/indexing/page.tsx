'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { INDEXING_SITES, IndexingSiteConfig } from '@/lib/indexing-sites';

const COLOR_OPTIONS: { value: IndexingSiteConfig['color']; label: string; card: string; badge: string }[] = [
  { value: 'emerald', label: '에메랄드', card: 'from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400', badge: 'bg-emerald-500' },
  { value: 'indigo',  label: '인디고',   card: 'from-indigo-50 to-violet-50 border-indigo-200 hover:border-indigo-400', badge: 'bg-indigo-500' },
  { value: 'violet',  label: '바이올렛', card: 'from-violet-50 to-purple-50 border-violet-200 hover:border-violet-400', badge: 'bg-violet-500' },
  { value: 'rose',    label: '로즈',     card: 'from-rose-50 to-pink-50 border-rose-200 hover:border-rose-400', badge: 'bg-rose-500' },
  { value: 'amber',   label: '앰버',     card: 'from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400', badge: 'bg-amber-500' },
  { value: 'cyan',    label: '시안',     card: 'from-cyan-50 to-sky-50 border-cyan-200 hover:border-cyan-400', badge: 'bg-cyan-500' },
];

function colorStyles(color: string) {
  return COLOR_OPTIONS.find(c => c.value === color) || COLOR_OPTIONS[1];
}

interface CustomSiteRow {
  id: string;
  label: string;
  domain: string;
  description: string;
  site_url: string;
  sitemap_url: string;
  category_map: Record<string, string[]> | null;
  color: IndexingSiteConfig['color'];
  emoji: string;
}

const EMPTY_FORM = {
  label: '',
  domain: '',
  description: '',
  site_url: '',
  sitemap_url: '',
  emoji: '🌐',
  color: 'cyan' as IndexingSiteConfig['color'],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
}

export default function IndexingSitesPage() {
  const [customSites, setCustomSites] = useState<CustomSiteRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  async function loadCustomSites() {
    try {
      const res = await fetch('/api/indexing/sites');
      const j = await res.json();
      if (j.ok) setCustomSites(j.sites);
    } catch { /* Supabase 미구성 시 무시 */ }
  }

  useEffect(() => { loadCustomSites(); }, []);
  useEffect(() => { if (showModal) setTimeout(() => firstInputRef.current?.focus(), 50); }, [showModal]);

  const computedId = slugify(form.domain || form.label);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.label || !form.domain || !form.site_url || !form.sitemap_url) {
      setError('사이트 이름, 도메인, GSC URL, 사이트맵 URL은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/indexing/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: computedId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || '저장 실패');
      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadCustomSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/indexing/sites?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteConfirm(null);
      await loadCustomSites();
    }
  }

  const allSites: (IndexingSiteConfig | CustomSiteRow)[] = [
    ...INDEXING_SITES,
    ...customSites.filter(cs => !INDEXING_SITES.find(s => s.id === cs.id)),
  ];

  function toConfig(s: IndexingSiteConfig | CustomSiteRow): IndexingSiteConfig {
    if ('siteUrl' in s) return s;
    return {
      id: s.id,
      label: s.label,
      domain: s.domain,
      description: s.description,
      siteUrl: s.site_url,
      sitemapUrl: s.sitemap_url,
      categoryMap: s.category_map || undefined,
      color: s.color,
      emoji: s.emoji,
    };
  }

  const isCustom = (id: string) => customSites.some(cs => cs.id === id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 색인 모니터링 — 사이트 선택</h1>
            <p className="text-sm text-gray-500 mt-1">
              모니터링할 사이트를 선택하세요. Google Search Console과 연결되어 색인 추이·미색인 사유·카테고리별 색인율을 시각화합니다.
            </p>
          </div>
          <button
            onClick={() => { setShowModal(true); setError(null); setForm(EMPTY_FORM); }}
            className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            사이트 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allSites.map(raw => {
            const site = toConfig(raw);
            const c = colorStyles(site.color);
            return (
              <div key={site.id} className="relative group">
                <Link
                  href={`/dashboard/indexing/${site.id}`}
                  className={`block bg-gradient-to-br ${c.card} rounded-xl border-2 p-5 transition-colors hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${c.badge} text-white flex items-center justify-center text-2xl shrink-0`}>
                      {site.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">{site.label}</span>
                        {isCustom(site.id) && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">추가됨</span>
                        )}
                      </div>
                      <code className="text-xs text-gray-500 break-all">{site.domain}</code>
                      <p className="text-xs text-gray-700 mt-2 leading-relaxed">{site.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                {isCustom(site.id) && (
                  <button
                    onClick={() => setDeleteConfirm(site.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all text-xs"
                    title="삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {/* 빈 추가 카드 */}
          <button
            onClick={() => { setShowModal(true); setError(null); setForm(EMPTY_FORM); }}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 p-8 text-gray-400 hover:text-indigo-600 transition-colors min-h-[110px]"
          >
            <span className="text-3xl">＋</span>
            <span className="text-sm font-medium">새 사이트 추가</span>
          </button>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          <p className="font-semibold mb-1">💡 정적 사이트 추가 방법</p>
          <p className="text-xs leading-relaxed">
            <code className="bg-amber-100 px-1.5 py-0.5 rounded">lib/indexing-sites.ts</code>의 <code className="bg-amber-100 px-1.5 py-0.5 rounded">INDEXING_SITES</code> 배열에 항목을 추가하거나, 위 <strong>사이트 추가</strong> 버튼으로 DB에 동적 등록할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <p className="text-base font-semibold text-gray-900 mb-2">사이트를 삭제할까요?</p>
            <p className="text-sm text-gray-500 mb-5">삭제하면 이 사이트의 등록 정보가 제거됩니다. 스냅샷 데이터는 유지됩니다.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 사이트 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">🌐 새 사이트 추가</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">사이트 이름 <span className="text-rose-500">*</span></label>
                  <input
                    ref={firstInputRef}
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="예: 나의 블로그"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {computedId && <p className="mt-1 text-[11px] text-gray-400">ID: <code>{computedId}</code></p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">도메인 <span className="text-rose-500">*</span></label>
                  <input
                    value={form.domain}
                    onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                    placeholder="예: www.example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    GSC 속성 URL <span className="text-rose-500">*</span>
                    <span className="ml-1 text-gray-400 font-normal">(sc-domain:… 또는 https://…)</span>
                  </label>
                  <input
                    value={form.site_url}
                    onChange={e => setForm(f => ({ ...f, site_url: e.target.value }))}
                    placeholder="예: sc-domain:example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">사이트맵 URL <span className="text-rose-500">*</span></label>
                  <input
                    value={form.sitemap_url}
                    onChange={e => setForm(f => ({ ...f, sitemap_url: e.target.value }))}
                    placeholder="예: https://www.example.com/sitemap.xml"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">설명</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="사이트에 대한 간단한 설명"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">이모지</label>
                  <input
                    value={form.emoji}
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    placeholder="🌐"
                    maxLength={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">색상</label>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color: c.value }))}
                        title={c.label}
                        className={`w-6 h-6 rounded-full ${c.badge} border-2 transition-transform ${form.color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 미리보기 */}
              <div className={`rounded-xl border-2 p-4 bg-gradient-to-br ${colorStyles(form.color).card}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colorStyles(form.color).badge} text-white flex items-center justify-center text-xl shrink-0`}>
                    {form.emoji || '🌐'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{form.label || '사이트 이름'}</div>
                    <code className="text-xs text-gray-500">{form.domain || 'example.com'}</code>
                    {form.description && <p className="text-xs text-gray-600 mt-0.5">{form.description}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">취소</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400">
                  {saving ? '저장 중…' : '사이트 추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
