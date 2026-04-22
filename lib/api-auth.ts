import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract Anthropic API key from request.
 * Priority: X-API-Key header > Authorization Bearer > process.env
 */
export function getApiKey(request: NextRequest): string | undefined {
  const xApiKey = request.headers.get('X-API-Key');
  if (xApiKey) return xApiKey;

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return process.env.ANTHROPIC_API_KEY;
}

/**
 * Extract Gemini API key from request.
 * Priority: X-Gemini-Key header > body.geminiApiKey > process.env
 */
export function getGeminiKey(request: NextRequest, body?: Record<string, unknown>): string | undefined {
  const headerKey = request.headers.get('X-Gemini-Key');
  if (headerKey) return headerKey;

  if (body && typeof body.geminiApiKey === 'string') return body.geminiApiKey;

  return process.env.GEMINI_API_KEY;
}

/**
 * Extract Claude API key from request.
 * Priority: X-Claude-Key header > process.env.CLAUDE_API_KEY
 */
export function getClaudeKey(request: NextRequest): string | undefined {
  const headerKey = request.headers.get('X-Claude-Key');
  if (headerKey) return headerKey;

  return process.env.CLAUDE_API_KEY;
}

/**
 * Allowed origins for CORS.
 */
const ALLOWED_ORIGINS = [
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
