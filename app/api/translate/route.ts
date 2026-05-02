import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 120;
export const runtime = 'nodejs';

export async function OPTIONS() { return corsOptionsResponse(); }

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Simplified Chinese (中文)',
  ja: 'Japanese (日本語)',
};

export async function POST(request: NextRequest) {
  try {
    const { content, title, targetLang } = await request.json();
    if (!content || typeof content !== 'string') {
      return withCors(NextResponse.json({ error: 'content 필요' }, { status: 400 }));
    }
    const langName = LANG_NAMES[targetLang];
    if (!langName) {
      return withCors(NextResponse.json({ error: '지원하지 않는 언어 (en/zh/ja)' }, { status: 400 }));
    }

    const geminiKey = getGeminiKey(request);
    const claudeKey = getClaudeKey(request);
    if (!geminiKey && !claudeKey) {
      return withCors(NextResponse.json({ error: 'Gemini/Claude API 키 필요' }, { status: 401 }));
    }

    // ⭐ JSON 출력 제거 — 마크다운 직접 출력. JSON escape 충돌이 가장 큰 실패 원인이었음.
    // 출력 형식: 첫 줄 = "# <translated title>", 그 다음 빈 줄, 그 다음 마크다운 본문.
    const prompt = `Translate the following Korean blog content to ${langName}.

CRITICAL RULES — preserve structure exactly:
- Keep ALL markdown formatting: ## headers, *, -, 1. lists, | tables |, **bold**, *italic*, > blockquotes, code, links.
- Keep URLs and links exactly as-is. Do NOT translate URL paths.
- Hashtags: translate the word but keep # prefix. Example "#회사명" → "#CompanyName" (en) / "#公司名" (zh) / "#会社名" (ja).
- Proper nouns: keep brand/company/person names unless a well-known localized version exists.
- Numbers, statistics, prices: keep numerical values exact.
- FAQ Q/A blocks: keep "Q:" and "A:" prefixes (translate just the question/answer text).

OUTPUT FORMAT (very important):
- Line 1: "# " followed by the translated title (single H1).
- Line 2: blank.
- Line 3 onwards: the translated markdown body (start with ## H2 sections — do NOT include the H1 again).
- Output ONLY the markdown. No preamble like "Sure, here is...". No code fences.

[Source title]
${title || '(no title)'}

[Source content]
${content}`;

    // Gemini 호출 함수
    const callGemini = async (key: string): Promise<{ text: string; finishReason: string }> => {
      const ai = new GoogleGenAI({ apiKey: key });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safetySettings: any[] = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ];
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: 16384,
          safetySettings,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cand = (response as any).candidates?.[0];
      const finishReason = cand?.finishReason || 'UNKNOWN';
      return { text: response.text || '', finishReason };
    };

    // Claude 호출 함수 (Gemini 키 없거나 실패 시 폴백)
    const callClaude = async (key: string): Promise<{ text: string; finishReason: string }> => {
      const client = new Anthropic({ apiKey: key });
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 16384,
        messages: [{ role: 'user', content: prompt }],
      });
      const textOut = message.content[0]?.type === 'text' ? message.content[0].text : '';
      return { text: textOut, finishReason: message.stop_reason || 'end_turn' };
    };

    // 호출 전략: Gemini 키 있으면 우선, 없으면 Claude 단독
    let text = '';
    let finishReason = 'UNKNOWN';
    let provider: 'gemini' | 'claude' = 'gemini';

    if (geminiKey) {
      try {
        const r = await callGemini(geminiKey);
        text = r.text;
        finishReason = r.finishReason;
      } catch (geminiErr) {
        console.log('[translate] Gemini 실패:', geminiErr instanceof Error ? geminiErr.message : geminiErr);
        if (claudeKey) {
          provider = 'claude';
          const r = await callClaude(claudeKey);
          text = r.text;
          finishReason = r.finishReason;
        } else {
          throw geminiErr;
        }
      }
    } else if (claudeKey) {
      provider = 'claude';
      const r = await callClaude(claudeKey);
      text = r.text;
      finishReason = r.finishReason;
    }

    // 짧은 응답 시 1회 재시도
    if (!text || text.length < 200) {
      console.log(`[translate] 1차 짧은 응답 (provider=${provider}, finishReason=${finishReason}, len=${text.length}, target=${targetLang}) — 재시도`);
      await new Promise(r => setTimeout(r, 800));
      try {
        const second = provider === 'claude'
          ? await callClaude(claudeKey!)
          : await callGemini(geminiKey!);
        if (second.text && second.text.length >= 200) {
          text = second.text;
          finishReason = second.finishReason;
          console.log(`[translate] 재시도 성공 (provider=${provider}, finishReason=${finishReason}, len=${text.length})`);
        } else {
          // 재시도 실패 시 다른 모델 시도 (Gemini→Claude 또는 Claude→Gemini)
          if (provider === 'gemini' && claudeKey) {
            console.log('[translate] Gemini 재시도 실패 → Claude 폴백');
            const fallback = await callClaude(claudeKey);
            if (fallback.text && fallback.text.length >= 200) {
              text = fallback.text;
              finishReason = fallback.finishReason;
              provider = 'claude';
            }
          } else if (provider === 'claude' && geminiKey) {
            console.log('[translate] Claude 재시도 실패 → Gemini 폴백');
            const fallback = await callGemini(geminiKey);
            if (fallback.text && fallback.text.length >= 200) {
              text = fallback.text;
              finishReason = fallback.finishReason;
              provider = 'gemini';
            }
          }
        }
      } catch (retryErr) {
        console.error('[translate] 재시도 예외:', retryErr instanceof Error ? retryErr.message : retryErr);
      }
    }

    // 마크다운 파싱 — 첫 H1 줄을 title로, 나머지를 content로
    let parsedTitle = '';
    let parsedContent = '';

    if (text && text.trim()) {
      // 코드펜스 ```markdown / ``` 제거 (모델이 가끔 감쌈)
      let cleaned = text.trim();
      cleaned = cleaned.replace(/^```(?:markdown|md)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();

      // "Sure, here is the translation:" 같은 preamble 제거 — 첫 H1 또는 첫 ## 까지 잘라냄
      const firstHeadingIdx = cleaned.search(/^#\s+/m);
      if (firstHeadingIdx > 0) {
        cleaned = cleaned.slice(firstHeadingIdx);
      }

      // 첫 줄이 # H1이면 title 추출, 아니면 원본 title 유지
      const lines = cleaned.split('\n');
      const firstLine = lines[0]?.trim() || '';
      const h1Match = firstLine.match(/^#\s+(.+)$/);
      if (h1Match) {
        parsedTitle = h1Match[1].trim();
        parsedContent = lines.slice(1).join('\n').trimStart();
      } else {
        // H1이 없으면 첫 줄을 title로 가정
        parsedTitle = firstLine;
        parsedContent = lines.slice(1).join('\n').trimStart();
      }
    }

    if (!parsedContent || parsedContent.length < 100) {
      return withCors(NextResponse.json({
        error: `번역 실패 (provider=${provider}, finishReason=${finishReason}, output len=${text.length}, parsed len=${parsedContent.length})`,
      }, { status: 500 }));
    }

    return withCors(NextResponse.json({
      title: parsedTitle || title || '',
      content: parsedContent,
    }));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '번역 실패';
    console.error('[translate] 오류:', msg);
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
