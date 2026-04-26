import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors, corsOptionsResponse } from '@/lib/api-auth';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request);
}

type GenerateResultMetadataCep = {
  sceneSentence?: string;
  cepKeyword?: string;
  searchPath?: unknown;
  cepTask?: string;
  [k: string]: unknown;
};

type HistoryRow = {
  id: string;
  generate_result: {
    metadata?: { cep?: GenerateResultMetadataCep | null } | null;
    [k: string]: unknown;
  } | null;
  created_at: string;
};

function authorize(request: NextRequest): NextResponse | null {
  // 환경 변수: ADMIN_PASSWORD 우선, ADMIN_DASH_PASS 폴백 (호환)
  const expected = process.env.ADMIN_PASSWORD || process.env.ADMIN_DASH_PASS;
  if (!expected) {
    return withCors(
      NextResponse.json(
        { error: 'ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.' },
        { status: 401 }
      ),
      request
    );
  }
  // 헤더: X-Admin-Password 우선, X-Admin-Pass 폴백 (다른 admin route와 통일)
  const provided =
    request.headers.get('X-Admin-Password') ||
    request.headers.get('X-Admin-Pass');
  if (!provided || provided !== expected) {
    return withCors(
      NextResponse.json({ error: '관리자 인증 실패' }, { status: 401 }),
      request
    );
  }
  return null;
}

function buildSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !serviceKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function toDateKey(iso: string): string {
  // YYYY-MM-DD (UTC 기준)
  return iso.slice(0, 10);
}

function extractCep(row: HistoryRow): GenerateResultMetadataCep | null {
  const cep = row.generate_result?.metadata?.cep;
  if (!cep || typeof cep !== 'object') return null;
  return cep as GenerateResultMetadataCep;
}

function pickKeyword(cep: GenerateResultMetadataCep): string | null {
  const k = cep.cepKeyword;
  if (typeof k === 'string' && k.trim()) return k.trim();
  // 폴백: sceneSentence의 첫 단어 사용
  const s = cep.sceneSentence;
  if (typeof s === 'string' && s.trim()) {
    const first = s.trim().split(/\s+/)[0];
    if (first) return first;
  }
  return null;
}

// ============================================================
// 신규: 블로그/인용률 집계 헬퍼
// ============================================================

type BlogRow = {
  id: string;
  metadata: { cep?: unknown; [k: string]: unknown } | null;
  author: string | null;
  created_at: string;
};

type CepAbResultRow = {
  variant: string | null;
  search_engine: string | null;
  cited: boolean | null;
  created_at: string;
};

type DailySlot = { date: string; cep: number; total: number };
type CitationDailySlot = {
  date: string;
  measurements: number;
  cited: number;
  rate: number;
};

function buildEmptyDailySlots(days: number): Map<string, DailySlot> {
  const map = new Map<string, DailySlot>();
  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, { date: key, cep: 0, total: 0 });
  }
  return map;
}

function buildEmptyCitationSlots(days: number): Map<string, CitationDailySlot> {
  const map = new Map<string, CitationDailySlot>();
  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key))
      map.set(key, { date: key, measurements: 0, cited: 0, rate: 0 });
  }
  return map;
}

function ratio4(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

function hasCepObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  // cep 객체가 비어있지 않은 경우만 적용으로 판단
  return Object.keys(value as Record<string, unknown>).length > 0;
}

function extractBlogCep(row: BlogRow): boolean {
  // 1순위: metadata.cep
  const directCep = row.metadata?.cep;
  if (hasCepObject(directCep)) return true;

  // 2순위: author 필드를 JSON parse → metadata.cep 폴백
  if (typeof row.author === 'string' && row.author.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(row.author) as {
        metadata?: { cep?: unknown } | null;
      };
      if (hasCepObject(parsed?.metadata?.cep)) return true;
    } catch {
      // JSON parse 실패는 무시
    }
  }
  return false;
}

type BlogAggregate = {
  total_articles: number;
  cep_applied: number;
  cep_skipped: number;
  adoption_rate: number;
  daily_trend: DailySlot[];
};

