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
    const { topic, industry, count, additionalNotes } = await request.json();

    if (!topic?.trim()) {
      return withCors(NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 }));
    }
    if (!apiKey) {
      return withCors(NextResponse.json(
        { error: 'API 키가 필요합니다. X-API-Key 헤더 또는 서버에 ANTHROPIC_API_KEY를 설정하세요.' },
        { status: 401 }
      ));
    }

    const episodeCount = Math.min(Math.max(count || 7, 3), 12);
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `당신은 GEO/AIO 최적화 콘텐츠 전략가입니다.

주제: "${topic}"
${industry ? `산업 분야: ${industry}` : ''}
${additionalNotes ? `추가 요구사항: ${additionalNotes}` : ''}
시리즈 편수: ${episodeCount}편

이 주제로 GEO/AIO 최적화 콘텐츠 시리즈 기획안을 만들어주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "seriesTitle": "시리즈 전체 제목",
  "seriesDescription": "시리즈 소개 (2-3줄)",
  "targetAudience": "타겟 독자",
  "episodes": [
    {
      "number": 1,
      "title": "에피소드 제목",
      "subtitle": "부제목",
      "summary": "이 편의 핵심 내용 요약 (2-3줄)",
      "targetKeywords": ["타겟 키워드1", "타겟 키워드2"],
      "keyPoints": ["다룰 핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
      "internalLinks": ["연결할 다른 에피소드 번호 또는 제목"],
      "estimatedLength": "예상 글자 수"
    }
  ],
  "linkingStrategy": "내부 링크 전략 설명",
  "publishingSchedule": "권장 발행 주기",
  "expectedOutcome": "시리즈 완성 시 기대 효과"
}`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return withCors(NextResponse.json({ error: '시리즈 기획안을 파싱할 수 없습니다.' }, { status: 500 }));
    }

    const result = JSON.parse(jsonMatch[0]);
    return withCors(NextResponse.json(result));
  } catch (error) {
    console.error('Series generation error:', error);
    return withCors(NextResponse.json(
      { error: error instanceof Error ? error.message : '시리즈 기획 중 오류가 발생했습니다.' },
      { status: 500 }
    ));
  }
}

// v1777031107 - Cache bust
