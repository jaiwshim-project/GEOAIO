import { NextRequest, NextResponse } from 'next/server';
import { saveApiKey, getApiKey } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, geminiApiKey } = await request.json();

    // Claude API Key 처리 (Supabase 저장)
    if (apiKey !== undefined) {
      if (apiKey && !apiKey.startsWith('sk-ant-')) {
        return NextResponse.json(
          { error: 'sk-ant- 로 시작하는 유효한 Claude API Key를 입력해주세요.' },
          { status: 400 }
        );
      }
      if (apiKey) {
        await saveApiKey('claude', apiKey);
        process.env.ANTHROPIC_API_KEY = apiKey;
      }
    }

    // Gemini API Key 처리 (Supabase 저장)
    if (geminiApiKey !== undefined) {
      if (!geminiApiKey || geminiApiKey.trim().length < 10) {
        return NextResponse.json(
          { error: '유효한 Gemini API Key를 입력해주세요.' },
          { status: 400 }
        );
      }
      await saveApiKey('gemini', geminiApiKey);
      process.env.GEMINI_API_KEY = geminiApiKey;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Key 저장 오류:', error);
    return NextResponse.json({ error: 'API Key 저장에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const claudeKey = await getApiKey('claude');
    const geminiKey = await getApiKey('gemini');
    return NextResponse.json({
      hasKey: !!claudeKey,
      hasGeminiKey: !!geminiKey,
      claudeKey: claudeKey || undefined,
      geminiKey: geminiKey || undefined
    });
  } catch (error) {
    console.error('API Key 조회 오류:', error);
    return NextResponse.json({ hasKey: false, hasGeminiKey: false }, { status: 200 });
  }
}
