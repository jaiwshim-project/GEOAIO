import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() { return corsOptionsResponse(); }

const SYSTEM = `당신은 콘텐츠 전략가다. 긴 마스터 글 1개를 받아 30개의 질문형 파생 콘텐츠 메타를 생성한다.

원칙:
- 마스터 글의 본문에서 30개의 질문형 후크 추출 (각 후크는 마스터의 한 부분에 대응)
- 각 파생 메타: { title (질문형 제목), hook (한 문장 답), sourceParagraph (마스터의 어느 단락에서 나왔는지 키워드/요약) }
- 다양한 검색 의도 포괄: 정의·이유·방법·비교·실패·후기·비용·시기·대상
- 한국어, 제목 25~50자, 후크 50~100자
- 마스터의 핵심 수치·데이터·브랜드명 보존
`;

interface DeriveRequest {
  masterContent: string;     // 마스터 글 본문 (최대 8000자, 그 이상은 잘림)
  masterTitle?: string;
  masterUrl?: string;        // 마스터의 원본 URL (있으면)
  companyName?: string;
  region?: string;
  industry?: string;
  count?: number;            // 생성할 파생 개수 (기본 30, 최대 50)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<DeriveRequest>;
    if (!body.masterContent?.trim()) {
      return withCors(NextResponse.json({ error: 'masterContent 필수' }, { status: 400 }));
    }
    const masterContent = body.masterContent.slice(0, 8000); // 토큰 보호
    const count = Math.min(50, Math.max(5, body.count || 30));

    const geminiKey = getGeminiKey(request);
    if (!geminiKey) return withCors(NextResponse.json({ error: 'Gemini key 필요' }, { status: 401 }));

    const userMsg = `마스터 글:
"""
${body.masterTitle ? `제목: ${body.masterTitle}\n` : ''}
${masterContent}
"""

${body.companyName ? `브랜드: ${body.companyName}` : ''}
${body.region ? `지역: ${body.region}` : ''}
${body.industry ? `산업: ${body.industry}` : ''}

위 마스터 글에서 ${count}개의 질문형 파생 콘텐츠 메타를 생성. JSON만:
{
  "derivatives": [
    { "title": "질문형 제목", "hook": "한 문장 답", "sourceParagraph": "마스터의 어느 단락 키워드" },
    ...
  ]
}`;

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMsg,
      config: { systemInstruction: SYSTEM, maxOutputTokens: 8192, responseMimeType: 'application/json' },
    });
    const text = response.text || '';

    let parsed: { derivatives?: Array<{ title?: string; hook?: string; sourceParagraph?: string }> } = {};
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : JSON.parse(text);
    } catch {
      return withCors(NextResponse.json({ error: 'JSON 파싱 실패', raw: text.slice(0, 500) }, { status: 500 }));
    }

    const derivatives = (parsed.derivatives || [])
      .filter(d => d?.title && typeof d.title === 'string' && d.title.length > 5)
      .slice(0, count);

    return withCors(NextResponse.json({
      derivatives,
      masterTitle: body.masterTitle,
      generatedAt: new Date().toISOString(),
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
