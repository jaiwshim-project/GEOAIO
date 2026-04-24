import { NextRequest, NextResponse } from 'next/server';
import { generateContentImages } from '@/lib/gemini-image';
import { getGeminiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title } = body;

    if (!content || !title) {
      return withCors(NextResponse.json({ error: '콘텐츠와 제목이 필요합니다.' }, { status: 400 }));
    }

    const apiKey = getGeminiKey(request, body);
    if (!apiKey) {
      return withCors(NextResponse.json(
        { error: 'Gemini API 키가 필요합니다. X-Gemini-Key 헤더 또는 서버에 GEMINI_API_KEY를 설정하세요.' },
        { status: 401 }
      ));
    }

    const images = await generateContentImages(content, title, apiKey);
    return withCors(NextResponse.json({ images }));
  } catch (error) {
    console.error('Image generation error:', error);
    return withCors(NextResponse.json(
      { error: error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    ));
  }
}

// v1777031107 - Cache bust
