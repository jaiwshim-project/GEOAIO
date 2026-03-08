import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKey } from '@/lib/api-auth';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { category, categoryLabel, pastTopics } = await req.json();
    if (!category) return NextResponse.json({ error: 'category 필요' }, { status: 400 });

    const apiKey = getGeminiKey(req);
    if (!apiKey) return NextResponse.json({ error: 'Gemini API 키가 설정되지 않았습니다. /settings 페이지에서 API 키를 등록해주세요.' }, { status: 500 });

    const pastList = pastTopics?.length
      ? `\n\n이미 작성된 주제 목록 (중복 제외):\n${(pastTopics as string[]).slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `당신은 콘텐츠 기획 전문가입니다.
콘텐츠 유형: ${categoryLabel || category}${pastList}

위 콘텐츠 유형에 맞는 새로운 주제 5개를 추천해주세요.
기존에 작성된 주제와 겹치지 않고, 독자의 관심을 끌 수 있는 참신한 주제를 제안하세요.

반드시 아래 형식으로만 응답하세요 (번호와 주제만, 설명 없이):
1. 주제1
2. 주제2
3. 주제3
4. 주제4
5. 주제5`,
    });

    const text = response.text || '';
    const topics = text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    return NextResponse.json({ topics });
  } catch (e: unknown) {
    console.error('suggest-topics error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('invalid') || msg.includes('401')) {
      return NextResponse.json({ error: 'Gemini API 키가 유효하지 않습니다. /settings 페이지에서 키를 확인해주세요.' }, { status: 401 });
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'Gemini API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }
    return NextResponse.json({ error: msg || '오류가 발생했습니다.' }, { status: 500 });
  }
}
