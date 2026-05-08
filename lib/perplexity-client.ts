export function isPerplexityConfigured() {
  return !!process.env.PERPLEXITY_API_KEY;
}

export interface CitationResult {
  cited: boolean;
  citedUrl: string | null;
  allCitations: string[];
  answerExcerpt: string;
  isMock?: boolean;
}

const MOCK_CITATIONS = [
  'https://www.geo-aio.com/blog/geo-aio-intro',
  'https://example.com/reference',
  'https://blog.example.com/ai-seo',
];

export async function queryCitations(query: string, domain: string): Promise<CitationResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    const cited = Math.random() > 0.55;
    return {
      cited,
      citedUrl: cited ? `https://${domain}/blog/sample` : null,
      allCitations: cited ? [`https://${domain}/blog/sample`, ...MOCK_CITATIONS.slice(1)] : MOCK_CITATIONS.slice(1),
      answerExcerpt: '[Mock] Perplexity API 키가 없어 샘플 데이터를 표시합니다.',
      isMock: true,
    };
  }

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Perplexity API ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const citations: string[] = data.citations || [];
  const content: string = data.choices?.[0]?.message?.content || '';

  // domain에서 경로 제거 (www.geo-aio.com/blog → www.geo-aio.com)
  const rootDomain = domain.replace(/\/.*$/, '');
  const cited = citations.some(u => u.includes(rootDomain));
  const citedUrl = citations.find(u => u.includes(rootDomain)) || null;

  return {
    cited,
    citedUrl,
    allCitations: citations,
    answerExcerpt: content.slice(0, 600),
  };
}