function emptyBlogAggregate(days: number): BlogAggregate {
  return {
    total_articles: 0,
    cep_applied: 0,
    cep_skipped: 0,
    adoption_rate: 0,
    daily_trend: [...buildEmptyDailySlots(days).values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  };
}

function aggregateBlog(rows: BlogRow[], days: number): BlogAggregate {
  const dailyMap = buildEmptyDailySlots(days);
  let applied = 0;

  for (const row of rows) {
    const dateKey = toDateKey(row.created_at);
    const slot = dailyMap.get(dateKey) || {
      date: dateKey,
      cep: 0,
      total: 0,
    };
    slot.total += 1;
    if (extractBlogCep(row)) {
      applied += 1;
      slot.cep += 1;
    }
    dailyMap.set(dateKey, slot);
  }

  const total = rows.length;
  return {
    total_articles: total,
    cep_applied: applied,
    cep_skipped: total - applied,
    adoption_rate: ratio4(applied, total),
    daily_trend: [...dailyMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  };
}

type CitationEngineStat = {
  measurements: number;
  cited: number;
  rate: number;
};

type CitationAggregate = {
  total_targets: number;
  total_measurements: number;
  cited_count: number;
  cited_rate: number;
  by_engine: {
    perplexity: CitationEngineStat;
    chatgpt_search: CitationEngineStat;
  };
  daily_trend: CitationDailySlot[];
};

function emptyCitationAggregate(days: number): CitationAggregate {
  return {
    total_targets: 0,
    total_measurements: 0,
    cited_count: 0,
    cited_rate: 0,
    by_engine: {
      perplexity: { measurements: 0, cited: 0, rate: 0 },
      chatgpt_search: { measurements: 0, cited: 0, rate: 0 },
    },
    daily_trend: [...buildEmptyCitationSlots(days).values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  };
}

function aggregateCitation(
  rows: CepAbResultRow[],
  totalTargets: number,
  days: number
): CitationAggregate {
  const dailyMap = buildEmptyCitationSlots(days);
  const engines: Record<string, CitationEngineStat> = {
    perplexity: { measurements: 0, cited: 0, rate: 0 },
    chatgpt_search: { measurements: 0, cited: 0, rate: 0 },
  };
  let totalMeasurements = 0;
  let citedCount = 0;

  for (const row of rows) {
    totalMeasurements += 1;
    const isCited = row.cited === true;
    if (isCited) citedCount += 1;

    const dateKey = toDateKey(row.created_at);
    const slot = dailyMap.get(dateKey) || {
      date: dateKey,
      measurements: 0,
      cited: 0,
      rate: 0,
    };
    slot.measurements += 1;
    if (isCited) slot.cited += 1;
    dailyMap.set(dateKey, slot);

    const engineKey =
      typeof row.search_engine === 'string' ? row.search_engine : '';
    if (engineKey === 'perplexity' || engineKey === 'chatgpt_search') {
      const eng = engines[engineKey];
      eng.measurements += 1;
      if (isCited) eng.cited += 1;
    }
  }

  // 일별 rate 계산
  const dailyArray = [...dailyMap.values()].map((slot) => ({
    ...slot,
    rate: ratio4(slot.cited, slot.measurements),
  }));
  dailyArray.sort((a, b) => a.date.localeCompare(b.date));

  // engine rate 계산
  for (const k of Object.keys(engines)) {
    engines[k].rate = ratio4(engines[k].cited, engines[k].measurements);
  }

  return {
    total_targets: totalTargets,
    total_measurements: totalMeasurements,
    cited_count: citedCount,
    cited_rate: ratio4(citedCount, totalMeasurements),
    by_engine: {
      perplexity: engines.perplexity,
      chatgpt_search: engines.chatgpt_search,
    },
    daily_trend: dailyArray,
  };
}

async function handle(request: NextRequest) {
  const authFail = authorize(request);
  if (authFail) return authFail;

  try {
    const url = new URL(request.url);
    const daysParam = Number(url.searchParams.get('days') || 14);
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 14;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const fromIso = fromDate.toISOString();

    const supa = buildSupabase();

    // === 신규: history + blog_articles + cep_ab_results + cep_ab_targets 병렬 조회 ===
    // 어느 한 쿼리가 실패해도 나머지는 정상 응답되도록 Promise.allSettled 사용
    const [historyRes, blogRes, abResultsRes, abTargetsRes] =
      await Promise.allSettled([
        supa
          .from('history')
          .select('id, generate_result, created_at')
          .eq('type', 'generation')
          .gte('created_at', fromIso),
        supa
          .from('blog_articles')
          .select('id, metadata, author, created_at')
          .gte('created_at', fromIso),
        supa
          .from('cep_ab_results')
          .select('variant, search_engine, cited, created_at')
          .gte('created_at', fromIso),
        supa
          .from('cep_ab_targets')
          .select('id', { count: 'exact', head: true })
          .eq('active', true),
      ]);

    // history는 기존 동작 유지 (실패 시 5xx 반환)
    if (historyRes.status !== 'fulfilled') {
      return withCors(
        NextResponse.json(
          {
            error:
              historyRes.reason instanceof Error
                ? historyRes.reason.message
                : 'history 조회 실패',
          },
          { status: 500 }
        ),
        request
      );
    }
    const { data, error } = historyRes.value;
    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message || 'history 조회 실패' },
          { status: 500 }
        ),
        request
      );
    }

    const rows: HistoryRow[] = (data || []) as HistoryRow[];
    const total = rows.length;

    let applied = 0;
    const keywordCounts = new Map<string, number>();
    const dailyMap = new Map<string, { date: string; cep: number; total: number }>();

    // 일별 슬롯 미리 생성 (오래된 → 최신, days+1개)
    for (let i = days; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { date: key, cep: 0, total: 0 });
      }
    }

    for (const row of rows) {
      const dateKey = toDateKey(row.created_at);
      const slot = dailyMap.get(dateKey) || { date: dateKey, cep: 0, total: 0 };
      slot.total += 1;

      const cep = extractCep(row);
      if (cep) {
        applied += 1;
        slot.cep += 1;
        const kw = pickKeyword(cep);
        if (kw) {
          keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
        }
      }
      dailyMap.set(dateKey, slot);
    }

    const skipped = total - applied;
    const adoption_rate =
      total > 0 ? Math.round((applied / total) * 10000) / 10000 : 0;

    const top_cep_keywords = [...keywordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    const daily_trend = [...dailyMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // === 신규: blog_articles 집계 (실패 시 빈 응답) ===
    let blogAggregate: BlogAggregate;
    if (
      blogRes.status === 'fulfilled' &&
      !blogRes.value.error &&
      Array.isArray(blogRes.value.data)
    ) {
      blogAggregate = aggregateBlog(
        blogRes.value.data as BlogRow[],
        days
      );
    } else {
      blogAggregate = emptyBlogAggregate(days);
    }

    // === 신규: cep_ab_results + cep_ab_targets 집계 (실패 시 빈 응답) ===
    let totalTargets = 0;
    if (
      abTargetsRes.status === 'fulfilled' &&
      !abTargetsRes.value.error &&
      typeof abTargetsRes.value.count === 'number'
    ) {
      totalTargets = abTargetsRes.value.count;
    }

    let citationAggregate: CitationAggregate;
    if (
      abResultsRes.status === 'fulfilled' &&
      !abResultsRes.value.error &&
      Array.isArray(abResultsRes.value.data)
    ) {
      citationAggregate = aggregateCitation(
        abResultsRes.value.data as CepAbResultRow[],
        totalTargets,
        days
      );
    } else {
      citationAggregate = emptyCitationAggregate(days);
      citationAggregate.total_targets = totalTargets;
    }

    // === 신규: 이상 신호 검출 (citation 일별 인용률 z-score) ===
    const { detectRateAnomaly } = await import('@/lib/notify');
    const citationAnomaly = detectRateAnomaly(
      citationAggregate.daily_trend.map((d) => ({
        date: d.date,
        rate: d.rate,
        measurements: d.measurements,
      })),
      2 // ±2σ 임계
    );
    const anomalies: Array<Record<string, unknown>> = [];
    if (citationAnomaly) anomalies.push(citationAnomaly);

    return withCors(
      NextResponse.json({
        period_days: days,
        total_generations: total,
        cep_applied: applied,
        cep_skipped: skipped,
        adoption_rate,
        top_cep_keywords,
        daily_trend,
        blog: blogAggregate,
        citation: citationAggregate,
        anomalies,
      }),
      request
    );
  } catch (err) {
    return withCors(
      NextResponse.json(
        { error: err instanceof Error ? err.message : '서버 오류' },
        { status: 500 }
      ),
      request
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
