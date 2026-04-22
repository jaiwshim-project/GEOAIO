import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKey, getClaudeKey } from '@/lib/api-auth';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { topic, category, categoryLabel } = await req.json();
    if (!topic) return NextResponse.json({ error: 'topic 필요' }, { status: 400 });

    // API 제공자 결정
    const apiProvider = req.headers.get('X-API-Provider') || 'gemini';
    let apiKey: string | undefined;

    if (apiProvider === 'claude') {
      apiKey = getClaudeKey(req);
      if (!apiKey) return NextResponse.json({ error: 'Claude API 키가 설정되지 않았습니다.' }, { status: 500 });
    } else {
      apiKey = getGeminiKey(req);
      if (!apiKey) return NextResponse.json({ error: 'Gemini API 키가 설정되지 않았습니다. /settings 페이지에서 API 키를 등록해주세요.' }, { status: 500 });
    }

    const prompt = `당신은 SEO 전문가입니다.
콘텐츠 유형: ${categoryLabel || category}
주제: ${topic}

위 주제에 가장 적합한 타겟 키워드 5개를 추천해주세요.
검색량이 높고 주제와 밀접한 키워드를 선정하세요.

반드시 아래 형식으로만 응답하세요 (번호와 키워드만):
1. 키워드1
2. 키워드2
3. 키워드3
4. 키워드4
5. 키워드5`;

    let text = '';

    if (apiProvider === 'claude') {
      // Claude API 사용
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });
      text = message.content[0].type === 'text' ? message.content[0].text : '';
    } else {
      // Gemini API 사용
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      text = response.text || '';
    }

    const keywords = text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    return NextResponse.json({ keywords });
  } catch (e: unknown) {
    console.error('suggest-keywords error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    const apiProvider = (req as unknown as { headers: { get: (key: string) => string | null } }).headers.get('X-API-Provider') || 'gemini';
    const apiName = apiProvider === 'claude' ? 'Claude' : 'Gemini';

    if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('invalid') || msg.includes('401')) {
      return NextResponse.json({ error: `${apiName} API 키가 유효하지 않습니다.` }, { status: 401 });
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return NextResponse.json({ error: `${apiName} API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.` }, { status: 429 });
    }
    return NextResponse.json({ error: msg || '오류가 발생했습니다.' }, { status: 500 });
  }
}
