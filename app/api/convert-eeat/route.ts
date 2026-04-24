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
⚠️ 원본의 톤/문체를 그대로 유지`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title, tone, topic } = body;

    if (!content) {
      return withCors(NextResponse.json({ error: 'content 필요' }, { status: 400 }));
    }

    const geminiKey = getGeminiKey(request);
    const claudeKey = getClaudeKey(request);

    const prompt = `${EEAT_INSTRUCTION}

---
[원본 콘텐츠 - 아래 내용을 E-E-A-T 7단계로 재구성하세요]
제목: ${title || topic || ''}
톤: ${tone || '전문적'}

${content}
---

위 내용을 E-E-A-T 7단계 구조로 재구성한 마크다운을 출력하세요.
제목은 수치가 포함된 강력한 문장으로 개선하세요.`;

    let convertedContent = '';

    // Gemini 우선
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { maxOutputTokens: 6000 },
        });
        convertedContent = response.text || '';
      } catch (e) {
        console.log('[convert-eeat] Gemini 실패, Claude 폴백:', e);
      }
    }

    // Claude 폴백
    if (!convertedContent && claudeKey) {
      const client = new Anthropic({ apiKey: claudeKey });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }],
      });
      convertedContent = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    if (!convertedContent) {
      return withCors(NextResponse.json({ error: '변환 실패' }, { status: 500 }));
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
