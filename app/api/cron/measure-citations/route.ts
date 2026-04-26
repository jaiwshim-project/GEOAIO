import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendAlert } from '@/lib/notify';

export const maxDuration = 300; // Vercel Pro 기준 최대 5분
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

type Engine = 'perplexity' | 'chatgpt_search';

interface AbTarget {
  id: string;
  pair_id: string;
  query: string;
  applied_url: string;
  applied_text_match: string | null;
  skipped_url: string | null;
  skipped_text_match: string | null;
  engines: string[] | null;
  blog_article_id: string | null;
  active: boolean;
  last_measured_at: string | null;
  measure_count: number;
}

interface MeasureOutcome {
  pair_id: string;
  engine: Engine;
  cited: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 인용 판정 helper
// ─────────────────────────────────────────────────────────────────────────────

function detectCitation(
  responseText: string,
  appliedUrl: string,
  appliedTextMatch: string | null
): { cited: boolean; snippet: string | null } {
  if (!responseText) return { cited: false, snippet: null };

  let matchIndex = -1;
  let matchedToken = '';

  if (appliedUrl && responseText.includes(appliedUrl)) {
    matchIndex = responseText.indexOf(appliedUrl);
    matchedToken = appliedUrl;
  } else if (appliedTextMatch && responseText.includes(appliedTextMatch)) {
    matchIndex = responseText.indexOf(appliedTextMatch);
    matchedToken = appliedTextMatch;
  }

  if (matchIndex === -1) {
    return { cited: false, snippet: null };
  }

  const start = Math.max(0, matchIndex - 100);
  const end = Math.min(responseText.length, matchIndex + matchedToken.length + 100);
  return { cited: true, snippet: responseText.slice(start, end) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine 호출 (각각 raw response + 추출 텍스트 반환)
// ─────────────────────────────────────────────────────────────────────────────

async function callPerplexity(
  query: string,
  apiKey: string
): Promise<{ text: string; raw: any }> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
    }),
  });
  const raw = await res.json();
  if (!res.ok) {
    throw new Error(
      `Perplexity ${res.status}: ${typeof raw === 'object' ? JSON.stringify(raw) : String(raw)}`
    );
  }
  const text: string = raw?.choices?.[0]?.message?.content ?? '';
  return { text, raw };
}

async function callChatGptSearch(
  query: string,
  apiKey: string
): Promise<{ text: string; raw: any }> {
  // OpenAI Responses API + web_search tool
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: query,
      tools: [{ type: 'web_search' }],
    }),
  });
  const raw = await res.json();
  if (!res.ok) {
    throw new Error(
      `OpenAI ${res.status}: ${typeof raw === 'object' ? JSON.stringify(raw) : String(raw)}`
    );
  }

  // Responses API 응답 텍스트 추출 (output_text 우선, output 배열 fallback)
  let text = '';
  if (typeof raw?.output_text === 'string') {
    text = raw.output_text;
  } else if (Array.isArray(raw?.output)) {
    for (const item of raw.output) {
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if (typeof c?.text === 'string') text += c.text + '\n';
          else if (typeof c?.text?.value === 'string') text += c.text.value + '\n';
        }
      }
    }
  }
  return { text, raw };
}

// ─────────────────────────────────────────────────────────────────────────────
// Target 단위 처리: 모든 engine 측정 + cep_ab_results INSERT + last_measured_at UPDATE
// ─────────────────────────────────────────────────────────────────────────────

