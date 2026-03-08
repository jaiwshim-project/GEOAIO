import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import type { GenerateRequest } from '@/lib/types';

export const maxDuration = 60;

export async function OPTIONS() {
  return corsOptionsResponse();
}

const CATEGORY_LABELS: Record<string, string> = {
  blog: '블로그 포스트',
  product: '제품 설명',
  faq: 'FAQ 페이지',
  howto: 'How-to 가이드',
  landing: '랜딩 페이지',
  technical: '기술 문서',
  social: '소셜 미디어',
  email: '이메일 마케팅',
};

const SYSTEM_PROMPT = `당신은 AIO(AI Overview)와 GEO(Generative Engine Optimization) 전문 콘텐츠 작가입니다.

콘텐츠 생성 원칙:
1. 역피라미드 구조: 핵심 정보를 상단에 배치
2. 구조화된 형식: 명확한 헤딩(H2, H3), 번호/불릿 리스트, 표 활용
3. AI 인용 친화적: 간결하고 명확한 정의문, 통계, 단계별 설명
4. E-E-A-T 신호 내장: 경험, 전문성, 권위, 신뢰 요소 포함
5. FAQ 섹션 포함: AI Overview 노출 확률 증가
6. 의미적 완성도: 관련 검색어와 롱테일 키워드 자연스럽게 포함
7. 인용 가능한 문장: "~이란 ~이다", "~의 핵심은 ~이다" 형태의 정의문 활용

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "title": "생성된 콘텐츠 제목",
  "content": "전체 콘텐츠 (마크다운 형식)",
  "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3", "#해시태그4", "#해시태그5", "#해시태그6", "#해시태그7", "#해시태그8", "#해시태그9", "#해시태그10"],
  "metadata": {
    "wordCount": 1200,
    "estimatedReadTime": "약 5분",
    "seoTips": ["SEO 팁1", "SEO 팁2", "SEO 팁3"]
  }
}`;

function extractJSON(text: string): unknown {
  // 코드 펜스 제거
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : text.trim();

  // 직접 파싱 시도
  try { return JSON.parse(cleaned); } catch {}

  // { ... } 범위 추출 후 파싱
  const start = cleaned.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(cleaned.slice(start, i + 1)); } catch {}
          break;
        }
      }
    }
  }
  throw new Error('JSON not found');
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getGeminiKey(request);
    const body = (await request.json()) as GenerateRequest;

    if (!body.topic?.trim()) {
      return withCors(NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 }));
    }
    if (!body.category) {
      return withCors(NextResponse.json({ error: '콘텐츠 유형을 선택해주세요.' }, { status: 400 }));
    }
    if (!apiKey) {
      return withCors(NextResponse.json(
        { error: 'Gemini API 키가 필요합니다. /settings 페이지에서 API 키를 등록해주세요.' },
        { status: 401 }
      ));
    }

    const categoryLabel = CATEGORY_LABELS[body.category] || body.category;
    const toneDesc = body.tone || '전문적이고 신뢰감 있는';

    const userMessage = `다음 조건에 맞는 ${categoryLabel} 콘텐츠를 생성해주세요.

주제: ${body.topic}
콘텐츠 유형: ${categoryLabel}
톤/스타일: ${toneDesc}
${body.targetKeyword ? `타겟 키워드: ${body.targetKeyword}` : ''}
${body.additionalNotes ? `\n${body.additionalNotes}\n` : ''}
중요 지침:
- 위 참조 자료가 있다면, 그 안의 정보, 데이터, 수치, 사실관계를 적극 반영하여 콘텐츠를 작성하세요.
- 참조 자료의 핵심 내용을 인용하거나 재구성하여 콘텐츠의 신뢰성과 구체성을 높이세요.
- 사용자 요구사항이 있다면 반드시 반영하세요.

GEO/AIO에 최적화된 고품질 콘텐츠를 마크다운 형식으로 작성해주세요.
콘텐츠는 한국어로 작성하며, 최소 1000자 이상이어야 합니다.`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${SYSTEM_PROMPT}\n\n${userMessage}`,
      config: {
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    try {
      const parsed = extractJSON(text);
      return withCors(NextResponse.json(parsed));
    } catch {
      console.error('JSON parse error. Raw response:', text.slice(0, 500));
      return withCors(NextResponse.json(
        { error: '콘텐츠 생성 결과를 파싱할 수 없습니다. 다시 시도해주세요.' },
        { status: 500 }
      ));
    }
  } catch (error: unknown) {
    console.error('Content generation error:', error);
    const msg = error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.';
    if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('401')) {
      return withCors(NextResponse.json({ error: 'Gemini API 키가 유효하지 않습니다. /settings에서 키를 확인해주세요.' }, { status: 401 }));
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return withCors(NextResponse.json({ error: 'Gemini API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 }));
    }
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
