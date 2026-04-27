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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    });
    const text = response.text || '';
    let parsed: { title?: string; content?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // 폴백: 코드블록 안 JSON 시도
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) {
        try { parsed = JSON.parse(m[1].trim()); } catch {}
      }
    }
    if (!parsed.content) {
      return withCors(NextResponse.json({ error: '번역 응답 파싱 실패' }, { status: 500 }));
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
