// CEP(Category Entry Point) 진단 — 페이지 본문을 기준으로 6~8개 상황 진입점을 도출하고
// 각 CEP에 콘텐츠가 얼마나 대응하는지(충분·부분·미대응) 평가한 뒤,
// 제품 중심 문장 → 상황 중심 문장 Before/After 재작성안과 필요한 근거를 제시한다.
//
// 기존 /api/cep/* 는 "키워드에서 CEP를 발굴"하는 위저드(5단계)다.
// 이 모듈은 반대 방향 — "이미 존재하는 페이지가 CEP에 대응하는가"를 감사(audit)한다.
//
// 모델: Claude Haiku 4.5 우선 → 실패 시 Sonnet 4.6 (lib/api-auth.ts 키 풀 사용)

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_HAIKU, CLAUDE_SONNET } from './api-auth';

export type CepCoverage = 'sufficient' | 'partial' | 'missing';

export const COVERAGE_LABEL: Record<CepCoverage, string> = {
  sufficient: '충분',
  partial: '부분',
  missing: '미대응',
};

export interface CepRewrite {
  before: string;        // 페이지에 실제로 있는 제품 중심 문장 (없으면 대표 문장 요약)
  after: string;         // 상황 중심으로 재작성한 문장
  evidenceNeeded: string[]; // 이 문장을 뒷받침하려면 추가해야 할 수치·근거·출처
}

export interface CepItem {
  id: string;
  situation: string;      // 상황 진입점 한 문장 ("누가·언제·왜")
  who: string;
  when: string;
  why: string;
  constraint: string;     // 제약·경험 조건
  decisionCriteria: string[]; // 무엇을 기준으로 선택하는가
  likelyQuestions: string[];  // AI에게 실제로 물을 법한 질문 2~3개
  coverage: CepCoverage;
  coverageReason: string;
  rewrite: CepRewrite | null; // coverage가 sufficient면 null 가능
}

export interface QualitativeFinding {
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
  fix: string;
}

export interface CepAuditResult {
  summary: string;
  cepCoverageScore: number;   // 0~100 (충분 100 / 부분 50 / 미대응 0의 가중 평균)
  ceps: CepItem[];
  qualitative: QualitativeFinding[];
  improvedLead: string;       // 상황 중심으로 다시 쓴 도입부 (복사용)
  model: string;
  truncated?: boolean;        // 응답이 토큰 상한에 걸려 일부 항목이 잘렸는지
}

