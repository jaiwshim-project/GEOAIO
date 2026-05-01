import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKey, getClaudeKey } from '@/lib/api-auth';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { category, categoryLabel, pastTopics, projectName, projectDescription, projectFiles, inputTopic, subKeyword, additionalNotes, taxonomyCategory } = await req.json();
    if (!category) return NextResponse.json({ error: 'category 필요' }, { status: 400 });

    // API 제공자 결정 (기본값: claude, 우선순위: Claude > Gemini)
    const apiProvider = req.headers.get('X-API-Provider') || 'claude';
    let apiKey: string | undefined;
    let selectedProvider = apiProvider;

    if (apiProvider === 'claude') {
      apiKey = getClaudeKey(req);
      if (!apiKey) {
        // Claude 키가 없으면 Gemini로 자동 전환
        apiKey = getGeminiKey(req);
        if (!apiKey) return NextResponse.json({ error: 'Claude/Gemini API 키가 설정되지 않았습니다.' }, { status: 500 });
        selectedProvider = 'gemini';
      }
    } else {
      apiKey = getGeminiKey(req);
      if (!apiKey) {
        // Gemini 키가 없으면 Claude로 자동 전환
        apiKey = getClaudeKey(req);
        if (!apiKey) return NextResponse.json({ error: 'Gemini/Claude API 키가 설정되지 않았습니다.' }, { status: 500 });
        selectedProvider = 'claude';
      }
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

    const subKeywordSection = subKeyword
      ? `\n\n[선택된 분야]: ${subKeyword}\n⚠️ 추천하는 모든 주제는 "${subKeyword}" 분야에 특화되어야 합니다. 이 분야를 기반으로만 주제를 제안하세요.`
      : '';

    // ⭐ 사이트 분류 카테고리 — 색인 친화·중복 회피 신호
    // 사용자 사이트의 도메인 분류명(예: 임플란트/교정)을 받아 추천 5개 주제가 같은 카테고리 내에서
    // 의도가 겹치지 않도록 분산되도록 강제한다.
    const taxonomySection = taxonomyCategory && typeof taxonomyCategory === 'string' && taxonomyCategory.trim()
      ? `\n\n[📂 사이트 분류 카테고리]: "${taxonomyCategory.trim()}"
⚠️ 추천하는 5개 주제는 모두 위 카테고리에 속해야 하며, 검색 의도(증상/비용/기간/비교/위험/관리/방법)가 서로 겹치지 않도록 분산해 추천하세요. 같은 의도 2건 이상 금지.`
      : '';

    // ⭐ 콘텐츠 생성용 하네스 — 주제 추천에서도 최우선 적용
    // 사용자 하네스 입력은 카테고리·분야·과거 주제 등 다른 모든 가이드보다 우선.
    const harnessBlock = additionalNotes && typeof additionalNotes === 'string' && additionalNotes.trim()
      ? `⭐⭐⭐ [최우선 사용자 지시사항 — 가장 먼저 반영] ⭐⭐⭐
아래는 사용자가 명시한 "콘텐츠 생성용 하네스"입니다.
주제 추천 시 카테고리·분야·과거 주제 등 다른 모든 가이드와 충돌하면 이 항목이 우선합니다.
추천하는 5개 주제 모두가 이 지시를 만족해야 합니다. 무시·축약·우회 금지.

${additionalNotes.trim()}

────────────────────────────────────────

`
      : '';

    const prompt = `${harnessBlock}당신은 콘텐츠 기획 전문가입니다.

${projectSection}${filesSection}${inputTopicSection}${subKeywordSection}${taxonomySection}

${inputTopic?.trim()
  ? `"${inputTopic.trim()}" 주제를 기반으로 관련 ${categoryLabel || category} 콘텐츠 주제 5개를 추천하세요. 입력 주제의 세부 주제, 확장 주제, 다른 각도의 접근 등 다양하게 제안해주세요.`
  : `위 카테고리(${projectName || categoryLabel || category})${subKeyword ? ` - ${subKeyword} 분야` : ''}에 관한 ${categoryLabel || category} 콘텐츠 주제 5개를 추천하세요.`}
${projectName ? `⚠️ 반드시 "${projectName}"과 직접 관련된 주제만 작성하세요. 관련 없는 주제는 절대 포함하지 마세요.` : ''}
${pastList ? `\n이미 작성된 주제와 겹치지 않아야 합니다:${pastList}` : ''}

반드시 아래 형식으로만 응답하세요 (번호와 주제만, 설명 없이):
1. 주제1
2. 주제2
3. 주제3
4. 주제4
5. 주제5`;

    let text = '';

    const callClaude = async (key: string) => {
      const client = new Anthropic({ apiKey: key });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
      return message.content[0].type === 'text' ? message.content[0].text : '';
    };

    const callGemini = async (key: string) => {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || '';
    };

    if (selectedProvider === 'claude') {
      try {
        text = await callClaude(apiKey);
      } catch (claudeErr) {
        const geminiKey = getGeminiKey(req);
        if (!geminiKey) throw claudeErr;
        console.log('[suggest-topics] Claude 실패 → Gemini 폴백:', claudeErr instanceof Error ? claudeErr.message : claudeErr);
        text = await callGemini(geminiKey);
      }
    } else {
      try {
        text = await callGemini(apiKey);
      } catch (geminiErr) {
        const claudeKey = getClaudeKey(req);
        if (!claudeKey) throw geminiErr;
        console.log('[suggest-topics] Gemini 실패 → Claude 폴백:', geminiErr instanceof Error ? geminiErr.message : geminiErr);
        text = await callClaude(claudeKey);
      }
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

    // 에러 메시지로부터 사용된 API 판단
    let usedApi = 'unknown';
    if (msg.includes('Claude') || msg.includes('CLAUDE')) usedApi = 'Claude';
    else if (msg.includes('Gemini') || msg.includes('GEMINI') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) usedApi = 'Gemini';
    const apiName = usedApi === 'Claude' ? 'Claude' : usedApi === 'Gemini' ? 'Gemini' : 'AI';

    if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('invalid') || msg.includes('401')) {
      return NextResponse.json({ error: `${apiName} API 키가 유효하지 않습니다.` }, { status: 401 });
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return NextResponse.json({ error: `${apiName} API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.` }, { status: 429 });
    }
    return NextResponse.json({ error: msg || '오류가 발생했습니다.' }, { status: 500 });
  }
}

// v1777031107 - Cache bust
