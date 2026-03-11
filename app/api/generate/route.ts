import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
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

const SYSTEM_INSTRUCTION = `당신은 AIO(AI Overview)와 GEO(Generative Engine Optimization) 전문 콘텐츠 작가입니다.

콘텐츠 생성 원칙:
1. 역피라미드 구조: 핵심 정보를 상단에 배치
2. 구조화된 형식: 명확한 헤딩(H2, H3), 번호/불릿 리스트, 표 활용
3. AI 인용 친화적: 간결하고 명확한 정의문, 통계, 단계별 설명
4. E-E-A-T 신호 내장: 경험, 전문성, 권위, 신뢰 요소 포함
5. FAQ 섹션 포함: AI Overview 노출 확률 증가
6. 의미적 완성도: 관련 검색어와 롱테일 키워드 자연스럽게 포함
7. 인용 가능한 문장: "~이란 ~이다", "~의 핵심은 ~이다" 형태의 정의문 활용
8. 콘텐츠는 반드시 한국어로 작성하고 최소 1000자 이상이어야 합니다.

[중요] 톤/스타일은 제목과 본문 전체에 일관되게 반영되어야 합니다.
- 제목은 톤의 성격을 즉시 드러내는 언어로 작성하세요 (단순히 주제를 반복하지 마세요).
- 같은 주제라도 톤에 따라 제목 형식, 도입부 문체, 구조, 어조가 완전히 달라야 합니다.`;

const TONE_GUIDE: Record<string, string> = {
  '전문적이고 신뢰감 있는': `
[톤 가이드 - 전문적/신뢰]
- 제목: 수치·통계·"완벽 가이드"·"전문가 분석"·"심층 리뷰" 등 권위 키워드 포함. 예) "[주제] 완벽 분석: 전문가가 알려주는 핵심 전략"
- 도입부: 업계 통계나 전문적 정의로 시작
- 문체: 3인칭·격식체, 수동형 표현 지양, 능동적 전문 용어 사용
- 구조: 데이터·근거·출처 중심, 표와 수치 적극 활용`,

  '친근하고 대화체의': `
[톤 가이드 - 친근/대화체]
- 제목: 2인칭 질문형·공감형 표현 사용. 예) "혹시 [주제] 때문에 고민이세요? 이렇게 하면 돼요!", "저도 처음엔 몰랐던 [주제] 꿀팁"
- 도입부: 독자에게 직접 말 걸기 ("안녕하세요!", "혹시 이런 경험 있으신가요?")
- 문체: 구어체, 이모지 1~2개 허용, 짧은 문장, 반말투 지양하되 부드러운 존댓말
- 구조: 개인 경험담 → 공감 → 해결책 흐름`,

  '설득력 있고 강렬한': `
[톤 가이드 - 설득/강렬]
- 제목: 긴박감·희소성·손실 회피 심리 활용. 예) "지금 당장 [주제]를 바꾸지 않으면 뒤처집니다", "이것만 알면 [주제] 문제 끝"
- 도입부: 충격적 사실·도전적 질문·위기감 조성으로 시작
- 문체: 짧고 강렬한 문장, 명령형·청유형 사용, 감정 자극 언어
- 구조: 문제 → 위기 강조 → 해결책 → 지금 행동하라는 CTA`,

  '간결하고 명확한': `
[톤 가이드 - 간결/명확]
- 제목: 최대한 짧고 직접적. 핵심 키워드만. 예) "[주제]: 3단계 핵심 요약", "[주제] 완전 정리"
- 도입부: 1~2문장으로 요점만 전달
- 문체: 불필요한 수식어 제거, 능동태, 짧은 단문, 군더더기 없음
- 구조: 번호 리스트·표·요약 박스 중심, 긴 설명 대신 핵심만`,

  '스토리텔링 중심의': `
[톤 가이드 - 스토리텔링]
- 제목: 서사적·감성적·호기심 유발형. 예) "[주제]를 포기하려던 그날, 모든 것이 바뀌었다", "한 번의 선택이 [주제]를 바꾼 이야기"
- 도입부: 구체적인 장면·인물·상황으로 시작 (영화 도입부처럼)
- 문체: 1인칭 또는 3인칭 서술, 감각적 묘사, 감정 이입 유도
- 구조: 발단 → 갈등 → 전환점 → 해결 → 독자에게 적용`,
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: '콘텐츠 제목' },
    content: { type: Type.STRING, description: '마크다운 형식의 전체 콘텐츠 (최소 1000자)' },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '관련 해시태그 10개 (#포함)',
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        wordCount: { type: Type.NUMBER, description: '글자 수' },
        estimatedReadTime: { type: Type.STRING, description: '예상 읽기 시간 (예: 약 5분)' },
        seoTips: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'SEO 최적화 팁 3가지',
        },
      },
      required: ['wordCount', 'estimatedReadTime', 'seoTips'],
    },
  },
  required: ['title', 'content', 'hashtags', 'metadata'],
};

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
    const toneGuide = TONE_GUIDE[toneDesc] || '';

    const userMessage = `다음 조건에 맞는 ${categoryLabel} 콘텐츠를 생성해주세요.

주제: ${body.topic}
콘텐츠 유형: ${categoryLabel}
톤/스타일: ${toneDesc}
${body.targetKeyword ? `타겟 키워드: ${body.targetKeyword}` : ''}
${toneGuide}
${body.additionalNotes ? `\n추가 요청사항:\n${body.additionalNotes}\n` : ''}
[필수 사항]
- 제목은 위의 톤 가이드에 맞게 작성하세요. 단순히 주제를 그대로 사용하지 마세요.
- 본문 전체의 문체·구조·어조가 "${toneDesc}" 톤을 일관되게 반영해야 합니다.
- GEO/AIO에 최적화된 고품질 콘텐츠를 작성해주세요.`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return withCors(NextResponse.json(parsed));

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
