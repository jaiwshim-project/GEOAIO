import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import type { CEPClusterRequest, CEPClusterResponse, CEPCluster } from '@/lib/types';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsOptionsResponse();
}

const SYSTEM_INSTRUCTION = `당신은 검색 데이터 분석가다. 키워드 풀을 보고 같은 의도로 묶이는 클러스터로 분류하고, 카테고리 진입 직전에 사용자가 쓰는 "삶의 언어"를 추출한다.

원칙:
- 클러스터는 3~5개 (너무 많이 쪼개지 마)
- 각 클러스터는 (이름, 키워드 3~7개, 검색 경로 2~4단계, 의도 한 줄)
- searchPath는 검색 흐름 — 표면 → 구체화 → 선택 단계로 자연스럽게
- lifeLanguages는 "비 오는 주말 아이와 갈 곳" 같은 카테고리명 이전의 일상 표현 5개. 시드 키워드를 단순 변형하지 말고 카테고리 진입 직전 언어로 재구성.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    lifeLanguages: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    clusters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clusterName: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          searchPath: { type: Type.ARRAY, items: { type: Type.STRING } },
          intent: { type: Type.STRING },
        },
        required: ['clusterName', 'keywords', 'searchPath', 'intent'],
      },
    },
  },
  required: ['lifeLanguages', 'clusters'],
};

const NAVER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * 네이버 자동완성 한 번 호출.
 * 응답 형태: { items: [ [["검색어", ...], ...], ... ] } — items[0]의 첫 요소만 평탄화.
 */
async function fetchNaverAutoComplete(keyword: string): Promise<string[]> {
  try {
    const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(keyword)}&con=0&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': NAVER_UA,
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://www.naver.com/',
      },
      // 네이버 자동완성은 빠르게 응답하므로 짧게 캐시 허용
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: unknown[] };
    if (!data?.items || !Array.isArray(data.items) || data.items.length === 0) return [];

    const firstGroup = data.items[0];
    if (!Array.isArray(firstGroup)) return [];

    const out: string[] = [];
    for (const row of firstGroup) {
      if (Array.isArray(row) && row.length > 0 && typeof row[0] === 'string') {
        out.push(row[0]);
      } else if (typeof row === 'string') {
        out.push(row);
      }
    }
    return out;
  } catch (err) {
    console.warn('[cep/cluster-search] naver autocomplete failed:', err);
    return [];
  }
}

/**
 * 시드로 1차 호출 + 상위 3개를 다시 시드로 한 번 더 호출해 키워드 풀 확장.
 * 중복 제거 후 최대 50개로 자른다.
 */
async function collectKeywordPool(seedKeyword: string): Promise<string[]> {
  const primary = await fetchNaverAutoComplete(seedKeyword);
  const seen = new Set<string>();
  for (const k of primary) seen.add(k);

  const expansionSeeds = primary.slice(0, 3);
  if (expansionSeeds.length > 0) {
    const expansions = await Promise.allSettled(
      expansionSeeds.map((s) => fetchNaverAutoComplete(s))
    );
    for (const r of expansions) {
      if (r.status === 'fulfilled') {
        for (const k of r.value) seen.add(k);
      }
    }
  }

  return Array.from(seen).slice(0, 50);
}

function buildUserMessage(seedKeyword: string, industry: string | undefined, pool: string[]): string {
  return `시드 키워드: "${seedKeyword}"
${industry ? `산업/분야: ${industry}` : ''}

[키워드 풀 — 네이버 자동완성 수집 결과]
${pool.length > 0 ? pool.map((k) => `- ${k}`).join('\n') : '(자동완성 수집 실패 — 시드 키워드만으로 추론하라)'}

위 풀을 분석해 다음을 산출하라:
1. lifeLanguages: 카테고리 진입 직전 사용자가 일상에서 쓰는 표현 5개 (시드 키워드 직접 변형 금지)
2. clusters: 의미 클러스터 3~5개. 각 클러스터마다 clusterName · keywords(3~7개) · searchPath(2~4단계) · intent(한 줄).

