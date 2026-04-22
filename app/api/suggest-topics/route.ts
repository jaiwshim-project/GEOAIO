import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKey, getClaudeKey } from '@/lib/api-auth';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { category, categoryLabel, pastTopics, projectName, projectDescription, projectFiles, inputTopic } = await req.json();
    if (!category) return NextResponse.json({ error: 'category 필요' }, { status: 400 });

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

    const pastList = pastTopics?.length
      ? `\n\n이미 작성된 주제 목록 (중복 제외):\n${(pastTopics as string[]).slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const projectSection = projectName
      ? `[작업 대상 카테고리: ${projectName}]${projectDescription ? `\n카테고리 설명: ${projectDescription}` : ''}`
      : '';

    const filesSection = projectFiles?.length
      ? `\n\n[카테고리 관련 업로드 파일]\n${(projectFiles as { file_name: string; content: string }[])
          .slice(0, 3)
          .map(f => `▶ ${f.file_name}\n${(f.content || '').slice(0, 1500)}`)
          .join('\n\n')}`
      : '';

    const inputTopicSection = inputTopic?.trim()
      ? `\n\n[사용자 입력 주제]: "${inputTopic.trim()}"
⚠️ 사용자가 위 주제를 입력했습니다. 이 주제를 기반으로 관련된 세부 주제, 확장 주제, 또는 유사한 주제 5개를 추천하세요. 입력된 주제와 직접적으로 관련이 있어야 합니다.`
      : '';

    const prompt = `당신은 콘텐츠 기획 전문가입니다.

${projectSection}${filesSection}${inputTopicSection}

${inputTopic?.trim()
  ? `"${inputTopic.trim()}" 주제를 기반으로 관련 ${categoryLabel || category} 콘텐츠 주제 5개를 추천하세요. 입력 주제의 세부 주제, 확장 주제, 다른 각도의 접근 등 다양하게 제안해주세요.`
  : `위 카테고리(${projectName || categoryLabel || category})에 관한 ${categoryLabel || category} 콘텐츠 주제 5개를 추천하세요.`}
${projectName ? `⚠️ 반드시 "${projectName}"과 직접 관련된 주제만 작성하세요. 관련 없는 주제는 절대 포함하지 마세요.` : ''}
${pastList ? `\n이미 작성된 주제와 겹치지 않아야 합니다:${pastList}` : ''}

반드시 아래 형식으로만 응답하세요 (번호와 주제만, 설명 없이):
1. 주제1
2. 주제2
3. 주제3
4. 주제4
5. 주제5`;

    let text = '';

    if (apiProvider === 'claude') {
      // Claude API 사용
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
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

    const topics = text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    return NextResponse.json({ topics });
  } catch (e: unknown) {
    console.error('suggest-topics error:', e);
    const msg = e instanceof Error ? e.message : String(e);
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
