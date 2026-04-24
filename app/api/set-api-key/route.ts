import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, geminiApiKey } = await request.json();

    // Claude API Key 처리
    if (apiKey !== undefined) {
      if (apiKey && !apiKey.startsWith('sk-ant-')) {
        return NextResponse.json(
          { error: 'sk-ant- 로 시작하는 유효한 Claude API Key를 입력해주세요.' },
          { status: 400 }
        );
      }
      if (apiKey) {
        process.env.ANTHROPIC_API_KEY = apiKey;
      }
    }

    // Gemini API Key 처리
    if (geminiApiKey !== undefined) {
      if (!geminiApiKey || geminiApiKey.trim().length < 10) {
        return NextResponse.json(
          { error: '유효한 Gemini API Key를 입력해주세요.' },
          { status: 400 }
        );
      }
      process.env.GEMINI_API_KEY = geminiApiKey;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Key 저장 오류:', error);
    return NextResponse.json({ error: 'API Key 저장에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  return NextResponse.json({
    hasKey: !!claudeKey,
    hasGeminiKey: !!geminiKey,
    status: '✅ 환경변수 기반 API 키 관리'
  });
}

// v1777031107 - Cache bust
