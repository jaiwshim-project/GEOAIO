import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import Anthropic from '@anthropic-ai/sdk';

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
    const { content, title, tone, topic, continuation, previousContent } = body;

    if (!content && !continuation) {
      return withCors(NextResponse.json({ error: 'content 필요' }, { status: 400 }));
    }

    const geminiKey = getGeminiKey(request);
    const claudeKey = getClaudeKey(request);

    // ── 이어쓰기 모드: 잘린 콘텐츠를 마저 작성 ──
    const prompt = continuation && previousContent
      ? `당신은 E-E-A-T 콘텐츠 마무리 전문가입니다.
아래 콘텐츠가 중간에 잘려서 미완성 상태입니다.
**이어서 작성**하여 다음 요소들을 마무리하세요:
- 누락된 FAQ 섹션 (없으면 추가, 있으면 유지)
- 누락된 비교표 (장점·단점·고려사항)
- 결론 섹션 (## 결론)
- 해시태그 10개 (마지막 줄에 # 형태)

⚠️ **중요 규칙:**
1. 원본 마지막 문장을 자연스럽게 이어가세요
2. 이미 작성된 섹션은 다시 쓰지 마세요 (FAQ/표/결론/해시태그 중 누락된 것만)
3. 톤: ${tone || '전문적'} 유지
4. 분량: 누락된 부분만 작성 (300~800자)
5. 출력은 **이어쓸 부분만**, 원본을 다시 쓰지 마세요

원본 (마지막 부분):
---
${previousContent.slice(-1500)}
---

위 끝부분에 자연스럽게 이어서, 누락된 섹션들을 완성하세요.
출력 형식: 바로 이어 쓸 마크다운 텍스트만 (인사말·설명 없이)`
      : `${EEAT_INSTRUCTION}

---
[원본 콘텐츠 - 아래 내용을 E-E-A-T 7단계로 재구성하세요]
제목: ${title || topic || ''}
톤: ${tone || '전문적'}

${content}
---

위 내용을 E-E-A-T 7단계 구조로 재구성한 마크다운을 출력하세요.
제목은 수치가 포함된 강력한 문장으로 개선하세요.
⭐ 분량: 1,600~2,200자 (간결하게 핵심만, 마지막 해시태그까지 반드시 완성)`;

    let convertedContent = '';
    let finishReason: string = ''; // 'STOP' = 정상 종료, 'MAX_TOKENS' = 잘림
    let truncated = false;

    // Gemini 우선
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { maxOutputTokens: 8000 }, // 잘림 방지: 6000 → 8000
        });
        convertedContent = response.text || '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        finishReason = (response as any).candidates?.[0]?.finishReason || '';
        if (finishReason && finishReason !== 'STOP') {
          truncated = true;
          console.log('[convert-eeat] Gemini 응답 잘림:', finishReason);
        }
      } catch (e) {
        console.log('[convert-eeat] Gemini 실패, Claude 폴백:', e);
      }
    }

    // Claude 폴백
    if (!convertedContent && claudeKey) {
      const client = new Anthropic({ apiKey: claudeKey });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      });
      convertedContent = message.content[0].type === 'text' ? message.content[0].text : '';
      finishReason = message.stop_reason || '';
      if (finishReason && finishReason !== 'end_turn' && finishReason !== 'stop_sequence') {
        truncated = true;
        console.log('[convert-eeat] Claude 응답 잘림:', finishReason);
      }
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
    const cleanContent = convertedContent.replace(/^#\s+.+\n?/, '').trim();

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
