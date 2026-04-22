import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKey, getClaudeKey } from '@/lib/api-auth';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { category, projectName, projectDescription, projectFiles, businessInfo } = await req.json();
    console.log('[API] suggest-subkeywords 요청:', { category, projectName });

    if (!category) return NextResponse.json({ error: 'category 필요' }, { status: 400 });

    // 프로젝트 정보가 없으면 기본값 반환
    if (!projectName) {
      console.log('[API] 프로젝트명 없음, 기본값 반환');
      return NextResponse.json({ subKeywords: [] }, { status: 200 });
    }

    // API 제공자 결정 (기본값: claude)
    const apiProvider = req.headers.get('X-API-Provider') || 'claude';
    let apiKey: string | undefined;
    let selectedProvider = apiProvider;

    if (apiProvider === 'claude') {
      apiKey = getClaudeKey(req);
      if (!apiKey) {
        apiKey = getGeminiKey(req);
        if (!apiKey) return NextResponse.json({ error: 'Claude/Gemini API 키가 설정되지 않았습니다.' }, { status: 500 });
        selectedProvider = 'gemini';
      }
    } else {
      apiKey = getGeminiKey(req);
      if (!apiKey) {
        apiKey = getClaudeKey(req);
        if (!apiKey) return NextResponse.json({ error: 'Gemini/Claude API 키가 설정되지 않았습니다.' }, { status: 500 });
        selectedProvider = 'claude';
      }
    }

    // 프로젝트 파일 정보
    const filesSection = projectFiles?.length
      ? `\n\n[프로젝트 파일]\n${(projectFiles as { file_name: string; content: string }[])
          .slice(0, 2)
          .map(f => `▶ ${f.file_name}\n${(f.content || '').slice(0, 500)}`)
          .join('\n\n')}`
      : '';

    // 비즈니스 정보 (보조)
    const businessSection = businessInfo?.industry || businessInfo?.mainProduct
      ? `\n\n[추가 비즈니스 정보 (참고)]
업종: ${businessInfo?.industry || '미입력'}
주요 상품/서비스: ${businessInfo?.mainProduct || '미입력'}
주요 장점: ${businessInfo?.mainBenefit || '미입력'}
대상 고객: ${businessInfo?.targetAudience || '미입력'}`
      : '';

    const prompt = `당신은 콘텐츠 기획 전문가입니다.

다음 프로젝트를 분석하고, ${category} 콘텐츠 카테고리에서 사용할 수 있는 세부 분야/주제를 추천하세요.

[프로젝트명]: ${projectName}
[프로젝트 설명]: ${projectDescription || '상세 설명 없음'}${filesSection}${businessSection}

⭐️ 프로젝트명 "${projectName}"을 최우선으로 고려하여, 이 프로젝트에 가장 적합한 5개의 세부 분야를 추천하세요.
각 분야는 1~3단어의 구체적인 용어여야 합니다.

반드시 아래 형식으로만 응답하세요 (번호와 분야명만):
1. 분야1
2. 분야2
3. 분야3
4. 분야4
5. 분야5`;

    let text = '';

    if (selectedProvider === 'claude') {
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });
      text = message.content[0].type === 'text' ? message.content[0].text : '';
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      text = response.text || '';
    }

    const subKeywords = text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    console.log('[API] 생성된 분야:', subKeywords);
    return NextResponse.json({ subKeywords });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[API] suggest-subkeywords 에러:', msg, e);
    return NextResponse.json({ error: msg || '오류가 발생했습니다.', subKeywords: [] }, { status: 500 });
  }
}
