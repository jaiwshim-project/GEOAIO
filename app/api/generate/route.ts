import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import type { GenerateRequest } from '@/lib/types';

export const maxDuration = 60;
export const runtime = 'nodejs';

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

## E-E-A-T 기반 콘텐츠 생성 원칙

### 필수 구조 (반드시 아래 순서로 작성)
1. **도입부**: 업계 통계/문제 제기 + 핵심 정의 (2~3문단)
2. **본문 섹션 5~7개**: 번호 붙은 H2 헤딩 + 각 섹션에 불릿 포인트(*) 3개 이상
3. **구축/실행 단계**: 번호 리스트로 단계별 프로세스 명시
4. **실제 사례 또는 적용 예시**: 구체적 수치·성과 포함
5. **업체 정보 자연 삽입**: 본문 중간에 회사명·대표·지역 자연스럽게 언급
6. **FAQ 섹션**: Q: A: 형식으로 3개 이상
7. **결론 + CTA**: 독자 행동 유도 문장
8. **비교 표**: 장점·단점·고려사항 3열 마크다운 표

### E-E-A-T 신호 (반드시 포함)
- **Experience(경험)**: 실제 사례, 적용 결과, 수치적 성과
- **Expertise(전문성)**: 전문 용어 정의, 심층 메커니즘 설명
- **Authoritativeness(권위)**: 연구 기관·출처 인용 (Gartner, McKinsey 등), 전문가 언급
- **Trustworthiness(신뢰)**: 구체적 통계, FAQ, 장단점 균형 있게 제시

### 콘텐츠 품질 기준
- 분량: **최소 2,000자** (한국어 기준)
- 제목: 숫자·성과 포함 ("95% 달성", "3배 향상" 등 구체적 수치 필수)
- 정의문 필수: "~이란 ~이다", "~의 핵심은 ~이다" 형태
- 해시태그 10개: 본문 마지막에 #키워드 형태로 작성

