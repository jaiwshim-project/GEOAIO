import { NextRequest, NextResponse } from 'next/server';
import { getApiKey } from '@/lib/api-auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { category, categoryLabel, pastTopics } = await req.json();
    if (!category) return NextResponse.json({ error: 'category 필요' }, { status: 400 });

    const apiKey = getApiKey(req);
    if (!apiKey) return NextResponse.json({ error: 'API 키 미설정' }, { status: 500 });

    const client = new Anthropic({ apiKey });

    const pastList = pastTopics?.length
      ? `\n\n이미 작성된 주제 목록 (중복 제외):\n${(pastTopics as string[]).slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `당신은 콘텐츠 기획 전문가입니다.
콘텐츠 유형: ${categoryLabel || category}${pastList}

위 콘텐츠 유형에 맞는 새로운 주제 5개를 추천해주세요.
기존에 작성된 주제와 겹치지 않고, 독자의 관심을 끌 수 있는 참신한 주제를 제안하세요.

반드시 아래 형식으로만 응답하세요 (번호와 주제만, 설명 없이):
1. 주제1
2. 주제2
3. 주제3
4. 주제4
5. 주제5`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const topics = text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    return NextResponse.json({ topics });
  } catch (e: unknown) {
    console.error('suggest-topics error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('credit balance') || msg.includes('insufficient') || msg.includes('billing')) {
      return NextResponse.json({ error: 'API 크레딧이 부족합니다. Anthropic 콘솔에서 크레딧을 충전해주세요.' }, { status: 402 });
    }
    return NextResponse.json({ error: msg || '오류가 발생했습니다.' }, { status: 500 });
  }
}
