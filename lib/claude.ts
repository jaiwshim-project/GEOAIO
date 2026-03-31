import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisRequest, AnalysisResponse, OptimizeRequest, OptimizeResponse, GenerateRequest, GenerateResponse } from './types';

function getClient(apiKey?: string) {
  return new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });
}

const SYSTEM_PROMPT = `당신은 AIO(AI Overview)와 GEO(Generative Engine Optimization) 전문 콘텐츠 분석가입니다.
사용자가 제공하는 콘텐츠를 분석하여 AI 검색엔진에서의 노출 및 인용 가능성을 평가합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "overallScore": 0-100,
  "aio": {
    "total": 0-100,
    "structuredAnswer": 0-100,
    "clarity": 0-100,
    "citability": 0-100,
    "aiOverviewProbability": 0-100,
    "details": [
      {
        "category": "카테고리명",
        "score": 0-100,
        "description": "설명",
        "suggestions": ["제안1", "제안2"]
      }
    ]
  },
  "geo": {
    "total": 0-100,
    "aiSearchFriendliness": 0-100,
    "eeat": {
      "experience": 0-100,
      "expertise": 0-100,
      "authoritativeness": 0-100,
      "trustworthiness": 0-100
    },
    "structuredData": 0-100,
    "semanticCompleteness": 0-100,
    "details": [
      {
        "category": "카테고리명",
        "score": 0-100,
        "description": "설명",
        "suggestions": ["제안1", "제안2"]
      }
    ]
  },
  "keywords": {
    "primaryKeywords": [
      {"keyword": "키워드", "count": 5, "density": 2.1, "prominence": "high"}
    ],
    "relatedKeywords": ["관련키워드1", "관련키워드2"],
    "longTailOpportunities": ["롱테일1", "롱테일2"],
    "density": [
      {"keyword": "키워드", "percentage": 2.1, "optimal": true}
    ],
    "placementSuggestions": ["제안1", "제안2"]
  },
  "recommendations": [
    {
      "id": "rec-1",
      "priority": "high|medium|low",
      "category": "aio|geo|keyword|structure|content",
      "title": "제목",
      "description": "설명",
      "before": "수정 전 (선택)",
      "after": "수정 후 (선택)",
      "expectedImpact": "예상 효과"
    }
  ]
}

평가 기준:
- AIO 점수: 구조화된 답변(FAQ, How-to, 리스트), 명확성, 인용 가능성, AI Overview 노출 확률
- GEO 점수: AI 검색엔진 친화도, E-E-A-T 신호, 구조화 데이터, 의미적 완성도
- 키워드: 주요 키워드 추출, 밀도, 관련 키워드, 롱테일 기회
- 제안: 우선순위별 구체적 개선 방안 (before/after 포함)`;

export async function analyzeContent(request: AnalysisRequest, apiKey?: string): Promise<AnalysisResponse> {
  const userMessage = buildUserMessage(request);

  const message = await getClient(apiKey).messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userMessage }
    ],
  });

  const textBlock = message.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('분석 응답을 받지 못했습니다.');
  }

  try {
    const parsed = JSON.parse(extractJSON(textBlock.text)) as AnalysisResponse;
    return parsed;
  } catch (e) {
    console.error('JSON parse error, raw text:', textBlock.text.slice(0, 200));
    throw new Error('분석 결과를 파싱할 수 없습니다. 다시 시도해주세요.');
  }
}

function extractJSON(text: string): string {
  // ```json ... ``` 코드블록 제거
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let json = match ? match[1].trim() : text.trim();

  // JSON이 잘린 경우 복구 시도
  try {
    JSON.parse(json);
    return json;
  } catch {
    // 잘린 문자열 닫기 시도: 마지막 열린 문자열/배열/객체를 닫아줌
    let fixed = json;
    // 끝에 불완전한 문자열이 있으면 닫기
    const lastQuote = fixed.lastIndexOf('"');
    const afterLastQuote = fixed.slice(lastQuote + 1).trim();
    if (afterLastQuote === '' || afterLastQuote === ',') {
      fixed = fixed.slice(0, lastQuote + 1);
    }
    // 열린 괄호 수만큼 닫아주기
    const opens = (fixed.match(/\{/g) || []).length;
    const closes = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
    for (let i = 0; i < opens - closes; i++) fixed += '}';

    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      // 복구 실패 시 원본 반환
      return json;
    }
  }
}

function buildUserMessage(request: AnalysisRequest): string {
  let message = `다음 콘텐츠를 GEO/AIO 관점에서 분석해주세요.\n\n`;

  if (request.targetKeyword) {
    message += `타겟 키워드: ${request.targetKeyword}\n`;
  }
  if (request.url) {
    message += `콘텐츠 URL: ${request.url}\n`;
  }

  message += `\n분석 유형: ${request.analysisType}\n`;
  message += `\n--- 콘텐츠 시작 ---\n${request.content}\n--- 콘텐츠 끝 ---`;

  return message;
}

// === AI 최적화 변환 ===

