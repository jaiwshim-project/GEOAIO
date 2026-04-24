import { NextRequest, NextResponse } from 'next/server';
import type { OptimizeRequest } from '@/lib/types';
import { optimizeContent } from '@/lib/claude';
import { getApiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey(request);
    const body = (await request.json()) as OptimizeRequest;

    if (!body.originalContent || body.originalContent.trim().length === 0) {
      return withCors(NextResponse.json({ error: '원본 콘텐츠가 필요합니다.' }, { status: 400 }));
    }

    if (!apiKey) {
      return withCors(NextResponse.json(
        { error: 'API 키가 필요합니다. X-API-Key 헤더 또는 서버에 ANTHROPIC_API_KEY를 설정하세요.' },
        { status: 401 }
      ));
    }

    const result = await optimizeContent(body, apiKey);
    return withCors(NextResponse.json(result));
  } catch (error) {
    console.error('최적화 변환 오류:', error);
    return withCors(NextResponse.json({ error: '콘텐츠 최적화 중 오류가 발생했습니다.' }, { status: 500 }));
  }
}

// v1777031107 - Cache bust
