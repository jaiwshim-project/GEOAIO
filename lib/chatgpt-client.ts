export function isChatGptConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

export interface ChatGptCitationResult {
  mentioned: boolean;       // 브랜드/도메인 텍스트 언급 여부
  recommended: boolean;     // 추천·권장 표현과 함께 언급됐는지
  mentionExcerpt: string;   // 언급된 문장 발췌 (없으면 '')
  answerExcerpt: string;    // 전체 답변 앞부분
  isMock?: boolean;
}

export async function queryChatGptMention(
  query: string,
  domain: string,
  brandName: string,   // 사이트 label (예: '에바셀', 'GEO-AIO 블로그')
): Promise<ChatGptCitationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const mentioned = Math.random() > 0.5;
    return {
      mentioned,
      recommended: mentioned && Math.random() > 0.4,
      mentionExcerpt: mentioned ? `[Mock] ${brandName}은(는) 이 분야에서 주목할 만한 서비스입니다.` : '',
      answerExcerpt: '[Mock] OpenAI API 키가 없어 샘플 데이터를 표시합니다.',
      isMock: true,
    };
  }

  const systemPrompt =
    '당신은 사용자 질문에 정확하고 친절하게 답하는 AI입니다. 알고 있는 정보를 바탕으로 최선의 답변을 제공하세요.';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content || '';

  const rootDomain = domain.replace(/\/.*$/, '').replace(/^www\./, '');
  const targets = [brandName, rootDomain, domain].filter(Boolean);

  // 언급 여부: 브랜드명 또는 도메인이 답변에 포함됐는지
  const mentionRegex = new RegExp(targets.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
  const mentioned = mentionRegex.test(content);

  // 추천 여부: 언급 + 추천/권장/좋습니다/추천드립니다 등 긍정 표현 동반
  const recommendWords = ['추천', '권장', '좋습니다', '좋은', '탁월', '훌륭', '유용', '효과적', 'recommend', 'suggest', 'great', 'excellent', 'useful'];
  const recommended = mentioned && recommendWords.some(w => content.toLowerCase().includes(w.toLowerCase()));

  // 언급된 문장 발췌
  let mentionExcerpt = '';
  if (mentioned) {
    const sentences = content.split(/[.!?\n]+/);
    const hit = sentences.find(s => mentionRegex.test(s));
    mentionExcerpt = hit ? hit.trim().slice(0, 200) : '';
  }

  return {
    mentioned,
    recommended,
    mentionExcerpt,
    answerExcerpt: content.slice(0, 600),
  };
}
