import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsOptionsResponse();
}

// ⭐ Phase 3: 주제별 RAG 자료 자동 보강
// 사용자 입력 topic + intent → critique/trend/urgency/pain-point 보강 글 자동 생성
// 본 글 생성 전에 RAG로 추가하여 Spoke 글들이 일반 카탈로그로 회귀하지 않도록.

type SupplementIntent = 'critique' | 'trend' | 'urgency' | 'pain-point';

const SUPPLEMENT_PROMPT_TEMPLATES: Record<SupplementIntent, (topic: string) => string> = {
  'critique': (topic: string) => `당신은 "${topic}" 분야의 균형 잡힌 시각을 가진 전문가입니다.
이 주제의 솔직한 한계·약점·실패 사례·안 통하는 상황을 5가지로 정리한 1500~2000자 분량의 마크다운 글을 작성하세요.

[필수 키워드 — 단락마다 자주 사용]
한계, 실패, 약점, 단점, 못하다, 안 된다, 주의, 제약, 리스크, 부작용, 오해, 보완책

[형식 — 정확히 따라]
# ${topic}의 한계와 솔직한 5가지 약점

(도입 2문단: 이 주제의 일반적 인식과 그 한계의 의미)

## 한계 1: [구체적 한계명]
(2~3문단 + "한계", "약점" 등 키워드 포함)
핵심 약점: ...

## 한계 2: ...
(반복 패턴)

## 한계 3: ...
## 한계 4: ...
## 한계 5: ...

## 결론: 한계를 인정하는 것이 진짜 신뢰

⚠️ 절대 해당 주제를 찬양하지 말 것. 솔직한 한계만 다룰 것.
⚠️ 마크다운만 출력, 인사말·메타텍스트·"네 알겠습니다" 같은 표현 일체 금지.
⚠️ 첫 글자는 반드시 '#'으로 시작.`,

  'trend': (topic: string) => `당신은 "${topic}" 분야의 시장 동향 분석가입니다.
이 주제의 2026~2027년 시장 동향, 향후 전망, 주요 변화를 1500~2000자 분량의 마크다운 글로 작성하세요.

[필수 키워드 — 단락마다 자주 사용]
최근, 동향, 트렌드, 발표, 2026, 2027, 전망, 향후, 미래, 시장, 통계, 예측, 시점성, 변화

[형식 — 정확히 따라]
# 2026~2027 ${topic} 시장 동향과 향후 전망

(도입 2문단: 최근 시장 변화의 큰 그림)

## 2026년 현재 ${topic} 시장 동향
(통계·수치·발표 자료 인용 형식으로 작성, "동향" 키워드 자주)
핵심 동향: ...

## ${topic} 분야의 정책 변화 트렌드
(2026년 들어 어떤 변화가 있었는지)

## 한국 시장의 ${topic} 향후 전망
(한국 시장 특수성과 전망)

## 향후 12개월 핵심 전망 5가지
(2027년 상반기까지 예측)

## 운영자가 주목해야 할 시점성 신호

⚠️ 추측이라도 자신감 있게 트렌드를 다룰 것. 일반 정의·원리 설명 금지.
⚠️ 마크다운만 출력, 인사말 금지, 첫 글자는 '#'.`,

  'urgency': (topic: string) => `당신은 "${topic}" 분야의 전략 컨설턴트입니다.
"${topic}"를 지금 시작하지 않으면 3개월/6개월/12개월 후 어떤 일이 벌어지는지 시간순 시나리오를 1500~2000자 분량의 마크다운 글로 작성하세요.

[필수 키워드 — 단락마다 자주 사용]
시간, 시나리오, 위기, 긴급, 기한, 놓치, 늦, 뒤처, 도태, 경쟁, 지금, 당장, 시급, 골든타임

[형식 — 정확히 따라]
# 지금 ${topic} 안 하면 일어나는 12개월 시나리오

(도입 2문단: 시간 흐름의 위기 의식)

## 3개월 후 시나리오: [구체적 변화]
(경쟁사가 무엇을 선점하는가, 시간 격차 강조)
핵심 시나리오: ...

## 6개월 후 시나리오: 격차의 고착
(회복이 어려워지는 시점)

## 12개월 후 시나리오: [최악의 결과]
(지금 안 하면 도래하는 위기)

## 놓친 비용 추산: 시간이 곧 돈이다
(정량적 추산)

## 지금 시작 시 회복 가능성: 골든타임은 짧다
(지금 시작하면 가능한 회복 경로)

⚠️ 시간축 시나리오만 다룰 것. 일반 정의·원리·기능 설명 금지.
⚠️ 마크다운만 출력, 인사말 금지, 첫 글자는 '#'.`,

  'pain-point': (topic: string) => `당신은 "${topic}" 분야의 입문자 멘토입니다.
"${topic}" 입문자가 자주 하는 5가지 오해와 실수를 1500~2000자 분량의 마크다운 글로 작성하세요.

[필수 키워드 — 단락마다 자주 사용]
어려움, 오해, 실수, 문제, 고민, 답답, 막막, 잘못된, 놓치는, 빠지, 좌절, 인식

[형식 — 정확히 따라]
# ${topic} 입문자가 자주 하는 5가지 오해와 실수

(도입 2문단: 입문자가 흔히 빠지는 함정)

## 오해 1: "[잘못된 인식 한 줄]"
(왜 잘못됐는지 + 실제로 어떻게 접근해야 하는지)
핵심 오해: ...

## 오해 2: "[다른 잘못된 인식]"
(반복 패턴)

## 오해 3: ...
## 오해 4: ...
## 오해 5: ...

## 다섯 가지 오해를 넘어서기 위한 첫걸음

⚠️ 입문자 관점의 오해·실수만 다룰 것. 전문 정의·원리 설명 금지.
⚠️ 각 오해는 구체적 인용문 형태로(따옴표 포함).
⚠️ 마크다운만 출력, 인사말 금지, 첫 글자는 '#'.`,
};

