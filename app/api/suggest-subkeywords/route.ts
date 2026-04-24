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

    // 프로젝트 파일 정보 (선택사항)
    const filesSection = '';

    // 비즈니스 정보 (보조)
    const businessSection = businessInfo?.industry || businessInfo?.mainProduct
      ? `\n\n[추가 비즈니스 정보 (참고)]
업종: ${businessInfo?.industry || '미입력'}
주요 상품/서비스: ${businessInfo?.mainProduct || '미입력'}
주요 장점: ${businessInfo?.mainBenefit || '미입력'}
대상 고객: ${businessInfo?.targetAudience || '미입력'}`
      : '';

    const prompt = `당신은 콘텐츠 기획 전문가입니다.

"${projectName}"라는 프로젝트에서 ${category} 콘텐츠를 생성할 때 사용할 수 있는 세부 분야/주제 5개를 추천해주세요.
${projectDescription ? `\n프로젝트 설명: ${projectDescription}` : ''}${businessSection}

⭐️ 반드시 "${projectName}"의 특성을 최우선으로 반영하세요.
각 분야는 1~3단어로 작성하세요.

형식 (번호와 분야명만):
1. 분야1
2. 분야2
3. 분야3
4. 분야4
5. 분야5`;

    let text = '';
    let lastError: Error | null = null;

    // Claude 우선, 실패 시 Gemini 폴백
    if (selectedProvider === 'claude') {
      try {
        console.log('[API] Claude로 분야 생성 시도');
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        });
        text = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log('[API] Claude 성공');
      } catch (claudeError: unknown) {
        lastError = claudeError instanceof Error ? claudeError : new Error(String(claudeError));
        console.log('[API] Claude 실패, Gemini로 폴백:', lastError.message);

        // Claude 실패 → Gemini로 자동 전환
        try {
          const geminiKey = getGeminiKey(req);
          if (!geminiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');

          console.log('[API] Gemini로 분야 생성 시도');
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          text = response.text || '';
          console.log('[API] Gemini 성공');
        } catch (geminiError: unknown) {
          console.error('[API] Gemini도 실패:', geminiError);
          throw lastError; // 원래 Claude 에러 반환
        }
      }
    } else {
      // Gemini 우선, 실패 시 Claude 폴백
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        text = response.text || '';
      } catch (geminiError: unknown) {
        lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
        console.log('[API] Gemini 실패, Claude로 폴백:', lastError.message);

        // Gemini 실패 → Claude로 자동 전환
        try {
          const claudeKey = getClaudeKey(req);
          if (!claudeKey) throw new Error('Claude API 키 없음');

          const client = new Anthropic({ apiKey: claudeKey });
          const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            messages: [{ role: 'user', content: prompt }],
          });
          text = message.content[0].type === 'text' ? message.content[0].text : '';
          console.log('[API] Claude 성공');
        } catch (claudeError: unknown) {
          console.error('[API] Claude도 실패:', claudeError);
          throw lastError; // 원래 Gemini 에러 반환
        }
      }
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

// v1777031107 - Cache bust