/* ────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `당신은 GEO(Generative Engine Optimization)와 CEP(Category Entry Point) 진단 전문가다.

목표: 주어진 웹페이지가 "생성형 답변 엔진(ChatGPT·Perplexity·Gemini·Google AI Overviews)이 답변의 출처로 인용할 만한가"를 CEP 관점에서 감사한다.

CEP 정의:
CEP는 사용자가 AI에게 실제로 질문하게 되는 "상황 진입점"이다. 검색 키워드가 아니라 맥락이다.
- 누가(who): 어떤 역할·처지의 사람인가 (인구통계가 아니라 상황적 역할)
- 언제(when): 어떤 시점·계기에 이 질문이 생기는가
- 왜(why): 어떤 문제·과업을 해결하려 하는가
- 제약(constraint): 예산·시간·경험 수준·환경상 어떤 제약을 안고 있는가
- 선택 기준(decisionCriteria): 무엇을 근거로 후보를 비교·선택하는가

작업 규칙:
1. 페이지 본문에서 실제로 다루는 주제·카테고리를 먼저 파악한 뒤, 그 카테고리에서 발생하는 CEP를 6~8개 도출한다.
2. CEP는 서로 겹치지 않게, 시점·과업·제약이 실제로 다른 상황으로 분리한다.
3. 각 CEP마다 콘텐츠 대응 수준을 판정한다.
   - "sufficient": 해당 상황의 질문에 페이지가 직접 답하고 있고, 수치·근거까지 있다.
   - "partial": 주제는 언급하지만 상황·조건·근거 중 일부가 빠져 AI가 인용할 근거로 삼기 어렵다.
   - "missing": 해당 상황을 전혀 다루지 않는다.
4. coverage가 "partial" 또는 "missing"이면 rewrite를 반드시 채운다.
   - before: 페이지에 실제로 존재하는 제품·기능 중심 문장을 그대로 인용한다. 그런 문장이 없으면 페이지의 대표 서술 한 문장을 요약해 쓰고 앞에 "(페이지 요약)"을 붙인다.
   - after: 같은 내용을 상황 중심으로 재작성한다. "누가·언제·어떤 제약에서·무엇을 얻는가"가 한 문장에 담겨야 한다. 과장·허위 사실을 만들지 않는다.
   - evidenceNeeded: after 문장을 사실로 뒷받침하기 위해 추가로 확보해야 하는 수치·데이터·출처를 2~3개 구체적으로 적는다. (예: "시술 후 6개월 재방문율 %(자체 진료기록 n=…)", "건강보험심사평가원 2025 평균 비용 통계 링크")
5. coverage가 "sufficient"면 rewrite는 null로 둔다.
6. 사실을 발명하지 않는다. 본문에 근거가 없으면 그 사실을 지적하고 플레이스홀더로 표시한다.
7. 모든 출력은 한국어로 작성한다.
8. situation은 1문장, coverageReason은 2문장 이내로 간결하게 쓴다. 길게 쓰면 응답이 잘려 결과가 유실된다.

반드시 아래 JSON 스키마로만 응답한다. 코드블록·설명·주석을 붙이지 않는다.

{
  "summary": "이 페이지의 CEP 대응 상태를 3~4문장으로 요약",
  "ceps": [
    {
      "situation": "상황 진입점 한 문장",
      "who": "...", "when": "...", "why": "...", "constraint": "...",
      "decisionCriteria": ["기준1", "기준2"],
      "likelyQuestions": ["AI에게 물을 법한 질문1", "질문2"],
      "coverage": "sufficient" | "partial" | "missing",
      "coverageReason": "그렇게 판정한 근거 (본문 인용 포함, 2문장 이내)",
      "rewrite": {
        "before": "제품 중심 원문 문장",
        "after": "상황 중심 재작성 문장",
        "evidenceNeeded": ["추가할 수치·근거1", "출처2"]
      }
    }
  ]
}`;

// 정성 평가 + 도입부 재작성은 별도 호출로 분리한다.
// 한 번의 응답에 CEP 8개까지 담으면 토큰 상한(8k)에 걸려 뒤쪽 필드(qualitative·improvedLead)가
// 조용히 잘려 나갔다. 두 호출을 병렬로 실행하면 유실이 없고 지연도 늘지 않는다.
const QUAL_SYSTEM_PROMPT = `당신은 GEO(Generative Engine Optimization) 콘텐츠 편집 전문가다.

목표: 주어진 웹페이지에서 "정규식·HTML 구조 분석(로컬 휴리스틱)으로는 잡히지 않는 정성적 문제"를 찾아내고,
생성형 답변 엔진이 인용하기 좋은 도입부로 다시 쓴다.

작업 규칙:
1. qualitative에는 정성적 문제를 3~5개 적는다. 예: 근거 없는 단정, 모호한 수식어("최고의", "많은"), 문장 톤 불일치,
   주제 이탈, 경쟁 콘텐츠 대비 차별점 부재, 1인칭 홍보 문구 과다, 질문에 답하지 않고 배경만 설명하는 구조.
2. 이미 로컬 휴리스틱이 지적한 항목(입력에 명시됨)은 중복해서 적지 않는다. 휴리스틱이 볼 수 없는 의미·논리 문제에 집중한다.
3. severity는 "AI가 이 페이지를 출처로 선택하지 않게 만드는 정도"로 판정한다.
4. improvedLead는 페이지 도입부를 상황 중심 + 결론 우선으로 다시 쓴 3~5문장이다.
   첫 문장에 결론·정의를 두고, 이어서 누가·언제·어떤 제약에서 유효한지를 밝힌다.
5. 사실을 발명하지 않는다. 본문에서 확인되지 않은 수치·비율·기간은 반드시 [ ] 대괄호 플레이스홀더로 남긴다.
6. 모든 출력은 한국어로 작성한다.

반드시 아래 JSON 스키마로만 응답한다. 코드블록·설명·주석을 붙이지 않는다.

{
  "qualitative": [
    { "title": "문제 제목", "detail": "구체적 설명", "severity": "high" | "medium" | "low", "fix": "처방 한 줄" }
  ],
  "improvedLead": "상황 중심으로 재작성한 도입부 3~5문장"
}`;

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let json = (fenced ? fenced[1] : text).trim();

  // 앞뒤 잡텍스트 제거 — 첫 { 부터 마지막 } 까지
  const first = json.indexOf('{');
  const last = json.lastIndexOf('}');
  if (first >= 0 && last > first) json = json.slice(first, last + 1);

  try { JSON.parse(json); return json; } catch { /* 아래에서 복구 */ }

  // 잘린 응답 복구: 미완성 문자열 잘라내고 괄호 닫기
  let fixed = json;
  const lastQuote = fixed.lastIndexOf('"');
  const tail = fixed.slice(lastQuote + 1).trim();
  if (tail === '' || tail === ',') fixed = fixed.slice(0, lastQuote + 1);
  const closeCount = (open: string, close: string) =>
    (fixed.match(new RegExp(`\\${open}`, 'g')) || []).length - (fixed.match(new RegExp(`\\${close}`, 'g')) || []).length;
  for (let i = 0; i < closeCount('[', ']'); i++) fixed += ']';
  for (let i = 0; i < closeCount('{', '}'); i++) fixed += '}';
  try { JSON.parse(fixed); return fixed; } catch { return json; }
}

