import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getGeminiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() { return corsOptionsResponse(); }

const SYSTEM = `당신은 콘텐츠 마케팅 기획자다. 시드 키워드·산업·브랜드 정보를 받아 AI 검색이 인용하기 좋은 질문형 제목 50개를 생성한다.

원칙:
- 모든 제목은 사용자 검색 쿼리 형태 (질문형, 또는 "X 5가지 이유" 같은 리스트형)
- 같은 패턴 반복 금지 — 다양한 검색 의도 포괄 (가격·비교·후기·실패·선택·방법·비용·시기·장단점)
- 한국어, 25~50자 내외
- 지역 정보 있으면 일부 제목에 지역 포함 (예: "대전 임플란트 잘하는 곳")
- 비교형 일부, 케이스형 일부 ("실제 환자 사례로 본 ~")
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seedKeyword, category, region, companyName, industry } = body;
    if (!seedKeyword?.trim()) return withCors(NextResponse.json({ error: '시드 키워드 필요' }, { status: 400 }));

    const geminiKey = getGeminiKey(request);
    if (!geminiKey) return withCors(NextResponse.json({ error: 'Gemini key 필요' }, { status: 401 }));

    const userMsg = `시드 키워드: ${seedKeyword}
카테고리: ${category || '일반'}
${region ? `지역: ${region}` : ''}
${companyName ? `브랜드: ${companyName}` : ''}
${industry ? `산업: ${industry}` : ''}

위 정보로 50개의 질문형/리스트형 제목을 생성. JSON 형식만:
{ "titles": ["제목1", "제목2", ..., "제목50"] }`;

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMsg,
      config: { systemInstruction: SYSTEM, maxOutputTokens: 4096, responseMimeType: 'application/json' },
    });
    const text = response.text || '';

    let parsed: { titles?: string[] } = {};
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : JSON.parse(text);
    } catch {
      return withCors(NextResponse.json({ error: 'JSON 파싱 실패', raw: text.slice(0, 500) }, { status: 500 }));
    }

    const titles = (parsed.titles || []).filter((t: unknown) => typeof t === 'string' && t.length > 5).slice(0, 50);
    return withCors(NextResponse.json({ titles, seedKeyword, category }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return withCors(NextResponse.json({ error: msg }, { status: 500 }));
  }
}
