import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import Anthropic from '@anthropic-ai/sdk';
import { injectProjectLinks } from '@/lib/inject-project-links';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsOptionsResponse();
}

const EEAT_INSTRUCTION = `당신은 E-E-A-T 콘텐츠 구조화 전문가입니다.

주어진 마크다운 콘텐츠를 아래 E-E-A-T 7단계 구조로 재구성하세요.
내용은 원본을 최대한 보존하되, 구조를 정확히 따라야 합니다.

## E-E-A-T 7단계 필수 구조

1. **도입부** (## 없이 첫 문단들)
   - 업계 통계 또는 충격적 사실로 시작
   - 핵심 개념 정의 ("~이란 ~이다" 형태)
   - 2~3문단

2. **## 1. [섹션명]** ~ **## 5~7. [섹션명]**
   - 각 섹션마다 2~3문단 + 불릿(*) 3개 이상
   - E-E-A-T 신호 포함: 수치, 통계, 전문 용어

3. **## 단계별 실행 가이드** (번호 리스트)
   1. 단계1
   2. 단계2
   3. 단계3

4. **## 실제 적용 사례** (구체적 수치·Before/After)

5. **## FAQ**
   **Q: [질문1]?**
   A: [답변1]

   **Q: [질문2]?**
   A: [답변2]

   **Q: [질문3]?**
   A: [답변3]

6. **## 결론** (요약 + CTA)

7. **비교표** (마지막에 위치)
   | 장점 | 단점 | 고려 사항 |
   |------|------|-----------|
   | 장점1 | 단점1 | 고려1 |
   | 장점2 | 단점2 | 고려2 |
   | 장점3 | 단점3 | 고려3 |

⚠️ FAQ 섹션과 비교 표는 반드시 포함. 생략 절대 금지.
⚠️ 전체 분량: 최소 2,000자 이상
⚠️ 원본의 톤/문체를 그대로 유지

🚨 [절대 준수 — 사실 정보 보존] 🚨
- 원본에 있는 회사명·대표자명·원장명·주소·전화번호·이메일 등은 **정확히 그대로 보존** (변경·축약 금지)
- 원본에 있는 숫자·수치·통계는 **그대로 인용** (변경·추측·추가 금지)
- 원본에 없는 숫자(예: "95% 달성", "3배 향상")는 **절대 추가하지 마세요**
- 원본에 없는 회사 정보(전화번호·자격증·연도 등)는 **임의로 만들지 마세요**
- 일반론적 표현 사용 가능: "많은 환자들이", "다수의 사례에서", "오랜 경험"
⚠️ 정확하지 않은 숫자는 신뢰도를 무너뜨립니다. RAG/원본에 있는 것만 인용하세요.

## ⭐ AI 인용률 극대화 3대 원칙 (재구성 시 반드시 적용)

**원칙 1. 작성자 권위 신호 자동 삽입**
- 도입부 첫 문단에 작성자/회사 신뢰 신호: "본 글은 [회사명·대표명·경력] 기반"
- 결론 마지막에 회사 권위 정보: "[회사명]은 [지역]에서 [성과] 달성"
- 원본에 회사·대표 정보가 있으면 그대로 활용

**원칙 2. AI 인용 가능 정의문 의무화**
각 H2 섹션 첫 문장은 다음 중 하나의 명제형 정의문으로 시작:
- "X란 ~이다" / "X의 핵심은 ~이다" / "X는 Y를 의미한다"
- "[기관] 보고서에 따르면, X의 Y%가 ~"
→ AI Overview·Perplexity가 이런 단문을 우선 인용

**원칙 3. AI 추출 친화적 구조**
- 단계: 번호 리스트(1. 2. 3.) 명시적 구조
- 비교: 표(헤더 + 구분선) 정확한 형식
- FAQ: "**Q: ~?**\\nA: ~" 마크다운 강조
- 수치: 명시적 숫자(40%, 3배, 8시간 등)`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title, tone, topic, continuation, previousContent, homepage_url, blog_url, company_name } = body;

    if (!content && !continuation) {
      return withCors(NextResponse.json({ error: 'content 필요' }, { status: 400 }));
    }

    // Claude 단독 사용 (EEAT 7단계 변환 전용). md 초안 생성은 별도 API(/api/generate)에서 Gemini 단독 호출.
    const claudeKey = getClaudeKey(request);
    const geminiKey = getGeminiKey(request);
    void geminiKey; // geminiKey는 이 라우트에서 사용하지 않음 (다른 라우트가 동일 라이브러리 import 시 안전성 유지)

    if (!claudeKey) {
      return withCors(NextResponse.json(
        { error: 'Claude API 키가 필요합니다.' },
        { status: 401 }
      ));
    }

    // ── 이어쓰기 모드: 잘린 콘텐츠를 마저 작성 ──
    const isContinuation = !!(continuation && previousContent);
    const prompt = isContinuation
      ? `당신은 E-E-A-T 콘텐츠 마무리 전문가입니다.
아래 콘텐츠가 중간에 잘려서 미완성 상태입니다. **이어서 작성**하여 누락된 섹션들을 마무리하세요.

📋 누락 섹션 식별 가이드 (반드시 출력 전 점검):
- 원본에 "## FAQ" 또는 "**Q:" 가 있는가? 없으면 → FAQ 3개 이상 추가
- 원본에 마크다운 표(| ~ | 형태)가 있는가? 없으면 → 장점·단점·고려사항 3열 비교표 추가
- 원본에 "## 결론" 또는 "## 마치며" 가 있는가? 없으면 → 결론 섹션 + CTA 추가
- 원본 끝에 #으로 시작하는 해시태그 10개 라인이 있는가? 없으면 → 해시태그 10개 마지막 줄에 추가
- 마지막 문장이 종결 부호로 안 끝나면 → 자연스럽게 이어 마무리

⚠️ **절대 규칙:**
1. **원본 마지막 문장을 자연스럽게 이어가세요** (광고 블록·해시태그가 본문 중간에 나와도 본문 흐름 우선)
2. **이미 작성된 섹션은 절대 다시 쓰지 마세요** — 위 가이드의 "없으면" 케이스만 추가
3. **빈 응답 절대 금지** — 누락이 진짜로 0개여도 최소한 결론 단락 1개라도 작성
4. 톤: ${tone || '전문적'} 유지 (교육형이면 단계 설명·비유, 친근형이면 대화체 등)
5. 분량: 누락된 만큼 충분히 (보통 600~1500자, 모든 섹션 누락 시 더)
6. 출력은 **이어쓸 부분만**, 원본을 다시 쓰지 마세요. 인사말·설명·"네, 이어쓰겠습니다" 같은 메타텍스트 금지.

원본 (충분한 컨텍스트 — 마지막 3000자):
---
${previousContent.slice(-3000)}
---

위 끝부분에서 시작해서, 누락된 섹션을 모두 완성하세요. 마크다운 텍스트만 출력.`
      : `[원본 콘텐츠 - 아래 내용을 E-E-A-T 7단계로 재구성하세요]
제목: ${title || topic || ''}
톤: ${tone || '전문적'}

${content}
---

위 내용을 E-E-A-T 7단계 구조로 재구성한 마크다운을 출력하세요.
제목은 수치가 포함된 강력한 문장으로 개선하세요.
⭐ 분량: 1,600~2,200자 (간결하게 핵심만, 마지막 해시태그까지 반드시 완성)`;

    let convertedContent = '';
    let finishReason: string = '';
    let truncated = false;

    // Claude Haiku 4.5 + prompt caching (system 캐시: 일반 모드의 EEAT_INSTRUCTION).
    // 이어쓰기 모드는 정적 시스템 프롬프트 없음 — 캐싱 미적용.
    try {
      console.log('[convert-eeat] Claude Haiku 4.5 호출', isContinuation ? '(continuation)' : '(structured)');
      const client = new Anthropic({ apiKey: claudeKey });
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        ...(isContinuation
          ? {}
          : {
              system: [{
                type: 'text' as const,
                text: EEAT_INSTRUCTION,
                cache_control: { type: 'ephemeral' as const },
              }],
            }),
        messages: [{ role: 'user', content: prompt }],
      });
      convertedContent = message.content[0].type === 'text' ? message.content[0].text : '';
      finishReason = message.stop_reason || '';
      // 캐시 사용 로깅 (모니터링용)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usage = (message as any).usage;
      if (usage) {
        console.log('[convert-eeat] usage:', {
          input: usage.input_tokens,
          output: usage.output_tokens,
          cache_create: usage.cache_creation_input_tokens || 0,
          cache_read: usage.cache_read_input_tokens || 0,
        });
      }
      if (finishReason && finishReason !== 'end_turn' && finishReason !== 'stop_sequence') {
        truncated = true;
        console.log('[convert-eeat] Claude 응답 잘림:', finishReason);
      }
      console.log('[convert-eeat] Claude 응답', convertedContent.length, '자');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[convert-eeat] Claude 실패:', msg);
      return withCors(NextResponse.json(
        { error: `Claude 변환 실패: ${msg}` },
        { status: 500 }
      ));
    }

    if (!convertedContent) {
      return withCors(NextResponse.json({ error: '변환 실패' }, { status: 500 }));
    }

    // 이어쓰기 모드는 잘려도 일단 반환 (어차피 결합용)
    if (truncated && !continuation) {
      return withCors(NextResponse.json({
        error: `응답이 토큰 한도에서 잘렸습니다 (${finishReason})`,
        truncated: true,
        partialContent: convertedContent, // 잘린 콘텐츠 전체 반환 (이어쓰기 가능하도록)
      }, { status: 422 }));
    }

    // 제목 추출 (첫 번째 # 라인 또는 원본 제목 유지)
    const titleMatch = convertedContent.match(/^#\s+(.+)$/m);
    const newTitle = titleMatch ? titleMatch[1].trim() : title;
    // 제목 라인 제거 (content에서 분리)
    let cleanContent = convertedContent.replace(/^#\s+.+\n?/, '').trim();

    // 후처리: 마지막 해시태그 직전에 프로젝트 홈페이지·블로그 링크 자동 삽입
    if (homepage_url || blog_url) {
      cleanContent = injectProjectLinks(cleanContent, {
        homepage_url,
        blog_url,
        company_name,
      });
    }

    return withCors(NextResponse.json({
      title: newTitle,
      content: cleanContent,
    }));

  } catch (error) {
    console.error('[convert-eeat] 오류:', error);
    const msg = error instanceof Error ? error.message : '변환 중 오류';
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
