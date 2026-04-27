import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getGeminiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() { return corsOptionsResponse(); }

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Simplified Chinese (中文)',
  ja: 'Japanese (日本語)',
};

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Translated title' },
    content: { type: Type.STRING, description: 'Translated markdown body' },
  },
  required: ['title', 'content'],
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
    if (!geminiKey) {
      return withCors(NextResponse.json({ error: 'Gemini API 키 필요' }, { status: 401 }));
    }

    const prompt = `Translate the following Korean blog content to ${langName}.

CRITICAL RULES — preserve structure exactly:
- Keep ALL markdown formatting: ## headers, *, -, 1. lists, | tables |, **bold**, *italic*, > blockquotes, code, links.
- Keep URLs and links exactly as-is. Do NOT translate URL paths.
- Hashtags: translate the word but keep # prefix. Example "#회사명" → "#CompanyName" (en) / "#公司名" (zh) / "#会社名" (ja).
- Proper nouns: keep brand/company/person names unless a well-known localized version exists.
- Numbers, statistics, prices: keep numerical values exact.
- FAQ Q/A blocks: keep "Q:" and "A:" prefixes (translate just the question/answer text).
- Output JSON ONLY. No preamble, no markdown code fence.

[Source title]
${title || '(no title)'}

[Source content]
${content}`;

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    // 안전 필터 해제 — 사용자 자체 검수 완료된 비즈니스 콘텐츠라 BLOCK_NONE이 적합.
    // 이 한 줄이 medical/legal/political 콘텐츠 번역 실패의 가장 큰 원인 해결.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safetySettings: any[] = [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ];

    const callGemini = async (): Promise<{ text: string; finishReason: string }> => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: 16384, // 8192 → 16384 (출력 잘림 방지)
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          safetySettings,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cand = (response as any).candidates?.[0];
      const finishReason = cand?.finishReason || 'UNKNOWN';
      return { text: response.text || '', finishReason };
    };

    // 서버 측 1회 재시도 (빈 응답·SAFETY·OTHER 등 일시적 실패 보호)
    let { text, finishReason } = await callGemini();
    if (!text || text.length < 50) {
      console.log(`[translate] 1차 빈 응답 (finishReason=${finishReason}, target=${targetLang}) — 재시도`);
      await new Promise(r => setTimeout(r, 800));
      const second = await callGemini();
      if (second.text && second.text.length >= 50) {
        text = second.text;
        finishReason = second.finishReason;
        console.log(`[translate] 재시도 성공 (finishReason=${finishReason})`);
      } else {
        console.error(`[translate] 재시도도 실패 (finishReason=${second.finishReason}) target=${targetLang}, content len=${content.length}`);
      }
    }

    let parsed: { title?: string; content?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // 폴백 1: 코드블록 안 JSON
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) {
        try { parsed = JSON.parse(m[1].trim()); } catch {}
      }
      // 폴백 2: 첫 { 부터 마지막 } 까지 (잘려도 시도)
      if (!parsed.content) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          try { parsed = JSON.parse(text.slice(start, end + 1)); } catch {}
        }
      }
    }
    if (!parsed.content) {
      return withCors(NextResponse.json({
        error: `번역 실패 (finishReason=${finishReason}, len=${text.length})`,
      }, { status: 500 }));
    }
    return withCors(NextResponse.json({
      title: parsed.title || title || '',
      content: parsed.content,
    }));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '번역 실패';
    console.error('[translate] 오류:', msg);
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
