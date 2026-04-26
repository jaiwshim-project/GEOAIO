import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import type {
  CEPScoreRequest,
  CEPScoreResponse,
  CEPCandidate,
  CEPCandidateInput,
} from '@/lib/types';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsOptionsResponse();
}

const SYSTEM_INSTRUCTION = `당신은 CEP(Category Entry Point) 우선순위 평가 전문가다.
각 후보를 다음 3축으로 0~5점(정수 또는 소수 1자리)으로 평가하고 종합 추천을 작성한다.

- marketFit (시장성): 이 장면이 충분히 반복·확장 가능한가
  · 검색량 추정 (자주 검색됨 +)
  · 시즌성 (특정 계절·시기에만 +/-)
  · 카테고리 성장세 (+)
- brandFit (브랜드 적합성): 우리 브랜드·제품이 이 장면에서 경쟁사보다 자연스러운 답이 되는가
  · businessContext의 강점·제품 특성과의 직접적 연결성 (+)
  · 차별화 가능성 (+)
- provability (입증 가능성): 적합성을 데이터·리뷰·테스트로 입증할 수 있는가
  · ragSummary에 근거 자료 존재 (+)
  · 정량 측정 가능 (+)
  · 객관적 비교 데이터 확보 가능 (+)

평가 규칙:
1. 각 점수는 0~5 범위로 제한한다.
2. total = marketFit + brandFit + provability (0~15)
3. 각 축마다 한 줄 rationale(market/brand/proof)을 붙여라.
4. recommendation은 한 줄로 "이 후보를 어떻게 활용할지"를 명시하라.
5. 입력에 sceneSentence, searchPath, type이 있으면 그대로 유지하라(임의 변경 금지).
6. 사람을 가리키는 인구통계 표현 대신 "장면/순간"의 관점에서 평가한다.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cepKeyword: { type: Type.STRING },
          sceneSentence: { type: Type.STRING },
          type: { type: Type.STRING },
          score: {
            type: Type.OBJECT,
            properties: {
              marketFit: { type: Type.NUMBER },
              brandFit: { type: Type.NUMBER },
              provability: { type: Type.NUMBER },
              total: { type: Type.NUMBER },
              rationale: {
                type: Type.OBJECT,
                properties: {
                  market: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  proof: { type: Type.STRING },
                },
                required: ['market', 'brand', 'proof'],
              },
            },
            required: ['marketFit', 'brandFit', 'provability', 'total', 'rationale'],
          },
          recommendation: { type: Type.STRING },
        },
        required: ['cepKeyword', 'score', 'recommendation'],
      },
    },
  },
  required: ['candidates'],
};

function buildUserMessage(body: CEPScoreRequest): string {
  const candidatesJson = JSON.stringify(body.candidates, null, 2);
  return `[평가 대상 CEP 후보 목록]
${candidatesJson}

[비즈니스 컨텍스트]
${body.businessContext || '(제공되지 않음)'}

[RAG 요약 — 입증 자료]
${body.ragSummary || '(제공되지 않음)'}