const OPTIMIZE_SYSTEM_PROMPT = `당신은 AIO(AI Overview)와 GEO(Generative Engine Optimization) 전문 콘텐츠 최적화 작가입니다.
사용자가 제공하는 원본 콘텐츠와 분석 결과를 바탕으로, AI 검색엔진에 최적화된 버전으로 콘텐츠를 변환합니다.

최적화 원칙:
1. 원본의 핵심 메시지와 의미를 보존하면서 AI 검색 친화적으로 재구성
2. 구조화된 형식 활용 (명확한 헤딩, 번호/불릿 리스트, Q&A 형식)
3. 핵심 정보를 상단에 배치 (역피라미드 구조)
4. 간결하고 명확한 문장으로 작성 (AI가 인용하기 쉬운 형태)
5. 통계, 수치, 출처 등 신뢰 신호 강화
6. E-E-A-T 요소 강화 (경험, 전문성, 권위, 신뢰)
7. FAQ 섹션 추가로 AI Overview 노출 확률 증가
8. 의미적 완성도를 높여 관련 검색어에도 노출되도록 함

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "optimizedContent": "최적화된 전체 콘텐츠 (마크다운 형식)",
  "changeSummary": ["변경사항 1", "변경사항 2", ...],
  "expectedScoreImprovement": {
    "aio": 예상_AIO_점수(0-100),
    "geo": 예상_GEO_점수(0-100),
    "overall": 예상_종합_점수(0-100)
  }
}`;

export async function optimizeContent(request: OptimizeRequest, apiKey?: string): Promise<OptimizeResponse> {
  const recommendationsSummary = request.recommendations
    .map(r => `[${r.priority}] ${r.title}: ${r.description}`)
    .join('\n');

  const userMessage = `다음 콘텐츠를 AI 검색엔진에 최적화된 버전으로 변환해주세요.

현재 분석 점수:
- AIO 점수: ${request.aioScore}/100
- GEO 점수: ${request.geoScore}/100

${request.targetKeyword ? `타겟 키워드: ${request.targetKeyword}\n` : ''}
분석에서 나온 개선 제안:
${recommendationsSummary}

--- 원본 콘텐츠 시작 ---
${request.originalContent}
--- 원본 콘텐츠 끝 ---

위 개선 제안을 모두 반영하여 콘텐츠를 최적화해주세요. 원본의 핵심 의미는 유지하되, AI 검색엔진이 이해하고 인용하기 쉬운 형태로 변환해주세요.`;

  const message = await getClient(apiKey).messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    system: OPTIMIZE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = message.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('최적화 응답을 받지 못했습니다.');
  }

  try {
    const parsed = JSON.parse(extractJSON(textBlock.text)) as OptimizeResponse;
    return parsed;
  } catch (e) {
    console.error('JSON parse error, raw text:', textBlock.text.slice(0, 200));
    throw new Error('최적화 결과를 파싱할 수 없습니다. 다시 시도해주세요.');
  }
}

// === 콘텐츠 생성 ===

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

const GENERATE_SYSTEM_PROMPT = `당신은 AIO(AI Overview)와 GEO(Generative Engine Optimization) 전문 콘텐츠 작가입니다.
사용자가 요청하는 유형의 콘텐츠를 AI 검색엔진에 최적화된 형태로 생성합니다.

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
  "hashtags": ["#해시태그1", "#해시태그2", ... "#해시태그10"],
  "metadata": {
    "wordCount": 예상_글자수,
    "estimatedReadTime": "약 N분",
    "seoTips": ["SEO 팁1", "SEO 팁2", "SEO 팁3"]
  }
}

hashtags 규칙:
- 콘텐츠의 핵심 키워드와 관련 토픽을 기반으로 10개의 해시태그 생성
- 소셜 미디어 공유 시 발견성을 높이는 태그로 구성
- 반드시 # 기호로 시작
- 한국어 태그와 영어 태그를 적절히 혼합`;

export async function generateContent(request: GenerateRequest, apiKey?: string): Promise<GenerateResponse> {
  const categoryLabel = CATEGORY_LABELS[request.category] || request.category;
  const toneDesc = request.tone || '전문적이고 신뢰감 있는';

  const userMessage = `다음 조건에 맞는 ${categoryLabel} 콘텐츠를 생성해주세요.

주제: ${request.topic}
콘텐츠 유형: ${categoryLabel}
톤/스타일: ${toneDesc}
${request.targetKeyword ? `타겟 키워드: ${request.targetKeyword}` : ''}
${request.additionalNotes ? `\n${request.additionalNotes}\n` : ''}
중요 지침:
- 위 참조 자료가 있다면, 그 안의 정보, 데이터, 수치, 사실관계를 적극 반영하여 콘텐츠를 작성하세요.
- 참조 자료의 핵심 내용을 인용하거나 재구성하여 콘텐츠의 신뢰성과 구체성을 높이세요.
- 사용자 요구사항이 있다면 반드시 반영하세요.

GEO/AIO에 최적화된 고품질 콘텐츠를 마크다운 형식으로 작성해주세요.
콘텐츠는 한국어로 작성하며, 최소 1000자 이상이어야 합니다.`;

  const message = await getClient(apiKey).messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16384,
    system: GENERATE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = message.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('콘텐츠 생성 응답을 받지 못했습니다.');
  }

  try {
    const parsed = JSON.parse(extractJSON(textBlock.text)) as GenerateResponse;
    return parsed;
  } catch (e) {
    console.error('JSON parse error, raw text:', textBlock.text.slice(0, 200));
    throw new Error('콘텐츠 생성 결과를 파싱할 수 없습니다. 다시 시도해주세요.');
  }
}
