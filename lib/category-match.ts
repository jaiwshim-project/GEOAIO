import type { BlogCategory } from './supabase-storage';

// ContentCategory enum (콘텐츠 형식 — 카테고리로 박히면 안 됨)
export const CONTENT_FORMAT_TYPES = new Set([
  'blog','product','faq','howto','landing','technical','social','email','case','video',
]);

// 프로젝트명 → 카테고리 슬러그 자동 매칭
// 우선순위: 정확 매칭 → 부분 매칭 → Fuzzy 매칭(70% 유사) → 정규화 슬러그 폴백
// 동일 의도의 입력이 항상 같은 슬러그로 매칭되도록 강화.
export function autoMatchCategory(projectName: string, categories: BlogCategory[]): string {
  if (!projectName) return '';

  // 1) 정확 매칭 — projectName이 cats의 label/slug 포함
  const exact = categories.find(c => projectName.includes(c.label) || projectName.includes(c.slug));
  if (exact) return exact.slug;

  // 2) 첫 단어 부분 매칭
  const firstWord = projectName.split(/[\s·_\-/]+/)[0];
  if (firstWord && firstWord.length >= 3) {
    const partial = categories.find(c => c.label.includes(firstWord) || c.slug.includes(firstWord));
    if (partial) return partial.slug;
  }

  // 3) 정규화 슬러그 + Fuzzy 매칭 — 비슷한 기존 카테고리 있으면 재사용
  const normalized = normalizeSlug(projectName);
  if (!normalized || CONTENT_FORMAT_TYPES.has(normalized)) return '';
  const existingSlugs = categories.map(c => c.slug);
  const similar = findSimilarCategory(normalized, existingSlugs, 0.7);
  if (similar) return similar;

  // 4) 신규 정규화 슬러그 (위 모두 매치 없을 때)
  return normalized.length >= 2 ? normalized : '';
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

// === 슬러그 정규화 — 일관성 보장 ===
// 동일 의도의 입력이 항상 같은 슬러그로 변환되도록 표준화.
// "말로 만드는 창업의 시대, 바이브 코딩" → "말로-만드는-창업의-시대-바이브-코딩"
// 모든 공백·쉼표·마침표·구두점을 단일 하이픈으로, 한글·영숫자는 보존.
export function normalizeSlug(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // 공백·쉼표·마침표·콜론·슬래시·언더스코어·괄호 등 모두 하이픈으로
    .replace(/[\s,.:;\/_(){}[\]·]+/g, '-')
    // 한글·영숫자·하이픈만 남김 (다른 특수문자 제거)
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-]/g, '')
    // 연속 하이픈 → 단일
    .replace(/-+/g, '-')
    // 양끝 하이픈 제거
    .replace(/^-+|-+$/g, '');
}

// === Levenshtein 편집 거리 ===
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) m[i][0] = i;
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
    }
  }
  return m[a.length][b.length];
}

// === Fuzzy 매칭 — 기존 카테고리 중 유사도 70% 이상이면 그것 재사용 ===
// 단어 분해 후 70% 이상 일치하거나 편집 거리 기반 유사도가 0.75 이상이면 매칭.
// 새 카테고리 생성 직전에 호출해 중복 방지 (예: 정원오-서울시장-후보 vs 정원오-서울시장-후보자).
export function findSimilarCategory(targetSlug: string, existingSlugs: string[], threshold = 0.7): string | null {
  if (!targetSlug || existingSlugs.length === 0) return null;
  const targetWords = new Set(targetSlug.split(/[-_\s]+/).filter(Boolean));
  let best: { slug: string; score: number } | null = null;
  for (const existing of existingSlugs) {
    if (existing === targetSlug) return existing; // 정확 일치
    // 1) 단어 집합 자카드 유사도
    const existingWords = new Set(existing.split(/[-_\s]+/).filter(Boolean));
    const intersection = new Set([...targetWords].filter(w => existingWords.has(w)));
    const union = new Set([...targetWords, ...existingWords]);
    const wordSim = union.size > 0 ? intersection.size / union.size : 0;
    // 2) 편집 거리 기반 유사도
    const dist = levenshtein(targetSlug, existing);
    const maxLen = Math.max(targetSlug.length, existing.length);
    const editSim = maxLen > 0 ? 1 - dist / maxLen : 0;
    // 두 점수 중 더 높은 것 채택
    const score = Math.max(wordSim, editSim);
    if (score >= threshold && (!best || score > best.score)) {
      best = { slug: existing, score };
    }
  }
  return best ? best.slug : null;
}

// === 카테고리 결정 — autoMatch + Fuzzy 통합 ===
// 1순위: autoMatchCategory (정확/부분 매칭)
// 2순위: 폴백 슬러그 만들 때 fuzzy로 기존 카테고리 검사
// 사용자가 발행 시점에 항상 같은 카테고리에 들어가도록 보장.
export function resolveCategorySlug(projectName: string, categories: BlogCategory[]): string {
  const auto = autoMatchCategory(projectName, categories);
  if (auto) return auto;
  if (!projectName) return '';
  const candidate = normalizeSlug(projectName);
  if (!candidate) return '';
  // Fuzzy로 기존 카테고리에 매치되면 그것 사용 (중복 방지)
  const existingSlugs = categories.map(c => c.slug);
  const similar = findSimilarCategory(candidate, existingSlugs, 0.7);
  if (similar) return similar;
  // 매치 없으면 신규 슬러그
  return candidate;
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