[중요] 톤/스타일은 제목과 본문 전체에 일관되게 반영되어야 합니다.
- 제목은 톤의 성격을 즉시 드러내는 언어로 작성하세요.
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

  '뉴스/저널리즘 스타일의': `
[톤 가이드 - 뉴스/저널리즘]
- 제목: 육하원칙(누가·무엇을·왜) 압축. 핵심 사실을 앞에 배치. 예) "[주제], 전문가들이 주목하는 3가지 이유", "2024년 [주제] 트렌드: 업계 판도가 바뀐다"
- 도입부: 리드(Lead) 문단 — 가장 중요한 사실을 첫 1~2문장에 압축 전달
- 문체: 3인칭 객관체, 감정 표현 최소화, 인용구("○○ 전문가는 ~라고 밝혔다") 활용
- 구조: 역피라미드(핵심→배경→세부→전망), 소제목은 뉴스 기사 헤드라인 스타일`,

  '교육적이고 강의형의': `
[톤 가이드 - 교육적/강의형]
- 제목: "~하는 방법", "~을 위한 완전 입문", "초보자도 이해하는 ~" 형태. 예) "처음 배우는 [주제]: 개념부터 실전까지 완전 정리"
- 도입부: 학습 목표 명시 ("이 글을 읽고 나면 ~을 할 수 있습니다")
- 문체: 친절하고 명확한 설명체, 어려운 용어는 반드시 풀어서 설명, 예시와 비유 적극 활용
- 구조: 개념 정의 → 왜 중요한가 → 핵심 원리 → 단계별 실습 → 요약 퀴즈/체크리스트`,

  '비교분석 중심의': `
[톤 가이드 - 비교분석형]
- 제목: "A vs B", "~의 차이점", "무엇이 더 나을까?" 형태. 예) "[주제] A vs B: 어떤 것을 선택해야 할까?", "[주제] 비교 분석: 장단점 완전 정리"
- 도입부: 비교 대상을 명확히 제시하고 독자가 왜 이 비교가 필요한지 설명
- 문체: 중립적·객관적, 판단 기준을 명시, 결론에서 상황별 추천 명확히 제시
- 구조: 비교 기준 설정 → 항목별 비교표 → 장단점 분석 → 상황별 추천 → 최종 결론`,

  '사례연구 중심의': `
[톤 가이드 - 사례연구형]
- 제목: 실제 성과·수치·결과를 제목에 포함. 예) "[주제]로 매출 3배 늘린 실제 사례", "○○ 기업이 [주제]를 도입한 뒤 벌어진 일"
- 도입부: 구체적인 사례 주인공(기업·인물·상황)과 핵심 결과를 먼저 제시
- 문체: 스토리 기반이지만 데이터·수치·Before/After 결과 중심, 구체적인 사실 강조
- 구조: 배경(문제 상황) → 선택한 전략/방법 → 실행 과정 → 측정 가능한 결과 → 적용 교훈`,

  '감성적이고 공감하는': `
[톤 가이드 - 감성/공감형]
- 제목: 독자의 감정과 공감대를 자극. 예) "당신이 [주제]에 지쳐있다면 이 글을 읽어보세요", "괜찮아요, [주제] 때문에 힘드셨죠?"
- 도입부: 독자가 공감할 만한 감정·경험·고민을 먼저 언급하며 "나도 알아요"로 시작
- 문체: 따뜻하고 부드러운 2인칭, 위로·격려·응원의 언어, 감각적인 표현과 감정 묘사
- 구조: 공감(당신의 마음을 압니다) → 이해(왜 그럴 수밖에 없는가) → 전환(작은 희망) → 해결(함께하는 방법) → 응원`,
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
    const body = (await request.json()) as GenerateRequest;

    if (!body.topic?.trim()) {
      return withCors(NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 }));
    }
    if (!body.category) {
      return withCors(NextResponse.json({ error: '콘텐츠 유형을 선택해주세요.' }, { status: 400 }));
    }

    // X-API-Provider 헤더로 선택된 AI 우선 적용 (기본값: claude)
    const apiProvider = request.headers.get('X-API-Provider') || 'claude';
    const claudeKey = getClaudeKey(request);
    const geminiKey = getGeminiKey(request);

    if (!claudeKey && !geminiKey) {
      return withCors(NextResponse.json(
        { error: 'Claude 또는 Gemini API 키가 필요합니다. /settings 페이지에서 API 키를 등록해주세요.' },
        { status: 401 }
      ));
    }

    // 사용자가 선택한 AI를 우선 사용
    const useClaudeFirst = apiProvider !== 'gemini';

    const categoryLabel = CATEGORY_LABELS[body.category] || body.category;
    const toneDesc = body.tone || '전문적이고 신뢰감 있는';
    const toneGuide = TONE_GUIDE[toneDesc] || '';

    const companyInfo = [
      body.company_name ? `회사명: ${body.company_name}` : '',
      body.representative_name ? `대표자명: ${body.representative_name}` : '',
      body.region ? `지역: ${body.region}` : '',
    ].filter(Boolean).join('\n');

    // 프로젝트 파일 RAG 컨텍스트
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pFiles = (body as any).projectFiles as { file_name: string; content: string }[] | undefined;
    const hasRag = pFiles && pFiles.length > 0;

    let userMessage: string;

    if (hasRag) {
      // ── RAG 기반 생성: RAG 지식 → E-E-A-T 구조화 콘텐츠 ──
      const ragContent = pFiles!.map(f => `▶ ${f.file_name}\n${f.content}`).join('\n\n');
      userMessage = `[프로젝트 RAG 지식 기반]
아래 문서는 이 프로젝트의 핵심 자료입니다. 이 내용을 1차 지식 기반으로 삼아 E-E-A-T 구조화 콘텐츠를 작성하세요.

${ragContent}

────────────────────────────────────────
[콘텐츠 생성 조건]
주제: ${body.topic}
콘텐츠 유형: ${categoryLabel}
${body.subKeyword ? `분야/카테고리: ${body.subKeyword}` : ''}
톤/스타일: ${toneDesc}
${body.targetKeyword ? `타겟 키워드: ${body.targetKeyword}` : ''}
${companyInfo ? `\n[업체 정보 - 본문에 반드시 포함]\n${companyInfo}\n` : ''}${toneGuide}
${body.additionalNotes ? `\n추가 요청사항:\n${body.additionalNotes}\n` : ''}
[RAG 기반 E-E-A-T 필수 구조]
1. 도입부 (RAG 자료의 핵심 가치·문제 제기 + 업계 통계, 2~3문단)
2. H2 섹션 5~7개 (RAG 핵심 정보를 구조화, 각 섹션에 불릿 * 3개 이상)
3. 단계별 프로세스 (번호 리스트)
4. RAG 기반 실제 사례·수치 (구체적 성과 포함)
5. FAQ (Q: A: 형식 3개 이상, RAG 내용 기반)
6. 결론 + CTA
7. 비교 표 (장점·단점·고려사항 3열 마크다운 표)

[품질 기준]
- 분량: 최소 2,000자
- 제목: "${toneDesc}" 톤 + 수치 포함 (예: "95% 달성", "3배 향상")
- RAG 자료의 사실·수치·표현을 반드시 본문에 녹여 작성
- ${toneDesc} 톤을 제목부터 마지막까지 일관 유지
${companyInfo ? `- 업체 정보(${[body.company_name, body.representative_name, body.region].filter(Boolean).join(', ')})를 본문에 자연스럽게 포함` : ''}`;
    } else {
      // ── 일반 생성 (RAG 없음) ──
      userMessage = `다음 조건에 맞는 ${categoryLabel} 콘텐츠를 생성해주세요.

주제: ${body.topic}
콘텐츠 유형: ${categoryLabel}
${body.subKeyword ? `분야/카테고리: ${body.subKeyword}` : ''}
톤/스타일: ${toneDesc}
${body.targetKeyword ? `타겟 키워드: ${body.targetKeyword}` : ''}
${companyInfo ? `\n[업체 정보 - 본문에 반드시 포함]\n${companyInfo}\n` : ''}${toneGuide}
${body.additionalNotes ? `\n추가 요청사항:\n${body.additionalNotes}\n` : ''}
[필수 사항]
- 제목은 위의 톤 가이드에 맞게 작성하세요.
- 본문 전체의 문체·구조·어조가 "${toneDesc}" 톤을 일관되게 반영해야 합니다.
- GEO/AIO에 최적화된 고품질 콘텐츠를 작성해주세요.
${companyInfo ? `- 업체 정보(${[body.company_name, body.representative_name, body.region].filter(Boolean).join(', ')})를 본문 내용에 자연스럽게 반드시 포함하세요.` : ''}`;
    }

    let text = '';
    let lastError: Error | null = null;

    // Gemini 선택 시 먼저 Gemini 시도
    if (!useClaudeFirst && geminiKey) {
      try {
        console.log('[API] Gemini 우선 선택으로 콘텐츠 생성');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: { systemInstruction: SYSTEM_INSTRUCTION, maxOutputTokens: 6000, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
        });
        text = response.text || '';
        console.log('[API] Gemini 성공');
      } catch (geminiError: unknown) {
        lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        console.log('[API] Gemini 실패, Claude로 폴백:', lastError.message);
        if (claudeKey) {
          const client = new Anthropic({ apiKey: claudeKey });
          const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514', max_tokens: 3000,
            messages: [{ role: 'user', content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:\n{"title":"제목","content":"마크다운 본문","hashtags":["#태그1"],"metadata":{"wordCount":1000,"estimatedReadTime":"약 5분","seoTips":["팁1"]}}` }],
          });
          text = message.content[0].type === 'text' ? message.content[0].text : '';
        } else throw lastError;
      }
    }

    // 선택된 AI 우선 시도, 실패 시 자동 폴백
    if (useClaudeFirst && claudeKey) {
      try {
        console.log('[API] Claude로 콘텐츠 생성 시도');
        const client = new Anthropic({ apiKey: claudeKey });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          messages: [
            {
              role: 'user',
              content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:\n{"title":"제목","content":"마크다운 본문","hashtags":["#태그1","#태그2"],"metadata":{"wordCount":1000,"estimatedReadTime":"약 5분","seoTips":["팁1","팁2","팁3"]}}`,
            },
          ],
        });
        text = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log('[API] Claude 성공');
      } catch (claudeError: unknown) {
        lastError = claudeError instanceof Error ? claudeError : new Error(String(claudeError));
        console.log('[API] Claude 실패, Gemini로 폴백:', lastError.message);

        // Claude 실패 → Gemini로 폴백
        if (geminiKey) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: userMessage,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                maxOutputTokens: 6000,
                responseMimeType: 'application/json',
                responseSchema: RESPONSE_SCHEMA,
              },
            });
            text = response.text || '';
            console.log('[API] Gemini 성공');
          } catch (geminiError: unknown) {
            console.error('[API] Gemini도 실패:', geminiError);
            throw lastError;
          }
        } else {
          throw lastError;
        }
      }
    } else if (geminiKey) {
      // Gemini 우선 선택 또는 Claude 없을 때 Gemini 시도
      try {
        console.log('[API] Gemini로 콘텐츠 생성 시도');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 6000,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });
        text = response.text || '';
        console.log('[API] Gemini 성공');
      } catch (geminiError: unknown) {
        lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        console.log('[API] Gemini 실패, Claude로 폴백:', lastError.message);

        // Gemini 실패 → Claude로 폴백
        if (claudeKey) {
          try {
            const client = new Anthropic({ apiKey: claudeKey });
            const message = await client.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 6000,
              messages: [
                {
                  role: 'user',
                  content: `${SYSTEM_INSTRUCTION}\n\n${userMessage}\n\n반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:\n{"title":"제목","content":"마크다운 본문","hashtags":["#태그1","#태그2"],"metadata":{"wordCount":1000,"estimatedReadTime":"약 5분","seoTips":["팁1","팁2","팁3"]}}`,
                },
              ],
            });
            text = message.content[0].type === 'text' ? message.content[0].text : '';
            console.log('[API] Claude 성공');
          } catch (claudeError: unknown) {
            console.error('[API] Claude도 실패:', claudeError);
            throw lastError;
          }
        } else {
          throw lastError;
        }
      }
    }

    // JSON 추출 — 코드블록 / 앞뒤 텍스트 / 순수 JSON 모두 처리
    let parsed: unknown;
    try {
      // 1순위: 코드블록 안 JSON
      const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (blockMatch) {
        parsed = JSON.parse(blockMatch[1].trim());
      } else {
        // 2순위: 첫 { 부터 마지막 } 까지 추출
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          parsed = JSON.parse(text.slice(start, end + 1));
        } else {
          parsed = JSON.parse(text.trim());
        }
      }
    } catch {
      // 3순위: Claude가 JSON을 못 만든 경우 — 텍스트를 그대로 content로 감싸서 반환
      const wordCount = text.length;
      parsed = {
        title: '생성된 콘텐츠',
        content: text,
        hashtags: [],
        metadata: {
          wordCount,
          estimatedReadTime: `약 ${Math.ceil(wordCount / 500)}분`,
          seoTips: ['콘텐츠를 검토하고 필요 시 수정하세요.'],
        },
      };
    }
    return withCors(NextResponse.json(parsed));

  } catch (error: unknown) {
    console.error('Content generation error:', error);
    const msg = error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.';

    // 더 정확한 오류 분류
    if (msg.includes('Gemini') && (msg.includes('401') || msg.includes('authentication'))) {
      return withCors(NextResponse.json({ error: 'Gemini API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('Claude') && (msg.includes('401') || msg.includes('authentication'))) {
      return withCors(NextResponse.json({ error: 'Claude API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return withCors(NextResponse.json({ error: 'API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 }));
    }
    if (msg.includes('model') && msg.includes('not found')) {
      return withCors(NextResponse.json({ error: 'API 모델이 더 이상 사용 가능하지 않습니다. 관리자에게 문의해주세요.' }, { status: 400 }));
    }
    return withCors(NextResponse.json({ error: msg || '콘텐츠 생성 중 오류가 발생했습니다.' }, { status: 500 }));
  }
}

// v1777031107 - Cache bust