function normalizeCoverage(v: unknown): CepCoverage {
  const s = String(v ?? '').toLowerCase();
  if (s.startsWith('suff') || s.includes('충분')) return 'sufficient';
  if (s.startsWith('part') || s.includes('부분')) return 'partial';
  return 'missing';
}

function asStringArray(v: unknown, limit = 5): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, limit);
}

function coverageScore(ceps: CepItem[]): number {
  if (ceps.length === 0) return 0;
  const total = ceps.reduce((sum, c) => sum + (c.coverage === 'sufficient' ? 100 : c.coverage === 'partial' ? 50 : 0), 0);
  return Math.round(total / ceps.length);
}

export interface CepAuditInput {
  url: string;
  title: string;
  description: string;
  headings: { level: number; text: string }[];
  bodyText: string;              // extractPlainText() 결과
  businessContext?: string;      // 사용자가 입력한 사업 맥락 (선택)
  weakChecks?: string[];         // 로컬 휴리스틱에서 약한 항목 라벨 — LLM에 힌트로 전달
}

function buildUserMessage(input: CepAuditInput, task: string): string {
  const hs = input.headings.slice(0, 30).map(h => `${'#'.repeat(h.level)} ${h.text}`).join('\n');
  return [
    `## 대상 URL\n${input.url}`,
    `## 타이틀\n${input.title || '(없음)'}`,
    `## meta description\n${input.description || '(없음)'}`,
    input.businessContext ? `## 사업 맥락 (사용자 입력)\n${input.businessContext}` : '',
    `## 헤딩 구조\n${hs || '(헤딩 없음)'}`,
    input.weakChecks?.length ? `## 로컬 휴리스틱이 지적한 약점\n- ${input.weakChecks.join('\n- ')}` : '',
    `## 본문\n${input.bodyText}`,
    '',
    task,
  ].filter(Boolean).join('\n\n');
}

/** Haiku → Sonnet 폴백으로 JSON 응답 1건을 받아온다. stop_reason도 함께 반환. */
async function callJson(
  client: Anthropic,
  system: string,
  userMessage: string,
  maxTokens: number,
): Promise<{ raw: string; model: string; truncated: boolean }> {
  let lastError: unknown = null;
  for (const model of [CLAUDE_HAIKU, CLAUDE_SONNET]) {
    try {
      const res = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: 0.4,
        system,
        messages: [{ role: 'user', content: userMessage }],
      });
      const block = res.content.find(c => c.type === 'text');
      if (!block || block.type !== 'text') throw new Error('빈 응답');
      return { raw: block.text, model, truncated: res.stop_reason === 'max_tokens' };
    } catch (e) {
      lastError = e;
      console.error(`[cep-audit] ${model} 실패:`, e instanceof Error ? e.message : e);
    }
  }
  throw new Error(lastError instanceof Error ? lastError.message : '알 수 없는 오류');
}

