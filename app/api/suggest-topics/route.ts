import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKey } from '@/lib/api-auth';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { category, categoryLabel, pastTopics, projectName, projectDescription, projectFiles } = await req.json();
    if (!category) return NextResponse.json({ error: 'category 필요' }, { status: 400 });

    const apiKey = getGeminiKey(req);
    if (!apiKey) return NextResponse.json({ error: 'Gemini API 키가 설정되지 않았습니다. /settings 페이지에서 API 키를 등록해주세요.' }, { status: 500 });

    const pastList = pastTopics?.length
      ? `\n\n이미 작성된 주제 목록 (중복 제외):\n${(pastTopics as string[]).slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    // 프로젝트 컨텍스트 구성
    let projectContext = '';
    if (projectName) {
      projectContext += `\n\n[콘텐츠 카테고리 정보]`;
      projectContext += `\n카테고리 이름: ${projectName}`;
      if (projectDescription) projectContext += `\n카테고리 설명: ${projectDescription}`;
    }
    if (projectFiles?.length) {
      const filesSummary = (projectFiles as { file_name: string; content: string }[])
        .slice(0, 3)
        .map(f => `--- ${f.file_name} ---\n${(f.content || '').slice(0, 1500)}`)
        .join('\n\n');
      projectContext += `\n\n[업로드된 참조 파일 내용]\n${filesSummary}`;
    }

    const ai = new GoogleGenAI({ apiKey });

    const projectSection = projectName
      ? `[작업 대상 카테고리: ${projectName}]${projectDescription ? `\n카테고리 설명: ${projectDescription}` : ''}`
      : '';

    const filesSection = projectFiles?.length
      ? `\n\n[카테고리 관련 업로드 파일]\n${(projectFiles as { file_name: string; content: string }[])
          .slice(0, 3)
          .map(f => `▶ ${f.file_name}\n${(f.content || '').slice(0, 1500)}`)
          .join('\n\n')}`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `당신은 콘텐츠 기획 전문가입니다.

${projectSection}${filesSection}

위 카테고리(${projectName || categoryLabel || category})에 관한 ${categoryLabel || category} 콘텐츠 주제 5개를 추천하세요.
${projectName ? `⚠️ 반드시 "${projectName}"과 직접 관련된 주제만 작성하세요. 관련 없는 주제는 절대 포함하지 마세요.` : ''}
${pastList ? `\n이미 작성된 주제와 겹치지 않아야 합니다:${pastList}` : ''}

반드시 아래 형식으로만 응답하세요 (번호와 주제만, 설명 없이):
1. 주제1
2. 주제2
3. 주제3
4. 주제4
5. 주제5`,
    });

    const text = response.text || '';
    const topics = text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);

    return NextResponse.json({ topics });
  } catch (e: unknown) {
    console.error('suggest-topics error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('invalid') || msg.includes('401')) {
      return NextResponse.json({ error: 'Gemini API 키가 유효하지 않습니다. /settings 페이지에서 키를 확인해주세요.' }, { status: 401 });
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'Gemini API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }
    return NextResponse.json({ error: msg || '오류가 발생했습니다.' }, { status: 500 });
  }
}
