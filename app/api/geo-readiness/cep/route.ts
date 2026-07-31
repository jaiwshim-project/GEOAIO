// POST /api/geo-readiness/cep
// body: { url, businessContext?, weakChecks?: string[] }
//
// 페이지 본문을 수집해 CEP(Category Entry Point) 6~8개를 도출하고
// 각 상황에 콘텐츠가 얼마나 대응하는지(충분·부분·미대응) 평가 + Before/After 재작성안을 반환.
//
// LLM 필수 (Claude Haiku 4.5 → Sonnet 4.6 폴백). 키가 없으면 503과 안내를 반환한다.
// 본문은 서버가 대신 fetch 하며 Anthropic 외 어디에도 전송되지 않는다.

import { NextRequest, NextResponse } from 'next/server';
import { fetchPage, analyzeReadiness, extractPlainText, normalizeUrl } from '@/lib/geo-readiness';
import { auditCep } from '@/lib/geo-cep-audit';
import { getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: NextRequest) {
  // LLM 호출 비용 보호 — 분당 10회
  const limited = rateLimit(req, 10, 60_000);
  if (limited) return withCors(limited, req);

  let body: { url?: string; businessContext?: string; weakChecks?: string[] };
  try {
    body = await req.json();
  } catch {
    return withCors(NextResponse.json({ error: 'invalid json body' }, { status: 400 }), req);
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) return withCors(NextResponse.json({ error: 'url이 필요합니다.' }, { status: 400 }), req);

  const apiKey = getClaudeKey(req);
  if (!apiKey) {
    return withCors(NextResponse.json({
      error: 'LLM API 키가 없습니다. CEP 진단은 LLM이 필요합니다.',
      hint: 'ANTHROPIC_API_KEY 환경 변수를 설정하거나 X-Claude-Key 헤더로 본인 키를 전달하세요. 로컬 휴리스틱 15개 항목은 /api/geo-readiness/scan 으로 키 없이 진단할 수 있습니다.',
    }, { status: 503 }), req);
  }

  const url = normalizeUrl(rawUrl);
  const page = await fetchPage(url);

  if (page.status === 0 || (!page.html && page.error)) {
    return withCors(NextResponse.json({ error: `페이지를 가져올 수 없습니다: ${page.error || 'unknown'}` }, { status: 502 }), req);
  }

  const local = analyzeReadiness(page);
  const bodyText = extractPlainText(page.html, 12_000);

  if (bodyText.length < 200) {
    return withCors(NextResponse.json({
      error: '본문 텍스트가 200자 미만입니다. 클라이언트 JS로만 렌더되는 페이지라면 AI 크롤러도 본문을 읽지 못합니다.',
      local,
    }, { status: 422 }), req);
  }

  // 로컬 휴리스틱에서 약한 항목을 LLM에 힌트로 전달 — 중복 지적 대신 정성 분석에 집중하도록
  const weakChecks = body.weakChecks?.length
    ? body.weakChecks
    : local.checks.filter(c => c.score < 60).map(c => `${c.label} (${c.score}점): ${c.gaps.slice(0, 2).join(' / ')}`);

  try {
    const cep = await auditCep({
      url,
      title: local.meta.title,
      description: local.meta.description,
      headings: local.meta.headings,
      bodyText,
      businessContext: body.businessContext,
      weakChecks,
    }, apiKey);

    return withCors(NextResponse.json({ ok: true, url, local, cep }), req);
  } catch (e) {
    return withCors(NextResponse.json({
      error: e instanceof Error ? e.message : 'CEP 진단 실패',
      local, // LLM이 실패해도 로컬 휴리스틱 결과는 살려서 반환
    }, { status: 502 }), req);
  }
}