반드시 JSON으로만 응답.`;
}

interface LLMResult {
  lifeLanguages: string[];
  clusters: CEPCluster[];
}

function parseLLMJson(text: string): LLMResult {
  // 1순위: 코드블록 안 JSON
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blockMatch) {
    return JSON.parse(blockMatch[1].trim()) as LLMResult;
  }
  // 2순위: 첫 { 부터 마지막 } 까지
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(text.slice(start, end + 1)) as LLMResult;
  }
  // 3순위: 그대로 파싱
  return JSON.parse(text.trim()) as LLMResult;
}

function normalizeLLMResult(raw: Partial<LLMResult> | undefined): LLMResult {
  const lifeLanguages = Array.isArray(raw?.lifeLanguages)
    ? raw!.lifeLanguages.filter((s): s is string => typeof s === 'string')
    : [];
  const clustersRaw = Array.isArray(raw?.clusters) ? raw!.clusters : [];
  const clusters: CEPCluster[] = clustersRaw
    .map((c): CEPCluster | null => {
      if (!c || typeof c !== 'object') return null;
      const obj = c as unknown as Record<string, unknown>;
      const clusterName = typeof obj.clusterName === 'string' ? obj.clusterName : '';
      const keywords = Array.isArray(obj.keywords)
        ? (obj.keywords.filter((k) => typeof k === 'string') as string[])
        : [];
      const searchPath = Array.isArray(obj.searchPath)
        ? (obj.searchPath.filter((k) => typeof k === 'string') as string[])
        : [];
      const intent = typeof obj.intent === 'string' ? obj.intent : '';
      if (!clusterName || keywords.length === 0) return null;
      return { clusterName, keywords, searchPath, intent };
    })
    .filter((c): c is CEPCluster => c !== null);
  return { lifeLanguages, clusters };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CEPClusterRequest;

    if (!body?.seedKeyword?.trim()) {
      return withCors(
        NextResponse.json({ error: '시드 키워드(seedKeyword)를 입력해주세요.' }, { status: 400 })
      );
    }

    const seedKeyword = body.seedKeyword.trim();
    const industry = body.industry?.trim();

    const claudeKey = getClaudeKey(request);
    const geminiKey = getGeminiKey(request);

    if (!claudeKey && !geminiKey) {
      return withCors(
        NextResponse.json(
          { error: 'Claude 또는 Gemini API 키가 필요합니다. /settings 페이지에서 등록해주세요.' },
          { status: 401 }
        )
      );
    }

    // 1·2단계: 네이버 자동완성 수집 (실패해도 진행)
    const autoCompleteRaw = await collectKeywordPool(seedKeyword);

    // 3단계: LLM 클러스터링 (Gemini 우선 → Claude 폴백)
    const userMessage = buildUserMessage(seedKeyword, industry, autoCompleteRaw);
    let text = '';
    let lastError: Error | null = null;

    if (geminiKey) {
      try {
        console.log('[cep/cluster-search] Gemini 우선 호출');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });
        text = response.text || '';
        console.log('[cep/cluster-search] Gemini 성공');
      } catch (geminiError: unknown) {
        lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        console.log('[cep/cluster-search] Gemini 실패, Claude 폴백:', lastError.message);
        if (claudeKey) {
          const client = new Anthropic({ apiKey: claudeKey });
          const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [
              {
                role: 'user',
                content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답. 마크다운 코드블록 없이 순수 JSON:\n{"lifeLanguages":["..."],"clusters":[{"clusterName":"...","keywords":["..."],"searchPath":["..."],"intent":"..."}]}`,
              },
            ],
          });
          text = message.content[0].type === 'text' ? message.content[0].text : '';
          console.log('[cep/cluster-search] Claude 폴백 성공');
        } else {
          throw lastError;
        }
      }
    } else if (claudeKey) {
      console.log('[cep/cluster-search] Claude 단독 호출');
      const client = new Anthropic({ apiKey: claudeKey });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답. 마크다운 코드블록 없이 순수 JSON:\n{"lifeLanguages":["..."],"clusters":[{"clusterName":"...","keywords":["..."],"searchPath":["..."],"intent":"..."}]}`,
          },
        ],
      });
      text = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    // JSON 파싱 + 정규화
    let llmResult: LLMResult;
    try {
      const raw = parseLLMJson(text) as Partial<LLMResult>;
      llmResult = normalizeLLMResult(raw);
    } catch (parseErr) {
      console.error('[cep/cluster-search] LLM JSON 파싱 실패:', parseErr, 'raw:', text.slice(0, 500));
      llmResult = { lifeLanguages: [], clusters: [] };
    }

    const result: CEPClusterResponse = {
      seedKeyword,
      lifeLanguages: llmResult.lifeLanguages,
      autoCompleteRaw,
      clusters: llmResult.clusters,
    };

    return withCors(NextResponse.json(result));
  } catch (error: unknown) {
    console.error('[cep/cluster-search] error:', error);
    const msg = error instanceof Error ? error.message : 'CEP 클러스터 검색 중 오류가 발생했습니다.';
    if (msg.includes('401') || msg.includes('authentication')) {
      return withCors(NextResponse.json({ error: 'API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return withCors(
        NextResponse.json({ error: 'API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
      );
    }
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
