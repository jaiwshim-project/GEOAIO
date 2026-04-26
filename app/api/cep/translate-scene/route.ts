import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import type { CEPSceneTranslateRequest, CEPSceneTranslateResponse } from '@/lib/types';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsOptionsResponse();
}

const SYSTEM_INSTRUCTION = `당신은 CEP(Category Entry Point) 번역 전문가다.
검색어 클러스터를 보고 소비자가 카테고리로 들어오는 "순간/장면"을 한 문장으로 정의한다.

원칙:
1. 사람이 아닌 순간 (X "30대 여성" / O "아침 화장 전 자외선 차단해야 하는 순간")
2. 행동+불편+욕구가 하나로 묶인 1문장
3. 30~60자 내외
4. contentHooks는 콘텐츠 본문에 녹여 쓸 후크 3개 (각 20자 내외)
5. task는 소비자가 해결하려는 과업 (한 줄)
6. rationale은 클러스터에서 어떻게 이 장면이 도출됐는지 한 줄

반드시 JSON 형태(sceneSentence, task, rationale, contentHooks)로만 응답한다.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sceneSentence: { type: Type.STRING, description: '소비자 진입 장면 1문장 (30~60자)' },
    task: { type: Type.STRING, description: '소비자가 해결하려는 과업 한 줄' },
    rationale: { type: Type.STRING, description: '클러스터에서 장면을 도출한 근거 한 줄' },
    contentHooks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '콘텐츠에 녹일 수 있는 후크 3개 (각 20자 내외)',
    },
  },
  required: ['sceneSentence', 'task', 'rationale', 'contentHooks'],
};

function buildUserMessage(body: CEPSceneTranslateRequest): string {
  const cluster = body.cluster;
  const keywords = Array.isArray(cluster?.keywords) ? cluster.keywords : [];
  const searchPath = Array.isArray((cluster as { searchPath?: string[] })?.searchPath)
    ? (cluster as { searchPath?: string[] }).searchPath!
    : [];
  const clusterName = (cluster as { clusterName?: string })?.clusterName || '';

  return `[검색어 클러스터]
${clusterName ? `클러스터명: ${clusterName}\n` : ''}키워드(${keywords.length}개): ${keywords.join(', ')}
${searchPath.length > 0 ? `검색 경로(소비자 흐름): ${searchPath.join(' → ')}` : ''}

${body.industry ? `산업/카테고리: ${body.industry}` : ''}
${body.businessContext ? `비즈니스 맥락: ${body.businessContext}` : ''}

위 클러스터를 보고 소비자가 이 카테고리에 진입하는 "순간/장면"을 한 문장으로 번역해라.
사람(인구통계)이 아닌 행동·불편·욕구가 묶인 그 "순간"을 점유 가능한 형태로 정의하라.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CEPSceneTranslateRequest;

    if (!body?.cluster?.keywords || !Array.isArray(body.cluster.keywords) || body.cluster.keywords.length === 0) {
      return withCors(NextResponse.json(
        { error: 'cluster.keywords는 1개 이상 필요합니다.' },
        { status: 400 }
      ));
    }

    const claudeKey = getClaudeKey(request);
    const geminiKey = getGeminiKey(request);

    if (!claudeKey && !geminiKey) {
      return withCors(NextResponse.json(
        { error: 'Claude 또는 Gemini API 키가 필요합니다. /settings 페이지에서 API 키를 등록해주세요.' },
        { status: 401 }
      ));
    }

    const userMessage = buildUserMessage(body);

    let text = '';
    let lastError: Error | null = null;

    // Gemini 우선 시도
    if (geminiKey) {
      try {
        console.log('[API/cep/translate-scene] Gemini 시도');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });
        text = response.text || '';
        console.log('[API/cep/translate-scene] Gemini 성공');
      } catch (geminiError: unknown) {
        lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        console.log('[API/cep/translate-scene] Gemini 실패, Claude 폴백 시도:', lastError.message);

        if (claudeKey) {
          try {
            const client = new Anthropic({ apiKey: claudeKey });
            const message = await client.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1024,
              messages: [{
                role: 'user',
                content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:\n{"sceneSentence":"…","task":"…","rationale":"…","contentHooks":["…","…","…"]}`,
              }],
            });
            text = message.content[0].type === 'text' ? message.content[0].text : '';
            console.log('[API/cep/translate-scene] Claude 폴백 성공');
          } catch (claudeError: unknown) {
            console.error('[API/cep/translate-scene] Claude 폴백도 실패:', claudeError);
            throw lastError;
          }
        } else {
          throw lastError;
        }
      }
    } else if (claudeKey) {
      // Gemini 키 없을 때 Claude만 사용
      console.log('[API/cep/translate-scene] Claude 단독 시도');
      const client = new Anthropic({ apiKey: claudeKey });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:\n{"sceneSentence":"…","task":"…","rationale":"…","contentHooks":["…","…","…"]}`,
        }],
      });
      text = message.content[0].type === 'text' ? message.content[0].text : '';
      console.log('[API/cep/translate-scene] Claude 단독 성공');
    }

    // JSON 추출 — 코드블록 / 앞뒤 텍스트 / 순수 JSON 모두 처리
    let parsed: CEPSceneTranslateResponse;
    try {
      const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (blockMatch) {
        parsed = JSON.parse(blockMatch[1].trim()) as CEPSceneTranslateResponse;
      } else {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          parsed = JSON.parse(text.slice(start, end + 1)) as CEPSceneTranslateResponse;
        } else {
          parsed = JSON.parse(text.trim()) as CEPSceneTranslateResponse;
        }
      }
    } catch (parseError) {
      console.error('[API/cep/translate-scene] JSON 파싱 실패:', parseError, '원본:', text.slice(0, 300));
      return withCors(NextResponse.json(
        { error: '장면 번역 결과를 파싱할 수 없습니다.', raw: text.slice(0, 500) },
        { status: 500 }
      ));
    }

    // 필드 검증·보정
    if (!parsed.sceneSentence || typeof parsed.sceneSentence !== 'string') {
      return withCors(NextResponse.json(
        { error: 'sceneSentence가 비어 있습니다.' },
        { status: 500 }
      ));
    }
    if (!Array.isArray(parsed.contentHooks)) {
      parsed.contentHooks = [];
    }
    parsed.task = parsed.task || '';
    parsed.rationale = parsed.rationale || '';

    return withCors(NextResponse.json(parsed));
  } catch (error: unknown) {
    console.error('[API/cep/translate-scene] error:', error);
    const msg = error instanceof Error ? error.message : '장면 번역 중 오류가 발생했습니다.';

    if (msg.includes('Gemini') && (msg.includes('401') || msg.includes('authentication'))) {
      return withCors(NextResponse.json({ error: 'Gemini API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('Claude') && (msg.includes('401') || msg.includes('authentication'))) {
      return withCors(NextResponse.json({ error: 'Claude API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return withCors(NextResponse.json(
        { error: 'API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      ));
    }
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
