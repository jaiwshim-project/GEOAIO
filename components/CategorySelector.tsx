'use client';

import { useState } from 'react';
import type { BlogCategory } from '@/lib/supabase-storage';
import {
  autoMatchCategory,
  categoriesExcludingProjectMatch,
  labelToSlug,
} from '@/lib/category-match';

export interface CategoryChoiceValue {
  mode: 'auto' | 'manual';
  manualSlug: string;
}

interface Props {
  projectName: string;
  categories: BlogCategory[];
  value: CategoryChoiceValue;
  onChange: (next: CategoryChoiceValue) => void;
  onCreateCategory?: (label: string, slug: string) => void;
  variant?: 'block' | 'compact';
}

export default function CategorySelector({
  projectName,
  categories,
  value,
  onChange,
  onCreateCategory,
  variant = 'block',
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [createError, setCreateError] = useState('');

  const autoMatched = autoMatchCategory(projectName, categories);
  const manualOptions = categoriesExcludingProjectMatch(categories, projectName);

  const handleCreate = () => {
    const label = newLabel.trim();
    if (!label) {
      setCreateError('카테고리 이름을 입력하세요');
      return;
    }
    const slug = labelToSlug(label);
    if (categories.find(c => c.slug === slug)) {
      setCreateError('이미 존재하는 카테고리입니다');
      return;
    }
    setCreateError('');
    onCreateCategory?.(label, slug);
    onChange({ mode: 'manual', manualSlug: slug });
    setShowCreate(false);
    setNewLabel('');
  };

  const padding = variant === 'compact' ? 'p-3' : 'p-4';
  const titleSize = variant === 'compact' ? 'text-xs' : 'text-sm';

  return (
    <div className={`bg-white border border-amber-200 rounded-xl ${padding} shadow-sm`}>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className={`${titleSize} font-bold text-slate-900 tracking-tight`}>
          📁 블로그 카테고리 선택
        </h3>
        {projectName && (
          <span className="text-[10px] text-slate-600">
            현재 프로젝트: <span className="font-semibold text-amber-700">{projectName}</span>
          </span>
        )}
      </div>

      {/* 라디오: 자동 매칭 */}
      <label
        className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
          value.mode === 'auto'
            ? 'bg-amber-50 border-amber-400 shadow-sm'
            : 'bg-white border-slate-200 hover:border-amber-200'
        }`}
      >
        <input
          type="radio"
          name="category-mode"
          checked={value.mode === 'auto'}
          onChange={() => onChange({ ...value, mode: 'auto' })}
          className="mt-0.5 accent-amber-600"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-bold text-slate-900">자동 매칭</span>
            <span className="text-[11px] text-slate-600">프로젝트명과 동일한 카테고리에 저장</span>
          </div>
          {value.mode === 'auto' && (
            <div className="mt-1.5 text-[11px]">
              {autoMatched ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-semibold">
                  → {autoMatched}
                </span>
              ) : (
                <span className="text-rose-700">⚠️ 프로젝트가 선택되지 않았습니다 — 프로젝트를 먼저 선택하세요</span>
              )}
            </div>
          )}
        </div>
      </label>

      {/* 라디오: 수동 선택 */}
      <label
        className={`mt-1.5 flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
          value.mode === 'manual'
            ? 'bg-amber-50 border-amber-400 shadow-sm'
            : 'bg-white border-slate-200 hover:border-amber-200'
        }`}
      >
        <input
          type="radio"
          name="category-mode"
          checked={value.mode === 'manual'}
          onChange={() => onChange({ ...value, mode: 'manual' })}
          className="mt-0.5 accent-amber-600"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-bold text-slate-900">수동 선택</span>
            <span className="text-[11px] text-slate-600">다른 카테고리(예: 특정 후보자)에 저장</span>
          </div>

          {value.mode === 'manual' && (
            <div className="mt-2">
              {manualOptions.length === 0 && !showCreate && (
                <p className="text-[11px] text-slate-700 mb-2">선택 가능한 다른 카테고리가 없습니다 — 새 카테고리를 만들어주세요.</p>
              )}
              {manualOptions.length > 0 && (
                <select
                  value={value.manualSlug}
                  onChange={e => onChange({ mode: 'manual', manualSlug: e.target.value })}
                  className="w-full text-[12px] py-1.5 px-2 rounded-md border border-slate-300 bg-white font-medium focus:border-amber-400 focus:ring-1 focus:ring-amber-300 outline-none"
                >
                  <option value="">— 카테고리 선택 —</option>
                  {manualOptions.map(c => (
                    <option key={c.slug} value={c.slug}>
                      {c.label} ({c.slug})
                    </option>
                  ))}
                </select>
              )}

              {/* 새 카테고리 만들기 */}
              {!showCreate ? (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="mt-1.5 text-[11px] text-amber-700 hover:text-amber-900 font-bold tracking-wide"
                >
                  + 새 카테고리 만들기
                </button>
              ) : (
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      placeholder="예: 허태정-대전시장-후보자"
                      className="flex-1 text-[12px] py-1.5 px-2 rounded-md border border-amber-300 bg-white font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreate}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-amber-600 text-white font-bold hover:bg-amber-700"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreate(false); setNewLabel(''); setCreateError(''); }}
                      className="text-[11px] px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      취소
                    </button>
                  </div>
                  {createError && <p className="text-[11px] text-rose-600">{createError}</p>}
                  {newLabel && !createError && (
                    <p className="text-[10px] text-slate-600">
                      → 슬러그: <code className="bg-slate-100 px-1 py-0.5 rounded">{labelToSlug(newLabel)}</code>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
