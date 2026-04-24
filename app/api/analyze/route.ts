import { NextRequest, NextResponse } from 'next/server';
import type { AnalysisRequest } from '@/lib/types';
import { analyzeContent } from '@/lib/claude';
import { generateMockAnalysis } from '@/lib/analyzer';
import { getApiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey(request);
    const body = (await request.json()) as AnalysisRequest;

    if (!body.content || body.content.trim().length === 0) {
      return withCors(NextResponse.json({ error: '콘텐츠를 입력해주세요.' }, { status: 400 }));
    }

    // API 키가 있으면 실제 분석, 없으면 규칙 기반 분석
    if (apiKey) {
      try {
        const result = await analyzeContent(body, apiKey);
        return withCors(NextResponse.json(result));
      } catch (apiError) {
        console.error('Claude API 오류, 규칙 기반 분석으로 대체:', apiError);
        const fallback = generateMockAnalysis(body.content, body.targetKeyword);
        return withCors(NextResponse.json(fallback));
      }
    } else {
      const result = generateMockAnalysis(body.content, body.targetKeyword);
      return withCors(NextResponse.json(result));
    }
  } catch (error) {
    console.error('분석 오류:', error);
    return withCors(NextResponse.json({ error: '분석 중 오류가 발생했습니다.' }, { status: 500 }));
  }
}

// v1777031107 - Cache bust