/**
 * CEP 감사 실행. apiKey는 lib/api-auth.ts의 getClaudeKey()로 얻은 키를 전달.
 *
 * CEP 도출과 정성 평가를 2개 호출로 분리해 병렬 실행한다.
 * (한 응답에 다 담으면 8k 토큰 상한에 걸려 뒤쪽 필드가 잘려 나갔다 — 실측 확인)
 * 정성 평가가 실패해도 CEP 결과는 그대로 반환한다.
 */
export async function auditCep(input: CepAuditInput, apiKey: string): Promise<CepAuditResult> {
  const client = new Anthropic({ apiKey });

  const cepTask = '위 페이지에 대해 CEP 6~8개를 도출하고 지시한 JSON 스키마로만 응답하라.';
  const qualTask = '위 페이지의 정성적 문제 3~5개와 재작성한 도입부를 지시한 JSON 스키마로만 응답하라.';

  const [cepCall, qualCall] = await Promise.all([
    callJson(client, SYSTEM_PROMPT, buildUserMessage(input, cepTask), 8000),
    callJson(client, QUAL_SYSTEM_PROMPT, buildUserMessage(input, qualTask), 3000)
      .catch((e: unknown) => {
        console.error('[cep-audit] 정성 평가 실패 — CEP 결과만 반환:', e instanceof Error ? e.message : e);
        return null;
      }),
  ]);

  let parsed: { summary?: string; ceps?: unknown[] };
  try {
    parsed = JSON.parse(extractJSON(cepCall.raw)) as { summary?: string; ceps?: unknown[] };
  } catch (e) {
    throw new Error(`CEP 응답 JSON 파싱 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
  }

  const ceps: CepItem[] = (parsed.ceps || []).slice(0, 8).map((raw, i) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const coverage = normalizeCoverage(o.coverage);
    const rw = o.rewrite as Record<string, unknown> | null | undefined;
    const rewrite: CepRewrite | null =
      rw && typeof rw === 'object' && typeof rw.after === 'string'
        ? {
            before: String(rw.before ?? '').trim(),
            after: String(rw.after ?? '').trim(),
            evidenceNeeded: asStringArray(rw.evidenceNeeded, 4),
          }
        : null;

    return {
      id: `cep-${i + 1}`,
      situation: String(o.situation ?? '').trim() || `상황 ${i + 1}`,
      who: String(o.who ?? '').trim(),
      when: String(o.when ?? '').trim(),
      why: String(o.why ?? '').trim(),
      constraint: String(o.constraint ?? '').trim(),
      decisionCriteria: asStringArray(o.decisionCriteria, 5),
      likelyQuestions: asStringArray(o.likelyQuestions, 4),
      coverage,
      coverageReason: String(o.coverageReason ?? '').trim(),
      rewrite,
    };
  });

  if (ceps.length === 0) throw new Error('CEP를 도출하지 못했습니다.');

  /* ── 정성 평가 (실패해도 CEP 결과는 살린다) ── */
  let qualitative: QualitativeFinding[] = [];
  let improvedLead = '';
  if (qualCall) {
    try {
      const q = JSON.parse(extractJSON(qualCall.raw)) as { qualitative?: unknown[]; improvedLead?: string };
      qualitative = (q.qualitative || []).slice(0, 6).map(raw => {
        const o = (raw ?? {}) as Record<string, unknown>;
        const sev = String(o.severity ?? 'medium').toLowerCase();
        return {
          title: String(o.title ?? '').trim() || '지적 사항',
          detail: String(o.detail ?? '').trim(),
          severity: (sev === 'high' || sev === 'low' ? sev : 'medium') as 'high' | 'medium' | 'low',
          fix: String(o.fix ?? '').trim(),
        };
      });
      improvedLead = String(q.improvedLead ?? '').trim();
    } catch (e) {
      console.error('[cep-audit] 정성 평가 JSON 파싱 실패:', e instanceof Error ? e.message : e);
    }
  }

  return {
    summary: String(parsed.summary ?? '').trim(),
    cepCoverageScore: coverageScore(ceps),
    ceps,
    qualitative,
    improvedLead,
    model: cepCall.model,
    truncated: cepCall.truncated || qualCall?.truncated || undefined,
  };
}
