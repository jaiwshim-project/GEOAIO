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

// 반복 횟수 + 번역 언어 선택 (generate → result)
export const PUBLISH_OPTIONS_KEY = 'geoaio_publish_options';
export interface PublishOptions {
  repeatCount: number; // 1~5
  translationLangs: ('en' | 'zh' | 'ja')[]; // 선택된 외국어 (한국어는 항상 발행)
}
export const DEFAULT_PUBLISH_OPTIONS: PublishOptions = {
  repeatCount: 1,
  translationLangs: [], // 기본 모두 해제 — 사용자가 명시적으로 선택해야 외국어 발행
};

// 자동 반복 실행 상태 — generate ↔ result 라운드트립 자동화
export const AUTOPILOT_RUN_KEY = 'geoaio_autopilot_run';

// 진행 단계
export type AutopilotPhase =
  | 'idle'
  | 'starting'
  | 'generating'        // 콘텐츠 생성 중 (15톤 MD)
  | 'eeat'              // 15톤 EEAT 변환 중
  | 'publishing-ko'
  | 'translating-en' | 'publishing-en'
  | 'translating-zh' | 'publishing-zh'
  | 'translating-ja' | 'publishing-ja'
  | 'cycle-done'        // 한 회차 종료
  | 'all-done';         // 전체 회차 완료

export interface AutopilotRun {
  isRunning: boolean;
  totalRepeats: number;        // 사용자가 선택한 횟수 (1~5)
  currentRepeat: number;       // 현재 진행 중인 회차 (1-base)
  topicQueue: string[];        // 회차별 주제 (사용자 선택 시점에 고정)
  translationLangs: ('en' | 'zh' | 'ja')[]; // 매 회차에 발행할 외국어
  category: string;            // 모든 회차가 발행될 카테고리 (고정)
  startedAt: number;           // 시작 timestamp
  publishedTotal: number;      // 누적 발행 편 수 (참고용)
  currentPhase: AutopilotPhase; // 진행 단계 (overlay 표시용)
  phaseUpdatedAt: number;      // 마지막 phase 변경 timestamp
}
export const EMPTY_AUTOPILOT_RUN: AutopilotRun = {
  isRunning: false,
  totalRepeats: 0,
  currentRepeat: 0,
  topicQueue: [],
  translationLangs: [],
  category: '',
  startedAt: 0,
  publishedTotal: 0,
  currentPhase: 'idle',
  phaseUpdatedAt: 0,
};

// phase만 업데이트하는 헬퍼 (storage event도 트리거)
export function updateAutopilotPhase(phase: AutopilotPhase): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(AUTOPILOT_RUN_KEY);
    if (!raw) return;
    const run = JSON.parse(raw);
    run.currentPhase = phase;
    run.phaseUpdatedAt = Date.now();
    sessionStorage.setItem(AUTOPILOT_RUN_KEY, JSON.stringify(run));
    // 같은 탭 내 storage event는 트리거되지 않으므로 커스텀 이벤트 발행
    window.dispatchEvent(new CustomEvent('autopilot-phase-update', { detail: { phase } }));
  } catch {}
}

// 도우미 — sessionStorage 읽기/쓰기/클리어
export function readAutopilotRun(): AutopilotRun {
  if (typeof window === 'undefined') return EMPTY_AUTOPILOT_RUN;
  try {
    const raw = sessionStorage.getItem(AUTOPILOT_RUN_KEY);
    if (!raw) return EMPTY_AUTOPILOT_RUN;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.totalRepeats === 'number') return parsed;
  } catch {}
  return EMPTY_AUTOPILOT_RUN;
}
export function writeAutopilotRun(run: AutopilotRun): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTOPILOT_RUN_KEY, JSON.stringify(run));
    // 같은 탭 내 storage event는 트리거되지 않으므로 커스텀 이벤트로 즉시 알림
    // (publishedTotal·currentPhase 변경 시 모든 구독자가 즉시 갱신)
    window.dispatchEvent(new CustomEvent('autopilot-phase-update', { detail: { type: 'run-update' } }));
  } catch {}
}
export function clearAutopilotRun(): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(AUTOPILOT_RUN_KEY); } catch {}
}
