import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract Anthropic API key from request.
 * Priority: process.env > X-API-Key header > Authorization Bearer
 */
export function getApiKey(request: NextRequest): string | undefined {
  // 서버 환경 변수를 먼저 시도
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  // 폴백: 클라이언트 헤더 또는 Authorization
  const xApiKey = request.headers.get('X-API-Key');
  if (xApiKey) return xApiKey;

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return undefined;
}

/**
 * Extract Gemini API key from request.
 * Priority: process.env.GEMINI_API_KEY > X-Gemini-Key header > body.geminiApiKey
 */
export function getGeminiKey(request: NextRequest, body?: Record<string, unknown>): string | undefined {
  // 서버 환경 변수를 먼저 시도 (신뢰할 수 있는 출처)
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) return envKey;

  // 폴백: 헤더 또는 body (테스트용)
  const headerKey = request.headers.get('X-Gemini-Key');
  if (headerKey) return headerKey;

  if (body && typeof body.geminiApiKey === 'string') return body.geminiApiKey;

  return undefined;
}

/**
 * Claude API 키 풀 — 환경변수에 여러 키 등록 시 분산 호출 (rate limit 회피)
 * 등록 가능: ANTHROPIC_API_KEY, ANTHROPIC_API_KEY_2, ANTHROPIC_API_KEY_3, CLAUDE_API_KEY 등
 * 호출마다 랜덤 픽 — 동시 요청도 키별로 분산.
 * 동시 사용자 다수 + 10톤 시리즈처럼 분당 호출이 폭증할 때 RPM 한도(Tier 1 Haiku 50 RPM)를 N배로 늘림.
 */
function getClaudeKeyPool(): string[] {
  const candidates = [
    process.env.ANTHROPIC_API_KEY,
    process.env.ANTHROPIC_API_KEY_2,
    process.env.ANTHROPIC_API_KEY_3,
    process.env.ANTHROPIC_API_KEY_4,
    process.env.ANTHROPIC_API_KEY_5,
    process.env.CLAUDE_API_KEY,
    process.env.CLAUDE_API_KEY_2,
    process.env.CLAUDE_API_KEY_3,
  ];
  // 빈 값·중복 제거
  return Array.from(new Set(candidates.filter((v): v is string => !!v && v.length > 0)));
}

/**
 * Extract Claude API key from request.
 * Priority: process.env 키 풀(랜덤 픽) > X-Claude-Key header (폴백용)
 * 주의: 클라이언트 헤더를 우선으로 사용하면 로컬 캐시된 키 문제 발생
 */
export function getClaudeKey(request: NextRequest): string | undefined {
  // 서버 환경 변수 풀에서 랜덤 픽 — rate limit 분산
  const pool = getClaudeKeyPool();
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 폴백: 클라이언트가 보낸 헤더 (디버깅/테스트용)
  const headerKey = request.headers.get('X-Claude-Key');
  if (headerKey) return headerKey;

  return undefined;
}

/**
 * 429/529(과부하) 응답 시 다음 키로 retry용 — 호출 측에서 사용.
 * 실패한 키를 제외하고 풀에서 다른 키를 반환. 모두 소진되면 undefined.
 */
export function getNextClaudeKey(failedKeys: Set<string>): string | undefined {
  const pool = getClaudeKeyPool();
  const remaining = pool.filter(k => !failedKeys.has(k));
  if (remaining.length === 0) return undefined;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

/**
 * Allowed origins for CORS.
 */
const ALLOWED_ORIGINS = [
  'https://www.geo-aio.com',
  'https://geo-aio.com',
  'https://aio-geo-optimizer.vercel.app',
  'https://ai-optimized-contents.vercel.app',
  'https://41-4-ai-optimized-contents.vercel.app',
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[];

function getAllowedOrigin(request?: NextRequest): string {
  const origin = request?.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // 로컬 개발 환경 허용
  if (origin.startsWith('http://localhost:')) return origin;
  return ALLOWED_ORIGINS[0];
}

/**
 * Add CORS headers to a response for external API access.
 */
export function withCors(response: NextResponse, request?: NextRequest): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(request));
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Gemini-Key, X-Claude-Key, X-API-Provider, Authorization');
  response.headers.set('Vary', 'Origin');
  return response;
}

/**
 * Create a standard OPTIONS response for CORS preflight.
 */
export function corsOptionsResponse(request?: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return withCors(response, request);
}