async function processTarget(
  supabase: SupabaseClient,
  target: AbTarget,
  apiKeys: { perplexity?: string; openai?: string }
): Promise<MeasureOutcome[]> {
  const engines: Engine[] = ((target.engines && target.engines.length > 0)
    ? target.engines
    : ['perplexity', 'chatgpt_search']) as Engine[];

  const results: MeasureOutcome[] = [];

  for (const engine of engines) {
    try {
      let text = '';
      let raw: any = null;

      if (engine === 'perplexity') {
        if (!apiKeys.perplexity) {
          console.warn('[cron measure-citations] PERPLEXITY_API_KEY 미설정 — skip');
          results.push({
            pair_id: target.pair_id,
            engine,
            cited: false,
            error: 'missing_api_key',
          });
          continue;
        }
        const out = await callPerplexity(target.query, apiKeys.perplexity);
        text = out.text;
        raw = out.raw;
      } else if (engine === 'chatgpt_search') {
        if (!apiKeys.openai) {
          console.warn('[cron measure-citations] OPENAI_API_KEY 미설정 — skip');
          results.push({
            pair_id: target.pair_id,
            engine,
            cited: false,
            error: 'missing_api_key',
          });
          continue;
        }
        const out = await callChatGptSearch(target.query, apiKeys.openai);
        text = out.text;
        raw = out.raw;
      } else {
        console.warn('[cron measure-citations] unknown engine', engine);
        continue;
      }

      const { cited, snippet } = detectCitation(
        text,
        target.applied_url,
        target.applied_text_match
      );

      const { error: insertErr } = await supabase.from('cep_ab_results').insert({
        pair_id: target.pair_id,
        variant: 'cep_applied',
        content_id: target.blog_article_id,
        scene_sentence: null,
        cep_keyword: target.query,
        query: target.query,
        search_engine: engine,
        cited,
        citation_position: null,
        citation_snippet: snippet,
        source_url: target.applied_url,
        raw_response: raw,
      });

      if (insertErr) {
        console.error('[cron measure-citations] insert error', insertErr);
        results.push({
          pair_id: target.pair_id,
          engine,
          cited,
          error: `insert_failed: ${insertErr.message}`,
        });
      } else {
        results.push({ pair_id: target.pair_id, engine, cited });
      }
    } catch (err: any) {
      console.error('[cron measure-citations] engine error', engine, err?.message || err);
      results.push({
        pair_id: target.pair_id,
        engine,
        cited: false,
        error: String(err?.message || err),
      });
    }
  }

  // target last_measured_at / measure_count 업데이트 (engine별 성공 여부와 무관하게 진행)
  const { error: updateErr } = await supabase
    .from('cep_ab_targets')
    .update({
      last_measured_at: new Date().toISOString(),
      measure_count: (target.measure_count || 0) + 1,
    })
    .eq('id', target.id);

  if (updateErr) {
    console.error('[cron measure-citations] target update error', updateErr);
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET 핸들러 (Vercel Cron 호출)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const startedAt = Date.now();

  // 1. 인증
  const authHeader = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2. 환경 검사
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'supabase_env_missing' },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. limit 파싱
  const url = new URL(req.url);
  const limitParam = parseInt(url.searchParams.get('limit') || '5', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 50
    ? limitParam
    : 5;

  // 4. 큐 조회: active=true AND (last_measured_at IS NULL OR last_measured_at < now() - 7일)
  const cutoffIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: targets, error: selectErr } = await supabase
    .from('cep_ab_targets')
    .select('*')
    .eq('active', true)
    .or(`last_measured_at.is.null,last_measured_at.lt.${cutoffIso}`)
    .order('last_measured_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (selectErr) {
    console.error('[cron measure-citations] select error', selectErr);
    return NextResponse.json(
      { error: 'select_failed', detail: selectErr.message },
      { status: 500 }
    );
  }

  const apiKeys = {
    perplexity: process.env.PERPLEXITY_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  };

  // 5. 병렬 처리 (Promise.allSettled — 한 target 실패해도 나머지 진행)
  const settled = await Promise.allSettled(
    (targets || []).map((t) =>
      processTarget(supabase, t as AbTarget, apiKeys)
    )
  );

  const results: MeasureOutcome[] = [];
  let processed = 0;
  let skipped = 0;

  settled.forEach((s, idx) => {
    if (s.status === 'fulfilled') {
      processed += 1;
      results.push(...s.value);
    } else {
      skipped += 1;
      const t = targets?.[idx];
      console.error('[cron measure-citations] target failed', t?.pair_id, s.reason);
      results.push({
        pair_id: t?.pair_id || 'unknown',
        engine: 'perplexity',
        cited: false,
        error: String(s.reason?.message || s.reason),
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 알림: 실패율 ≥ 30%이고 표본 ≥ 3일 때 webhook 발송 (fire-and-forget)
  // ───────────────────────────────────────────────────────────────────────────
  const errors = results.filter((r) => !!r.error).length;
  const errorRate = results.length > 0 ? errors / results.length : 0;
  const cited = results.filter((r) => r.cited).length;
  const citedRate = results.length > 0 ? cited / results.length : 0;

  if (results.length >= 3 && errorRate >= 0.3) {
    sendAlert({
      title: 'CEP 측정 cron 실패율 경보',
      level: 'error',
      message: `측정 ${results.length}건 중 ${errors}건 실패 (${(errorRate * 100).toFixed(1)}%) — Perplexity/OpenAI 키·할당량·Supabase 연결 점검 필요`,
      context: {
        processed,
        skipped,
        total_results: results.length,
        errors,
        error_rate: errorRate,
        cited,
        cited_rate: citedRate,
        sample_errors: results.filter((r) => r.error).slice(0, 3),
      },
    }).catch((e) => console.error('[cron measure-citations] sendAlert failed', e));
  }

  return NextResponse.json({
    processed,
    skipped,
    total: targets?.length || 0,
    results,
    error_rate: errorRate,
    cited_rate: citedRate,
    duration_ms: Date.now() - startedAt,
  });
}
