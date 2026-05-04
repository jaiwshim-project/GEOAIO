import type { BlogCategory } from './supabase-storage';

// ContentCategory enum (콘텐츠 형식 — 카테고리로 박히면 안 됨)
export const CONTENT_FORMAT_TYPES = new Set([
  'blog','product','faq','howto','landing','technical','social','email','case','video',
]);

// 프로젝트명 → 카테고리 슬러그 자동 매칭 (result 페이지의 computeCategory와 동일 로직)
export function autoMatchCategory(projectName: string, categories: BlogCategory[]): string {
  if (!projectName) return '';
  const exact = categories.find(c => projectName.includes(c.label) || projectName.includes(c.slug));
  if (exact) return exact.slug;
  const firstWord = projectName.split(/[\s·_\-/]+/)[0];
  if (firstWord && firstWord.length >= 3) {
    const partial = categories.find(c => c.label.includes(firstWord) || c.slug.includes(firstWord));
    if (partial) return partial.slug;
  }
  const slugified = projectName.trim().replace(/\s+/g, '-');
  if (slugified && slugified.length >= 2 && !CONTENT_FORMAT_TYPES.has(slugified)) return slugified;
  return '';
}

// 프로젝트와 동일한(또는 자동 매칭될) 카테고리를 제외한 목록 — 수동 선택 시 노출
// linkedSlugs가 주어지면 그 슬러그에 속하는 카테고리만 필터 (프로젝트 연관 카테고리만)
export function categoriesExcludingProjectMatch(
  categories: BlogCategory[],
  projectName: string,
  linkedSlugs?: string[],
): BlogCategory[] {
  if (!projectName) return categories;
  const matchedSlug = autoMatchCategory(projectName, categories);
  const linkSet = linkedSlugs ? new Set(linkedSlugs) : null;
  return categories.filter(c => {
    if (c.slug === matchedSlug) return false;
    if (c.label === projectName || c.slug === projectName) return false;
    // linkedSlugs가 주어졌고 비어있지 않으면 → 그 안에 있는 슬러그만 노출
    if (linkSet && linkSet.size > 0 && !linkSet.has(c.slug)) return false;
    return true;
  });
}

export function labelToSlug(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣\-]/g, '') || `cat-${Date.now()}`;
}

// generate 페이지 → result 페이지로 사용자 선택 전달용 sessionStorage 키
export const CATEGORY_CHOICE_KEY = 'geoaio_category_choice';

export interface CategoryChoice {
  mode: 'auto' | 'manual';
  manualSlug: string;
}
