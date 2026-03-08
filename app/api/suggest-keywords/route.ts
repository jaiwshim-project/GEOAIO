import { NextRequest, NextResponse } from 'next/server';
import { getApiKey } from '@/lib/api-auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { topic, category, categoryLabel } = await req.json();
    if (!topic) return NextResponse.json({ error: 'topic 필요' }, { status: 400 });

    const apiKey = getApiKey(req);
    if (!apiKey) return NextResponse.json({ error: 'API 키 미설정' }, { status: 500 });

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `당신은 SEO 전문가입니다.
콘텐츠 유형: ${categoryLabel || category}
주제: ${topic}

위 주제에 가장 적합한 타겟 키워드 5개를 추천해주세요.
검색량이 높고 주제와 밀접한 키워드를 선정하세요.

반드시 아래 형식으로만 응답하세요 (번호와 키워드만):
1. 키워드1
2. 키워드2
3. 키워드3
4. 키워드4
5. 키워드5`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const keywords = text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    return NextResponse.json({ keywords });
  } catch (e: unknown) {
    console.error('suggest-keywords error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 });
  }
}