위 후보 각각에 대해 marketFit / brandFit / provability를 0~5점으로 평가하고,
total(=세 점수의 합), rationale(market/brand/proof 한 줄씩), recommendation(한 줄)을 포함해 응답하라.
각 후보의 cepKeyword·sceneSentence·type은 입력 그대로 유지하라.`;
}

function clampScore(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(5, v));
}

function enrichCandidate(
  raw: Partial<CEPCandidate> & { cepKeyword?: string },
  input?: CEPCandidateInput
): CEPCandidate {
  const market = clampScore(raw.score?.marketFit);
  const brand = clampScore(raw.score?.brandFit);
  const proof = clampScore(raw.score?.provability);
  const totalRaw =
    typeof raw.score?.total === 'number' && Number.isFinite(raw.score.total)
      ? raw.score.total
      : 0;
  const total = totalRaw > 0 ? totalRaw : market + brand + proof;

  return {
    cepKeyword: raw.cepKeyword || input?.cepKeyword || '',
    sceneSentence: raw.sceneSentence ?? input?.sceneSentence,
    searchPath: input?.searchPath,
    type: (raw.type as 'explicit' | 'latent' | undefined) ?? input?.type,
    score: {
      marketFit: market,
      brandFit: brand,
      provability: proof,
      total,
      rationale: {
        market: raw.score?.rationale?.market || '',
        brand: raw.score?.rationale?.brand || '',
        proof: raw.score?.rationale?.proof || '',
      },
    },
    recommendation: raw.recommendation || '',
  };
}

function parseJson(text: string): unknown {
  // 1순위: 코드블록
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blockMatch) {
    try {
      return JSON.parse(blockMatch[1].trim());
    } catch {
      /* fallthrough */
    }
  }
  // 2순위: 첫 { ~ 마지막 }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fallthrough */
    }
  }
  // 3순위: 그대로
  return JSON.parse(text.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CEPScoreRequest;

    if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
      return withCors(
        NextResponse.json(
          { error: 'candidates 배열이 필요합니다 (1~10개).' },
          { status: 400 }
        )
      );
    }
    if (body.candidates.length > 10) {
      return withCors(
        NextResponse.json(
          { error: 'candidates는 최대 10개까지 평가할 수 있습니다.' },
          { status: 400 }
        )
      );
    }
    for (const c of body.candidates) {
      if (!c?.cepKeyword?.trim()) {
        return withCors(
          NextResponse.json(
            { error: '각 후보에는 cepKeyword가 필요합니다.' },
            { status: 400 }
          )
        );
      }
    }

    const claudeKey = getClaudeKey(request);
    const geminiKey = getGeminiKey(request);
    if (!claudeKey && !geminiKey) {
      return withCors(
        NextResponse.json(
          {
            error:
              'Claude 또는 Gemini API 키가 필요합니다. /settings 페이지에서 API 키를 등록해주세요.',
          },
          { status: 401 }
        )
      );
    }

    const userMessage = buildUserMessage(body);

    let text = '';
    let lastError: Error | null = null;

    // Gemini 우선
    if (geminiKey) {
      try {
        console.log('[score-candidates] Gemini 시도');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });
        text = response.text || '';
        console.log('[score-candidates] Gemini 성공');
      } catch (geminiError: unknown) {
        lastError =
          geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        console.log('[score-candidates] Gemini 실패, Claude 폴백:', lastError.message);
      }
    }

    // Claude 폴백 (Gemini 실패 또는 Gemini 키 없음)
    if (!text && claudeKey) {
      try {
        console.log('[score-candidates] Claude 시도');
        const client = new Anthropic({ apiKey: claudeKey });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:\n{"candidates":[{"cepKeyword":"...","sceneSentence":"...","type":"explicit","score":{"marketFit":0,"brandFit":0,"provability":0,"total":0,"rationale":{"market":"...","brand":"...","proof":"..."}},"recommendation":"..."}]}`,
            },
          ],
        });
        text = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log('[score-candidates] Claude 성공');
      } catch (claudeError: unknown) {
        const err =
          claudeError instanceof Error ? claudeError : new Error(String(claudeError));
        console.error('[score-candidates] Claude 실패:', err.message);
        throw lastError || err;
      }
    }

    if (!text) {
      throw lastError || new Error('AI 응답이 비어있습니다.');
    }

    // JSON 파싱
    let parsed: { candidates?: Array<Partial<CEPCandidate> & { cepKeyword?: string }> };
    try {
      parsed = parseJson(text) as typeof parsed;
    } catch (e) {
      console.error('[score-candidates] JSON 파싱 실패:', e, '\n원본:', text.slice(0, 500));
      return withCors(
        NextResponse.json(
          { error: 'AI 응답 JSON 파싱에 실패했습니다.' },
          { status: 502 }
        )
      );
    }

    const rawCandidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];

    // 입력값과 매칭하여 누락 필드 보강
    const enriched: CEPCandidate[] = rawCandidates.map((raw) => {
      const inputMatch = body.candidates.find(
        (c) => c.cepKeyword === (raw.cepKeyword || '')
      );
      return enrichCandidate(raw, inputMatch);
    });

    // LLM이 일부 후보를 누락했을 경우 0점으로 보충
    for (const input of body.candidates) {
      if (!enriched.find((e) => e.cepKeyword === input.cepKeyword)) {
        enriched.push({
          cepKeyword: input.cepKeyword,
          sceneSentence: input.sceneSentence,
          searchPath: input.searchPath,
          type: input.type,
          score: {
            marketFit: 0,
            brandFit: 0,
            provability: 0,
            total: 0,
            rationale: {
              market: '평가 누락',
              brand: '평가 누락',
              proof: '평가 누락',
            },
          },
          recommendation: '재평가 필요',
        });
      }
    }

    // total 내림차순 정렬
    enriched.sort((a, b) => b.score.total - a.score.total);

    const topPick = enriched[0];
    const explicitPicks = enriched.filter((c) => c.type === 'explicit');
    const latentPicks = enriched.filter((c) => c.type === 'latent');

    const result: CEPScoreResponse = {
      candidates: enriched,
      topPick,
      explicitPicks,
      latentPicks,
    };

    return withCors(NextResponse.json(result));
  } catch (error: unknown) {
    console.error('[score-candidates] 처리 오류:', error);
    const msg =
      error instanceof Error ? error.message : 'CEP 후보 평가 중 오류가 발생했습니다.';

    if (msg.includes('401') || msg.includes('authentication')) {
      return withCors(NextResponse.json({ error: 'API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return withCors(
        NextResponse.json(
          { error: 'API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        )
      );
    }
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