const SYSTEM_INSTRUCTION = `당신은 RAG(Retrieval-Augmented Generation) 보강 자료 생성 전문가입니다.
사용자가 입력한 주제에 대해, 메인 콘텐츠 생성 시 참고할 보강 RAG 자료를 작성합니다.

핵심 원칙:
1. 사용자 입력 topic을 그대로 사용 (변형 금지)
2. 요청된 intent 관점에서만 작성 (다른 intent로 회귀 금지)
3. 1500~2000자 분량, 마크다운 형식
4. 첫 글자는 반드시 '#'
5. 인사말·메타텍스트("네", "알겠습니다", "이렇게 작성했습니다" 등) 절대 금지
6. 코드블록(\`\`\`) 사용 금지`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, intent } = body as { topic: string; intent: SupplementIntent };

    if (!topic?.trim()) {
      return withCors(NextResponse.json({ error: 'topic이 필요합니다.' }, { status: 400 }));
    }
    if (!intent || !SUPPLEMENT_PROMPT_TEMPLATES[intent]) {
      return withCors(NextResponse.json({ error: 'intent는 critique/trend/urgency/pain-point 중 하나여야 합니다.' }, { status: 400 }));
    }

    const geminiKey = getGeminiKey(request);
    if (!geminiKey) {
      return withCors(NextResponse.json(
        { error: 'Gemini API 키가 필요합니다.' },
        { status: 401 }
      ));
    }

    const userPrompt = SUPPLEMENT_PROMPT_TEMPLATES[intent](topic.trim());

    try {
      console.log(`[RAG보강] 생성 시작 — intent=${intent}, topic="${topic.slice(0, 30)}..."`);
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 4000,
        },
      });
      const text = response.text || '';
      console.log(`[RAG보강] ${intent} 응답 ${text.length}자`);

      if (text.length < 500) {
        console.warn(`[RAG보강] ${intent} 응답 너무 짧음 (${text.length}자)`);
        return withCors(NextResponse.json(
          { error: `${intent} 보강 글이 너무 짧습니다.` },
          { status: 422 }
        ));
      }

      return withCors(NextResponse.json({
        intent,
        topic,
        content: text.trim(),
        wordCount: text.length,
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[RAG보강] ${intent} 실패:`, msg);
      return withCors(NextResponse.json(
        { error: `${intent} 보강 생성 실패: ${msg}` },
        { status: 500 }
      ));
    }
  } catch (error) {
    console.error('[RAG보강] 오류:', error);
    const msg = error instanceof Error ? error.message : '보강 생성 중 오류';
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
