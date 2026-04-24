import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateContent, analyzeContent, optimizeContent } from '@/lib/claude';
import { generateMockAnalysis } from '@/lib/analyzer';
import { getApiKey, getGeminiKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import type { GenerateRequest, AnalysisRequest, OptimizeRequest } from '@/lib/types';

export const maxDuration = 60;

type WebhookAction = 'generate' | 'analyze' | 'optimize' | 'convert' | 'keyword-analysis' | 'generate-series';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey(request);
    if (!apiKey) {
      return withCors(NextResponse.json(
        { error: 'API 키가 필요합니다. X-API-Key 또는 Authorization: Bearer 헤더로 전달하세요.' },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const { action, ...params } = body as { action: WebhookAction } & Record<string, any>;

    if (!action) {
      return withCors(NextResponse.json(
        {
          error: 'action 필드가 필요합니다.',
          availableActions: ['generate', 'analyze', 'optimize', 'convert', 'keyword-analysis', 'generate-series'],
        },
        { status: 400 }
      ));
    }

    let result: unknown;

    switch (action) {
      case 'generate':
        result = await generateContent(params as GenerateRequest, apiKey);
        break;

      case 'analyze':
        try {
          result = await analyzeContent(params as AnalysisRequest, apiKey);
        } catch {
          result = generateMockAnalysis(
            (params as AnalysisRequest).content,
            (params as AnalysisRequest).targetKeyword
          );
        }
        break;

      case 'optimize':
        result = await optimizeContent(params as OptimizeRequest, apiKey);
        break;

      case 'convert': {
        const { content, channel, title } = params as { content: string; channel: string; title?: string };
        if (!content?.trim() || !channel) {
          return withCors(NextResponse.json({ error: 'content와 channel이 필요합니다.' }, { status: 400 }));
        }
        const client = new Anthropic({ apiKey });
        const channelPrompts: Record<string, string> = {
          instagram: '인스타그램 게시물 형식으로 변환 (이모지, 해시태그 10-15개, 500-800자)',
          linkedin: '링크드인 전문적 톤, 핵심 메시지 상단, 해시태그 3-5개, 800-1200자',
          naver_blog: '네이버 블로그 SEO 최적화, 목차, 소제목, 키워드 반복, 1500-2500자',
          card_news: '카드뉴스 6-8장 슬라이드 형식',
          summary: '핵심 요약 300자 이내, 키워드 5개, 포인트 3-5개',
        };
        const prompt = channelPrompts[channel];
        if (!prompt) {
          return withCors(NextResponse.json({ error: `지원하지 않는 채널: ${channel}` }, { status: 400 }));
        }
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: `${prompt}\n\n원본 제목: ${title || ''}\n원본 콘텐츠:\n${String(content).substring(0, 5000)}\n\n변환된 콘텐츠만 출력하세요.` }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        result = { result: text, channel };
        break;
      }

      case 'keyword-analysis': {
        const { keyword, industry } = params as { keyword: string; industry?: string };
        if (!keyword?.trim()) {
          return withCors(NextResponse.json({ error: 'keyword가 필요합니다.' }, { status: 400 }));
        }
        const kwClient = new Anthropic({ apiKey });
        const kwResponse = await kwClient.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{ role: 'user', content: `GEO/AIO 전문가로서 키워드 "${keyword}"${industry ? ` (산업: ${industry})` : ''} 경쟁 분석을 JSON으로 응답: { keyword, difficulty, difficultyScore, searchIntent, aiCitationFactors, mustCoverTopics, differentiationStrategies, contentRecommendations, relatedKeywords, competitorInsights }` }],
        });
        const kwText = kwResponse.content[0].type === 'text' ? kwResponse.content[0].text : '';
        const kwMatch = kwText.match(/\{[\s\S]*\}/);
        result = kwMatch ? JSON.parse(kwMatch[0]) : { error: '파싱 실패' };
        break;
      }

      case 'generate-series': {
        const { topic, industry: seriesIndustry, count, additionalNotes: notes } = params as {
          topic: string; industry?: string; count?: number; additionalNotes?: string;
        };
        if (!topic?.trim()) {
          return withCors(NextResponse.json({ error: 'topic이 필요합니다.' }, { status: 400 }));
        }
        const episodeCount = Math.min(Math.max(count || 7, 3), 12);
        const seriesClient = new Anthropic({ apiKey });
        const seriesResponse = await seriesClient.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: `GEO/AIO 콘텐츠 전략가로서 "${topic}"${seriesIndustry ? ` (산업: ${seriesIndustry})` : ''}${notes ? ` 추가: ${notes}` : ''} 주제로 ${episodeCount}편 시리즈 기획안을 JSON으로 응답: { seriesTitle, seriesDescription, targetAudience, episodes[{number,title,subtitle,summary,targetKeywords,keyPoints,internalLinks,estimatedLength}], linkingStrategy, publishingSchedule, expectedOutcome }` }],
        });
        const seriesText = seriesResponse.content[0].type === 'text' ? seriesResponse.content[0].text : '';
        const seriesMatch = seriesText.match(/\{[\s\S]*\}/);
        result = seriesMatch ? JSON.parse(seriesMatch[0]) : { error: '파싱 실패' };
        break;
      }

      default:
        return withCors(NextResponse.json(
          { error: `알 수 없는 action: ${action}`, availableActions: ['generate', 'analyze', 'optimize', 'convert', 'keyword-analysis', 'generate-series'] },
          { status: 400 }
        ));
    }

    return withCors(NextResponse.json({ success: true, action, result }));
  } catch (error) {
    console.error('Webhook error:', error);
    return withCors(NextResponse.json(
      { error: error instanceof Error ? error.message : '웹훅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    ));
  }
}

// v1777031107 - Cache bust
