import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getApiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 60;

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey(request);
    const { keyword, industry } = await request.json();

    if (!keyword?.trim()) {
      return withCors(NextResponse.json({ error: '키워드를 입력해주세요.' }, { status: 400 }));
    }
    if (!apiKey) {
      return withCors(NextResponse.json(
        { error: 'API 키가 필요합니다. X-API-Key 헤더 또는 서버에 ANTHROPIC_API_KEY를 설정하세요.' },
        { status: 401 }
      ));
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `당신은 GEO/AIO(AI 검색엔진 최적화) 전문가입니다.

키워드: "${keyword}"
${industry ? `산업 분야: ${industry}` : ''}

이 키워드에 대해 AI 검색엔진(ChatGPT, Gemini, Perplexity 등)에서 인용되기 위한 경쟁 분석을 수행하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "keyword": "분석 키워드",
  "difficulty": "상/중/하",
  "difficultyScore": 0-100,
  "searchIntent": "검색 의도 설명",
  "aiCitationFactors": [
    { "factor": "인용 요소", "importance": "높음/중간/낮음", "description": "설명" }
  ],
  "mustCoverTopics": [
    { "topic": "반드시 다뤄야 할 주제", "reason": "이유" }
  ],
  "differentiationStrategies": [
    { "strategy": "차별화 전략", "description": "구체적 실행 방법", "impact": "높음/중간" }
  ],
  "contentRecommendations": {
    "idealLength": "권장 글자 수",
    "format": "권장 형식",
    "tone": "권장 톤",
    "keyElements": ["핵심 포함 요소1", "핵심 포함 요소2"]
  },
  "relatedKeywords": ["연관 키워드1", "연관 키워드2", "연관 키워드3"],
  "competitorInsights": "경쟁 환경 종합 분석"
}`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return withCors(NextResponse.json({ error: '분석 결과를 파싱할 수 없습니다.' }, { status: 500 }));
    }

    const result = JSON.parse(jsonMatch[0]);
    return withCors(NextResponse.json(result));
  } catch (error) {
    console.error('Keyword analysis error:', error);
    return withCors(NextResponse.json(
      { error: error instanceof Error ? error.message : '키워드 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    ));
  }
}

// v1777031107 - Cache bust
