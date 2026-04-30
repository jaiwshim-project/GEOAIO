// Google Search Console REST API 클라이언트 (의존성 없이 fetch 직접 호출)
// 사용 API:
//  - URL Inspection API: 페이지별 색인 상태
//  - Search Analytics API: 노출/클릭 추이
//  - OAuth2 Token: refresh_token으로 access_token 발급
//
// 환경 변수:
//  - GSC_CLIENT_ID, GSC_CLIENT_SECRET (Google Cloud OAuth 2.0 Client)
//  - GSC_REFRESH_TOKEN (사이트 소유자 동의 1회 후 발급)
// 토큰이 없으면 mock 데이터 반환 (대시보드 빈 상태 회피).

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
const ANALYTICS_BASE = 'https://searchconsole.googleapis.com/webmasters/v3/sites';

type CacheEntry = { token: string; expiresAt: number };
let cachedToken: CacheEntry | null = null;

export function isGscConfigured(): boolean {
  return !!(process.env.GSC_CLIENT_ID && process.env.GSC_CLIENT_SECRET && process.env.GSC_REFRESH_TOKEN);
}

async function getAccessToken(): Promise<string | null> {
  if (!isGscConfigured()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const body = new URLSearchParams({
    client_id: process.env.GSC_CLIENT_ID!,
    client_secret: process.env.GSC_CLIENT_SECRET!,
    refresh_token: process.env.GSC_REFRESH_TOKEN!,
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    console.error('[gsc] token refresh failed', res.status, await res.text());
    return null;
  }
  const json = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.token;
}

export type IndexCoverageState =
  | 'INDEXED'
  | 'DISCOVERED_NOT_INDEXED'
  | 'CRAWLED_NOT_INDEXED'
  | 'DUPLICATE_NO_CANONICAL'
  | 'PAGE_WITH_REDIRECT'
  | 'NOINDEX'
  | 'BLOCKED'
  | 'OTHER';

export interface UrlInspectionResult {
  url: string;
  state: IndexCoverageState;
  lastCrawl?: string;
  raw?: unknown;
}

function mapVerdict(v?: string, coverageState?: string): IndexCoverageState {
  if (v === 'PASS') return 'INDEXED';
  if (coverageState?.includes('Discovered')) return 'DISCOVERED_NOT_INDEXED';
  if (coverageState?.includes('Crawled')) return 'CRAWLED_NOT_INDEXED';
  if (coverageState?.includes('Duplicate')) return 'DUPLICATE_NO_CANONICAL';
  if (coverageState?.includes('redirect')) return 'PAGE_WITH_REDIRECT';
  if (coverageState?.includes('noindex') || coverageState?.includes('Excluded by')) return 'NOINDEX';
  if (coverageState?.includes('Blocked')) return 'BLOCKED';
  return 'OTHER';
}

export async function inspectUrl(siteUrl: string, inspectionUrl: string): Promise<UrlInspectionResult | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(INSPECT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: 'ko-KR' }),
  });
  if (!res.ok) {
    console.error('[gsc] inspect failed', res.status, await res.text());
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await res.json() as any;
  const idx = json?.inspectionResult?.indexStatusResult;
  return {
    url: inspectionUrl,
    state: mapVerdict(idx?.verdict, idx?.coverageState),
    lastCrawl: idx?.lastCrawlTime,
    raw: json,
  };
}

export async function inspectUrls(siteUrl: string, urls: string[], opts?: { concurrency?: number }): Promise<UrlInspectionResult[]> {
  const concurrency = opts?.concurrency ?? 4;
  const results: UrlInspectionResult[] = [];
  let i = 0;
  async function worker() {
    while (i < urls.length) {
      const myIdx = i++;
      const url = urls[myIdx];
      try {
        const r = await inspectUrl(siteUrl, url);
        if (r) results.push(r);
        else results.push({ url, state: 'OTHER' });
      } catch (e) {
        console.error('[gsc] inspect error', url, e);
        results.push({ url, state: 'OTHER' });
      }
      // GSC URL Inspection rate limit: ~60/min. concurrency 4 + 1초 텀이면 충분.
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

export interface SearchAnalyticsRow {
  page?: string;
  query?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function searchAnalytics(siteUrl: string, params: {
  startDate: string;       // YYYY-MM-DD
  endDate: string;
  dimensions?: ('query' | 'page' | 'date')[];
  rowLimit?: number;
}): Promise<SearchAnalyticsRow[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const url = `${ANALYTICS_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions || ['page'],
      rowLimit: params.rowLimit ?? 1000,
    }),
  });
  if (!res.ok) {
    console.error('[gsc] analytics failed', res.status, await res.text());
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await res.json() as any;
  return (json.rows || []).map((r: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }) => ({
    page: r.keys?.[0],
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: r.ctr || 0,
    position: r.position || 0,
  }));
}

// Tistory sitemap.xml → URL 목록 추출 (의존성 없이 정규식)
export async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const res = await fetch(sitemapUrl, { headers: { 'User-Agent': 'GeoAioIndexBot/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    return matches.map(m => m.replace(/<\/?loc>/g, '').trim()).filter(Boolean);
  } catch (e) {
    console.error('[gsc] sitemap fetch error', e);
    return [];
  }
}

// MOCK 데이터 — GSC 미구성 환경에서 대시보드가 빈 화면 안 되도록.
export function mockSnapshot(siteId: string) {
  const today = new Date();
  const d = (offset: number) => {
    const x = new Date(today); x.setDate(x.getDate() - offset); return x.toISOString().slice(0, 10);
  };
  return {
    site_id: siteId,
    taken_at: today.toISOString(),
    total_pages: 54,
    indexed: 4,
    not_indexed: 50,
    reasons: {
      DISCOVERED_NOT_INDEXED: 28,
      CRAWLED_NOT_INDEXED: 17,
      DUPLICATE_NO_CANONICAL: 5,
      OTHER: 0,
    },
    by_category: {
      '디지털스마일치과': { total: 3, indexed: 3 },
      '임플란트': { total: 0, indexed: 0 },
      '교정': { total: 0, indexed: 0 },
      '라미네이트': { total: 0, indexed: 0 },
      '보철': { total: 0, indexed: 0 },
      '틀니': { total: 0, indexed: 0 },
    },
    history: [
      { date: d(28), indexed: 0, total: 0 },
      { date: d(21), indexed: 1, total: 12 },
      { date: d(14), indexed: 2, total: 27 },
      { date: d(7),  indexed: 3, total: 42 },
      { date: d(0),  indexed: 4, total: 54 },
    ],
    is_mock: true as const,
  };
}
