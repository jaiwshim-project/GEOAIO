import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getApiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 60;

const channelPrompts: Record<string, string> = {
  instagram: `인스타그램 게시물 형식으로 변환하세요:
- 첫 줄은 강렬한 후킹 문구 (이모지 포함)
- 핵심 내용을 짧은 문단으로 요약 (3-5개 포인트)
- 각 포인트에 적절한 이모지 사용
- 줄바꿈을 활용한 가독성 확보
- 마지막에 CTA(행동 유도 문구)
- 관련 해시태그 10-15개
- 전체 길이: 500-800자`,

  linkedin: `링크드인 게시물 형식으로 변환하세요:
- 전문적이고 인사이트 있는 톤
- 첫 3줄에 핵심 메시지 (접히기 전에 보이는 영역)
- 개인 경험이나 관점을 담은 서술
- 핵심 내용을 번호 매겨 정리
- 업계 전문가로서의 관점 제시
- 마지막에 질문이나 토론 유도
- 관련 해시태그 3-5개
- 전체 길이: 800-1200자`,

  naver_blog: `네이버 블로그 최적화 형식으로 변환하세요:
- SEO 최적화된 제목 (키워드 포함)
- 목차 포함
- 소제목(##)으로 섹션 구분
- 핵심 키워드 자연스럽게 반복 (3-5회)
- 이미지 삽입 위치 표시: [이미지: 설명]
- 결론에 핵심 요약
- 관련 태그 추천
- 전체 길이: 1500-2500자`,

  card_news: `카드뉴스(슬라이드) 형식으로 변환하세요:
각 슬라이드를 아래 형식으로 작성:

[슬라이드 1 - 표지]
제목: (강렬한 제목)
부제: (한 줄 설명)

[슬라이드 2-7 - 본문]
제목: (각 슬라이드 핵심 메시지)
내용: (2-3줄 설명)

[슬라이드 8 - 마무리]
제목: (CTA 문구)
내용: (행동 유도)

총 6-8장으로 구성. 각 슬라이드는 한 가지 핵심 메시지만 담으세요.`,

  summary: `핵심 요약본으로 변환하세요:
- 3줄 요약 (가장 중요한 내용)
- 핵심 키워드 5개
- 주요 포인트 3-5개 (불릿 포인트)
- 한 줄 결론
- 전체 길이: 300자 이내`,
};

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey(request);
    const { content, channel, title } = await request.json();

    if (!content?.trim() || !channel) {
      return withCors(NextResponse.json({ error: '콘텐츠와 채널을 지정해주세요.' }, { status: 400 }));
    }
    if (!apiKey) {
      return withCors(NextResponse.json(
        { error: 'API 키가 필요합니다. X-API-Key 헤더 또는 서버에 ANTHROPIC_API_KEY를 설정하세요.' },
        { status: 401 }
      ));
    }

    const prompt = channelPrompts[channel];
    if (!prompt) {
      return withCors(NextResponse.json({ error: '지원하지 않는 채널입니다.' }, { status: 400 }));
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `아래 콘텐츠를 지정된 형식으로 변환해주세요.

${prompt}

---
원본 제목: ${title || ''}
원본 콘텐츠:
${content.substring(0, 5000)}
---

변환된 콘텐츠만 출력하세요. 다른 설명은 불필요합니다.`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return withCors(NextResponse.json({ result: text, channel }));
  } catch (error) {
    console.error('Content conversion error:', error);
    return withCors(NextResponse.json(
      { error: error instanceof Error ? error.message : '콘텐츠 변환 중 오류가 발생했습니다.' },
      { status: 500 }
    ));
  }
}

// v1777031107 - Cache bust
