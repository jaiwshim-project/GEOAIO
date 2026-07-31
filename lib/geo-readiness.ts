// GEO Readiness — 생성형 답변 엔진(ChatGPT·Perplexity·Gemini·AI Overviews)이
// 이 페이지를 "출처로 인용할 만한가"를 로컬 휴리스틱(정규식 + HTML 구조 분석)으로 진단한다.
//
// 크롬 익스텐션판과의 차이:
//  - 익스텐션은 렌더된 DOM을 읽지만, 서버는 원본 HTML을 fetch 한다.
//    → JS로만 그려지는 본문은 감지되지 않으므로 renderNeutrality 항목에서 경고한다.
//    → 반대로 robots.txt / llms.txt / 사이트맵을 직접 읽을 수 있어 기술 항목이 더 정확하다.
//  - API 키 없이 15개 항목 전부 즉시 진단(LLM 불필요). LLM은 정성 평가·CEP·문장 재작성 전용.

export type ReadinessVerdict = 'ready' | 'candidate' | 'needs_work' | 'unlikely';

export const VERDICT_LABEL: Record<ReadinessVerdict, string> = {
  ready: '인용 준비됨',
  candidate: '인용 후보',
  needs_work: '보강 필요',
  unlikely: '인용 어려움',
};

export interface CheckResult {
  id: string;
  label: string;
  group: 'content' | 'technical';
  score: number;      // 0~100
  weight: number;     // 전체 합 100
  signals: string[];  // 감지된 긍정 근거
  gaps: string[];     // 부족한 점
  fix: string;        // 한 줄 처방
}

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  lang: string;
  charCount: number;
  wordCount: number;
  headings: { level: number; text: string }[];
  jsonLdTypes: string[];
  publishedAt: string | null;
  modifiedAt: string | null;
  author: string | null;
  status: number;
  htmlBytes: number;
}

export interface ReadinessSnippets {
  robotsTxt: string;
  jsonLd: string;
  llmsTxt: string;
  improvedLead: string;
}

export interface ReadinessResult {
  url: string;
  fetchedAt: string;
  score: number;                 // 0~100
  verdict: ReadinessVerdict;
  verdictLabel: string;
  contentScore: number;          // 콘텐츠 10개 항목 소계 (0~100 환산)
  technicalScore: number;        // 기술 5개 항목 소계 (0~100 환산)
  checks: CheckResult[];
  strengths: { title: string; detail: string }[];               // Top 3 인용될 이유
  weaknesses: { title: string; detail: string; fix: string }[];  // Top 3 인용 어려운 이유
  meta: PageMeta;
  snippets: ReadinessSnippets;
  notes: string[];
}

/* ────────────────────────────────────────────────────────────────
   1. 페이지 수집
   ──────────────────────────────────────────────────────────────── */

const UA = 'GeoAioReadinessBot/1.0 (+https://www.geo-aio.com)';

export interface FetchedPage {
  url: string;
  status: number;
  html: string;
  headers: Record<string, string>;
  robotsTxt: string | null;
  llmsTxt: string | null;
  error?: string;
}

async function safeText(url: string, timeoutMs = 12_000): Promise<{ status: number; text: string; headers: Record<string, string> }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,text/plain,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  });
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  return { status: res.status, text: await res.text(), headers };
}

export async function fetchPage(rawUrl: string): Promise<FetchedPage> {
  const url = normalizeUrl(rawUrl);
  let origin = '';
  try { origin = new URL(url).origin; } catch { /* 아래에서 error 반환 */ }

  if (!origin) {
    return { url: rawUrl, status: 0, html: '', headers: {}, robotsTxt: null, llmsTxt: null, error: '올바른 URL이 아닙니다.' };
  }

  const [page, robots, llms] = await Promise.all([
    safeText(url, 15_000).catch((e: unknown) => ({ status: 0, text: '', headers: {} as Record<string, string>, err: e })),
    safeText(`${origin}/robots.txt`, 8_000).then(r => (r.status === 200 ? r.text : null)).catch(() => null),
    safeText(`${origin}/llms.txt`, 8_000).then(r => (r.status === 200 ? r.text : null)).catch(() => null),
  ]);

  const err = 'err' in page ? page.err : undefined;
  return {
    url,
    status: page.status,
    html: page.text,
    headers: page.headers,
    robotsTxt: robots,
    llmsTxt: llms,
    error: err ? (err instanceof Error ? err.message : '페이지를 가져올 수 없습니다.') : undefined,
  };
}

export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

/* ────────────────────────────────────────────────────────────────
   2. HTML 파싱 유틸 (서버에 DOM이 없으므로 정규식 기반)
   ──────────────────────────────────────────────────────────────── */

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', hellip: '…',
  ldquo: '"', rdquo: '"', lsquo: "'", rsquo: "'", mdash: '—', ndash: '–', times: '×',
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** script/style/nav/footer 등 본문이 아닌 영역 제거 */
function stripNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg|iframe|form|select)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ');
}

/** <main> 또는 <article>이 있으면 그 안을 본문으로 본다 */
function extractMainHtml(html: string): string {
  const cleaned = stripNoise(html);
  const main = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main && stripTags(main[1]).length > 300) return main[1];
  const article = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (article && stripTags(article[1]).length > 300) return article[1];
  const body = cleaned.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : cleaned;
}

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!m) return '';
  return decodeEntities(m[2] ?? m[3] ?? m[4] ?? '').trim();
}

function metaContent(html: string, keyPattern: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const t of tags) {
    const key = attr(t, 'name') || attr(t, 'property') || attr(t, 'itemprop');
    if (key && new RegExp(`^${keyPattern}$`, 'i').test(key)) return attr(t, 'content');
  }
  return '';
}

function headings(html: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = stripTags(m[2]);
    if (text) out.push({ level: Number(m[1]), text });
  }
  return out;
}

function blocks(mainHtml: string): string[] {
  const out: string[] = [];
  const re = /<(p|li|dd|blockquote|td)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mainHtml))) {
    const t = stripTags(m[2]);
    if (t.length >= 15) out.push(t);
  }
  if (out.length === 0) {
    // p 태그 없는 페이지(div 기반) 폴백: 줄 단위 분해
    stripTags(mainHtml).split(/(?<=[.!?。])\s+/).forEach(s => { if (s.length >= 30) out.push(s); });
  }
  return out;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length >= 10);
}

function jsonLdObjects(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim().replace(/^﻿/, ''));
      const push = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(push);
        else if (v && typeof v === 'object') {
          const obj = v as Record<string, unknown>;
          out.push(obj);
          if (Array.isArray(obj['@graph'])) (obj['@graph'] as unknown[]).forEach(push);
        }
      };
      push(parsed);
    } catch { /* 깨진 JSON-LD는 무시 (아래 schema 항목에서 감점) */ }
  }
  return out;
}

function jsonLdTypes(objs: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const o of objs) {
    const t = o['@type'];
    if (typeof t === 'string') set.add(t);
    else if (Array.isArray(t)) t.forEach(x => { if (typeof x === 'string') set.add(x); });
  }
  return [...set];
}

function externalLinks(mainHtml: string, pageUrl: string): string[] {
  let host = '';
  try { host = new URL(pageUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const out: string[] = [];
  const re = /<a\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mainHtml))) {
    const href = attr(m[0], 'href');
    if (!/^https?:\/\//i.test(href)) continue;
    try {
      const h = new URL(href).hostname.replace(/^www\./, '');
      if (h && h !== host) out.push(href);
    } catch { /* noop */ }
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────
   3. 신호 패턴
   ──────────────────────────────────────────────────────────────── */

const QUESTION_RE = /\?|무엇|어떻게|왜|언제|어디|얼마|누가|방법|차이|이유|기준|가능한가|해야|하나요|인가요|일까|what|how|why|when|where|which|who|vs\b/i;
const DEFINITION_RE = /(란|이란|라는 것은|는)\s*[^.]{5,80}?(이다|입니다|말한다|말합니다|의미한다|의미합니다|뜻한다|가리킨다)|\bis (a|an|the)\b/;
const TLDR_RE = /TL;?DR|한\s*줄\s*요약|핵심\s*요약|결론\s*먼저|요약하면|한눈에/i;
const NUMBER_RE = /\d+(\.\d+)?\s*(%|퍼센트|원|만원|억|명|개|건|회|배|년|개월|주|일|시간|분|초|kg|g|mm|cm|m|km|℃|점|위|만|천)/g;
const STAT_RE = /통계|평균|중위|표본|응답자|설문|조사\s*결과|데이터에\s*따르면|기준으로|출처:|n\s*=\s*\d+/i;
const AUTHORITATIVE_RE = /\.(go\.kr|ac\.kr|or\.kr|gov|edu)|doi\.org|pubmed|ncbi|who\.int|oecd|nature\.com|science\.org|wikipedia\.org|kostat|law\.go\.kr/i;
const SOURCE_WORD_RE = /출처|참고\s*(문헌|자료)|인용|근거\s*자료|references?|source:/i;
const AUTHOR_HINT_RE = /(작성자|글쓴이|기자|저자|by\s+[A-Z가-힣])|대표|원장|박사|교수|전문가|CEO|컨설턴트|\d+\s*년\s*(경력|경험|째)/i;
const EXPERIENCE_RE = /직접\s*(해보|사용|시도|경험|측정|테스트)|해보니|경험상|실제로\s*(적용|운영|진행)|사례|현장에서|우리\s*(팀|회사|병원)/i;
const CONTACT_RE = /사업자\s*등록|대표전화|문의|이메일|@[a-z0-9.-]+\.[a-z]{2,}|전화|주소/i;
const FAQ_RE = /FAQ|자주\s*(묻는|하는)\s*질문|Q\s*[.:&]|질문과\s*답|Q&A/i;
const YEAR_RE = /20\d{2}\s*년?\s*(기준|현재|최신|업데이트)?/g;

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Applebot-Extended'];

interface RobotsGroup { agents: string[]; disallow: string[]; allow: string[] }

function parseRobots(txt: string): { groups: RobotsGroup[]; sitemaps: string[] } {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let cur: RobotsGroup | null = null;
  let lastWasAgent = false;

  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();

    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], disallow: [], allow: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if (key === 'disallow' && cur) { cur.disallow.push(val); lastWasAgent = false; }
    else if (key === 'allow' && cur) { cur.allow.push(val); lastWasAgent = false; }
    else if (key === 'sitemap') { sitemaps.push(val); lastWasAgent = false; }
    else lastWasAgent = false;
  }
  return { groups, sitemaps };
}

/** 특정 봇이 경로 접근을 차단당했는지 (robots.txt 기본 규칙 기준) */
function isBotBlocked(robots: { groups: RobotsGroup[] }, bot: string, path = '/'): boolean {
  const lower = bot.toLowerCase();
  const specific = robots.groups.filter(g => g.agents.some(a => a === lower));
  const wildcard = robots.groups.filter(g => g.agents.includes('*'));
  const apply = specific.length > 0 ? specific : wildcard;
  if (apply.length === 0) return false;

  let blocked = false;
  for (const g of apply) {
    if (g.allow.some(a => a === path || (a && path.startsWith(a)))) continue;
    if (g.disallow.some(d => d === '/' || (d && path.startsWith(d)))) blocked = true;
  }
  return blocked;
}

/* ────────────────────────────────────────────────────────────────
   4. 15개 항목 진단
   ──────────────────────────────────────────────────────────────── */

function clamp(n: number): number { return Math.max(0, Math.min(100, Math.round(n))); }

export function analyzeReadiness(page: FetchedPage): ReadinessResult {
  const notes: string[] = [];
  const html = page.html || '';
  const head = html.slice(0, Math.max(0, html.search(/<\/head>/i) + 7)) || html.slice(0, 20_000);
  const mainHtml = extractMainHtml(html);
  const bodyText = stripTags(mainHtml);
  const hs = headings(html);
  const bs = blocks(mainHtml);
  const ldObjs = jsonLdObjects(html);
  const ldTypes = jsonLdTypes(ldObjs);
  const extLinks = externalLinks(mainHtml, page.url);
  const robots = page.robotsTxt ? parseRobots(page.robotsTxt) : null;

  const title = decodeEntities((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim());
  const description = metaContent(head, 'description') || metaContent(head, 'og:description');
  const canonical = (() => {
    const links = head.match(/<link\b[^>]*>/gi) || [];
    for (const l of links) if (/rel\s*=\s*["']?canonical/i.test(l)) return attr(l, 'href');
    return '';
  })();
  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] || '', 'lang');

  const ldFirstArticle = ldObjs.find(o => {
    const t = o['@type'];
    const s = Array.isArray(t) ? t.join(',') : String(t ?? '');
    return /Article|BlogPosting|NewsArticle|WebPage|Product|Service/i.test(s);
  });
  const ldStr = (v: unknown): string | null => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.name === 'string') return o.name;
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0] as string;
      if (Array.isArray(v) && v[0] && typeof v[0] === 'object') {
        const n = (v[0] as Record<string, unknown>).name;
        if (typeof n === 'string') return n;
      }
    }
    return null;
  };

  const publishedAt =
    ldStr(ldFirstArticle?.datePublished) ||
    metaContent(head, 'article:published_time') ||
    (html.match(/<time\b[^>]*datetime\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1] ?? null);
  const modifiedAt =
    ldStr(ldFirstArticle?.dateModified) ||
    metaContent(head, 'article:modified_time') ||
    null;
  const author =
    ldStr(ldFirstArticle?.author) ||
    metaContent(head, 'author') ||
    (bodyText.match(/(?:작성자|글쓴이|저자|by)\s*[:|]?\s*([가-힣A-Za-z][가-힣A-Za-z\s.]{1,20})/)?.[1]?.trim() ?? null);

  const charCount = bodyText.length;
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  if (page.status === 0) notes.push('페이지를 가져오지 못했습니다. URL·네트워크·차단 정책을 확인하세요.');
  else if (page.status >= 400) notes.push(`HTTP ${page.status} 응답 — AI 크롤러도 동일하게 실패합니다.`);
  if (charCount < 400 && html.length > 5_000) {
    notes.push('원본 HTML에 본문 텍스트가 거의 없습니다. 클라이언트 JS로만 그려지는 구조라면 대부분의 AI 크롤러는 본문을 읽지 못합니다.');
  }
  if (!page.robotsTxt) notes.push('robots.txt를 찾지 못했습니다(404 또는 접근 실패).');

  const checks: CheckResult[] = [];
  const add = (c: CheckResult) => checks.push(c);

  /* ── 콘텐츠 1. 도입부 직접 답변 (weight 10) ── */
  {
    const lead = bs.slice(0, 3).join(' ').slice(0, 600);
    const firstBlock = bs[0] || '';
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 25;
    if (TLDR_RE.test(bodyText.slice(0, 1200))) { s += 20; signals.push('도입부에 요약/결론 먼저 표기'); }
    else gaps.push('"한 줄 요약 / 결론 먼저" 블록 없음');
    if (DEFINITION_RE.test(lead)) { s += 25; signals.push('도입부에 정의·단정 문장 존재'); }
    else gaps.push('도입부에 "~란 …이다" 형태의 정의 문장 없음');
    if (firstBlock.length >= 40 && firstBlock.length <= 320) { s += 15; signals.push(`첫 단락 길이 ${firstBlock.length}자 (인용 단위로 적정)`); }
    else if (firstBlock.length > 320) gaps.push(`첫 단락이 ${firstBlock.length}자로 길어 발췌가 어려움`);
    else gaps.push('첫 단락이 너무 짧아 답변으로 발췌되기 어려움');
    if (NUMBER_RE.test(lead)) { s += 15; signals.push('도입부에 수치 포함'); }
    else gaps.push('도입부에 수치·기준값 없음');
    NUMBER_RE.lastIndex = 0;
    add({
      id: 'answerFirst', label: '도입부 직접 답변 (Answer-First)', group: 'content', weight: 10,
      score: clamp(s), signals, gaps,
      fix: '첫 100~200자 안에 "결론 + 정의 + 핵심 수치"를 한 문단으로 배치하세요.',
    });
  }

  /* ── 콘텐츠 2. 질문형 헤딩 (weight 7) ── */
  {
    const subs = hs.filter(h => h.level >= 2);
    const qs = subs.filter(h => QUESTION_RE.test(h.text));
    const ratio = subs.length ? qs.length / subs.length : 0;
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = clamp(ratio * 160 + Math.min(30, qs.length * 10));
    if (subs.length === 0) { s = 10; gaps.push('H2 이하 소제목이 없음'); }
    if (qs.length) signals.push(`질문형 소제목 ${qs.length}/${subs.length}개 (예: "${qs[0].text.slice(0, 40)}")`);
    else if (subs.length) gaps.push('소제목이 모두 명사형 — 사용자 질문과 매칭되지 않음');
    if (QUESTION_RE.test(title)) { s = clamp(s + 12); signals.push('타이틀 자체가 질문형'); }
    add({
      id: 'questionHeadings', label: '질문형 소제목 (질의 매칭)', group: 'content', weight: 7,
      score: s, signals, gaps,
      fix: '소제목을 "무엇인가 / 어떻게 하나 / 얼마나 드나 / 무엇이 다른가" 형태의 실제 질문 문장으로 바꾸세요.',
    });
  }

  /* ── 콘텐츠 3. 구조화 (weight 8) ── */
  {
    const h1 = hs.filter(h => h.level === 1).length;
    const h2 = hs.filter(h => h.level === 2).length;
    const h3 = hs.filter(h => h.level === 3).length;
    const lists = (mainHtml.match(/<[uo]l\b/gi) || []).length;
    const tables = (mainHtml.match(/<table\b/gi) || []).length;
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 20;
    if (h1 === 1) { s += 15; signals.push('H1 1개 (정상)'); } else gaps.push(h1 === 0 ? 'H1 없음' : `H1이 ${h1}개 — 주제가 분산됨`);
    if (h2 >= 3) { s += 25; signals.push(`H2 ${h2}개로 섹션 분할`); } else gaps.push(`H2가 ${h2}개 — 섹션 분할 부족(3개 이상 권장)`);
    if (h3 >= 1) { s += 10; signals.push(`H3 ${h3}개로 하위 계층 구성`); }
    if (lists >= 1) { s += 20; signals.push(`리스트 ${lists}개`); } else gaps.push('불릿·번호 리스트 없음 — AI가 항목을 추출하기 어려움');
    if (tables >= 1) { s += 10; signals.push(`표 ${tables}개`); }
    const skipped = hs.some((h, i) => i > 0 && h.level - hs[i - 1].level > 1);
    if (skipped) { s -= 10; gaps.push('헤딩 레벨 건너뜀(H2→H4 등)'); }
    add({
      id: 'structure', label: '헤딩·리스트 구조화', group: 'content', weight: 8,
      score: clamp(s), signals, gaps,
      fix: 'H1 1개 → H2 3개 이상 → 각 섹션에 리스트나 표 1개를 배치해 계층을 만드세요.',
    });
  }

  /* ── 콘텐츠 4. 발췌 가능성 (weight 6) ── */
  {
    const lens = bs.map(b => b.length);
    const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
    const longRatio = lens.length ? lens.filter(l => l > 600).length / lens.length : 0;
    const sents = sentences(bodyText);
    const avgSent = sents.length ? sents.reduce((a, b) => a + b.length, 0) / sents.length : 0;
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 30;
    if (avg >= 80 && avg <= 400) { s += 30; signals.push(`평균 단락 ${Math.round(avg)}자 (발췌 적정)`); }
    else gaps.push(`평균 단락 ${Math.round(avg)}자 — ${avg > 400 ? '너무 길어 통째 인용이 어려움' : '너무 짧아 맥락이 끊김'}`);
    if (avgSent > 0 && avgSent <= 110) { s += 25; signals.push(`평균 문장 ${Math.round(avgSent)}자 (간결)`); }
    else if (avgSent > 110) gaps.push(`평균 문장 ${Math.round(avgSent)}자 — 한 문장에 여러 주장이 섞여 있음`);
    if (longRatio <= 0.15) s += 15; else gaps.push(`600자 초과 단락 비율 ${Math.round(longRatio * 100)}%`);
    if (charCount >= 800) signals.push(`본문 ${charCount.toLocaleString()}자 확보`);
    else gaps.push(`본문 ${charCount}자 — 정보량 부족(800자 이상 권장)`);
    add({
      id: 'chunkability', label: '발췌 단위 (Chunkability)', group: 'content', weight: 6,
      score: clamp(s), signals, gaps,
      fix: '한 단락 = 한 주장 = 2~4문장으로 끊고, 문장은 80자 내외로 줄이세요.',
    });
  }

  /* ── 콘텐츠 5. 정량 근거 (weight 8) ── */
  {
    const nums = bodyText.match(NUMBER_RE) || [];
    NUMBER_RE.lastIndex = 0;
    const uniq = new Set(nums.map(n => n.trim()));
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 15;
    if (uniq.size >= 3) { s += 35; signals.push(`수치 표현 ${uniq.size}종 (예: ${[...uniq].slice(0, 3).join(', ')})`); }
    else gaps.push(`정량 표현 ${uniq.size}종 — 3종 이상 필요`);
    if (uniq.size >= 8) { s += 15; signals.push('수치 밀도 충분'); }
    if (STAT_RE.test(bodyText)) { s += 25; signals.push('통계·조사 근거 표현 존재'); }
    else gaps.push('"평균/조사 결과/데이터에 따르면" 같은 근거 표현 없음');
    if ((mainHtml.match(/<table\b/gi) || []).length) { s += 10; signals.push('표 형태 데이터 제시'); }
    add({
      id: 'quantitative', label: '정량 근거 (수치·통계)', group: 'content', weight: 8,
      score: clamp(s), signals, gaps,
      fix: '주장마다 "무엇이 몇 %, 얼마, 몇 개월" 형태의 수치와 측정 기준을 붙이세요.',
    });
  }

  /* ── 콘텐츠 6. 출처·인용 (weight 6) ── */
  {
    const auth = extLinks.filter(l => AUTHORITATIVE_RE.test(l));
    const quotes = (mainHtml.match(/<blockquote\b/gi) || []).length + (mainHtml.match(/<cite\b/gi) || []).length;
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 15;
    if (extLinks.length >= 2) { s += 25; signals.push(`외부 링크 ${extLinks.length}개`); }
    else gaps.push('외부 출처 링크가 1개 이하');
    if (auth.length >= 1) { s += 30; signals.push(`공신력 도메인 인용 ${auth.length}개`); }
    else gaps.push('정부·학술·공공(.go.kr/.ac.kr/doi 등) 출처 인용 없음');
    if (SOURCE_WORD_RE.test(bodyText)) { s += 20; signals.push('"출처/참고문헌" 명시'); }
    else gaps.push('출처 표기 문구 없음');
    if (quotes) { s += 10; signals.push(`인용 블록 ${quotes}개`); }
    add({
      id: 'sources', label: '출처·외부 인용', group: 'content', weight: 6,
      score: clamp(s), signals, gaps,
      fix: '핵심 수치 3개에 공신력 있는 1차 출처 링크를 달고, 하단에 "참고 자료" 목록을 두세요.',
    });
  }

  /* ── 콘텐츠 7. E-E-A-T 신호 (weight 9) ── */
  {
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 10;
    if (author) { s += 25; signals.push(`저자 표기: ${author}`); } else gaps.push('저자·작성자 표기 없음');
    if (AUTHOR_HINT_RE.test(bodyText)) { s += 15; signals.push('경력·직함·전문성 표현 존재'); }
    else gaps.push('저자 경력·자격·직함 설명 없음');
    if (EXPERIENCE_RE.test(bodyText)) { s += 25; signals.push('1인칭 실경험·사례 표현 존재'); }
    else gaps.push('실제 경험·사례(Experience) 서술 없음');
    if (CONTACT_RE.test(bodyText)) { s += 15; signals.push('연락처·사업자 정보 노출'); }
    else gaps.push('연락처·운영 주체 정보 없음');
    if (ldTypes.some(t => /Person|Organization|LocalBusiness/i.test(t))) { s += 15; signals.push('Person/Organization 스키마 존재'); }
    else gaps.push('운영 주체 스키마(Organization/Person) 없음');
    add({
      id: 'eeat', label: 'E-E-A-T 신호', group: 'content', weight: 9,
      score: clamp(s), signals, gaps,
      fix: '저자 실명·직함·경력 1줄 + 실경험 사례 1건 + 운영 주체 정보를 페이지 안에 명시하세요.',
    });
  }

  /* ── 콘텐츠 8. 최신성 (weight 5) ── */
  {
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 20;
    const ref = modifiedAt || publishedAt;
    let ageDays: number | null = null;
    if (ref) {
      const t = Date.parse(ref);
      if (!Number.isNaN(t)) ageDays = Math.round((Date.now() - t) / 86_400_000);
    }
    if (modifiedAt) { s += 20; signals.push(`수정일 표기 (${modifiedAt.slice(0, 10)})`); } else gaps.push('dateModified(수정일) 없음');
    if (publishedAt) { s += 15; signals.push(`발행일 표기 (${publishedAt.slice(0, 10)})`); } else gaps.push('발행일 표기 없음');
    if (ageDays !== null) {
      if (ageDays <= 180) { s += 30; signals.push(`최근 ${ageDays}일 내 갱신`); }
      else if (ageDays <= 540) { s += 12; gaps.push(`마지막 갱신 ${ageDays}일 경과`); }
      else gaps.push(`마지막 갱신 ${ageDays}일 경과 — AI가 최신 출처로 선택하지 않음`);
    }
    const years = bodyText.match(YEAR_RE) || [];
    const thisYear = String(new Date().getFullYear());
    if (years.some(y => y.includes(thisYear))) { s += 15; signals.push(`본문에 ${thisYear}년 기준 표기`); }
    else gaps.push('"올해 기준" 연도 명시 없음');
    add({
      id: 'freshness', label: '최신성 (발행·수정일)', group: 'content', weight: 5,
      score: clamp(s), signals, gaps,
      fix: '본문 상단에 "최종 업데이트: YYYY-MM-DD"를 노출하고 JSON-LD dateModified를 함께 갱신하세요.',
    });
  }

  /* ── 콘텐츠 9. FAQ / Q&A (weight 5) ── */
  {
    const faqHeads = hs.filter(h => /\?|^Q[\s.:]|자주\s*묻는/i.test(h.text));
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 15;
    if (ldTypes.some(t => /FAQPage|QAPage/i.test(t))) { s += 40; signals.push('FAQPage/QAPage 스키마 적용'); }
    else gaps.push('FAQPage 스키마 없음');
    if (FAQ_RE.test(bodyText)) { s += 20; signals.push('FAQ 섹션 표현 감지'); } else gaps.push('FAQ·Q&A 섹션 없음');
    if (faqHeads.length >= 3) { s += 25; signals.push(`질문 형태 소제목 ${faqHeads.length}개`); }
    else if (faqHeads.length >= 1) s += 10;
    else gaps.push('질문–답변 쌍이 3개 이상 필요');
    add({
      id: 'faq', label: 'FAQ · 질문–답변 쌍', group: 'content', weight: 5,
      score: clamp(s), signals, gaps,
      fix: '실제 검색될 질문 5개를 골라 "질문 헤딩 + 2~3문장 답변" 형태의 FAQ 섹션과 FAQPage 스키마를 추가하세요.',
    });
  }

  /* ── 콘텐츠 10. 엔티티 명확성 (weight 6) ── */
  {
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 20;
    const subject = (hs.find(h => h.level === 1)?.text || title).replace(/[|·—-].*$/, '').trim();
    const core = subject.split(/\s+/).filter(w => w.length >= 2).slice(0, 3);
    const repeats = core.filter(w => (bodyText.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length >= 3);
    if (subject) { s += 15; signals.push(`주제 엔티티: "${subject.slice(0, 40)}"`); } else gaps.push('H1/타이틀에서 주제를 특정할 수 없음');
    if (repeats.length >= 1) { s += 20; signals.push(`핵심 용어 본문 내 반복 일관성 확보(${repeats.join(', ')})`); }
    else gaps.push('제목의 핵심 용어가 본문에서 일관되게 반복되지 않음');
    if (DEFINITION_RE.test(bodyText)) { s += 20; signals.push('개념 정의 문장 존재'); }
    else gaps.push('핵심 용어를 1문장으로 정의한 부분 없음');
    if (ldTypes.some(t => /Organization|LocalBusiness|Product|Service|Person/i.test(t))) { s += 15; signals.push('엔티티 스키마로 주체 명시'); }
    else gaps.push('엔티티(Organization/Product/Service) 스키마 없음');
    if (description) { s += 10; signals.push('meta description으로 주제 요약'); }
    add({
      id: 'entity', label: '엔티티 명확성', group: 'content', weight: 6,
      score: clamp(s), signals, gaps,
      fix: '핵심 용어를 첫 문단에서 1문장으로 정의하고, 같은 표기로 본문 전체에서 반복하세요(동의어 혼용 금지).',
    });
  }

  /* ── 기술 1. 구조화 데이터 (weight 9) ── */
  {
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 10;
    if (ldObjs.length) { s += 25; signals.push(`JSON-LD ${ldObjs.length}개 (${ldTypes.slice(0, 4).join(', ')})`); }
    else gaps.push('JSON-LD 구조화 데이터 없음');
    if (ldTypes.some(t => /Article|BlogPosting|NewsArticle/i.test(t))) { s += 20; signals.push('Article 계열 스키마 적용'); }
    else gaps.push('Article/BlogPosting 스키마 없음');
    if (ldFirstArticle?.author) { s += 15; signals.push('스키마에 author 포함'); } else gaps.push('스키마 author 누락');
    if (ldFirstArticle?.dateModified) { s += 15; signals.push('스키마에 dateModified 포함'); } else gaps.push('스키마 dateModified 누락');
    if (ldTypes.some(t => /FAQPage|HowTo|BreadcrumbList/i.test(t))) { s += 15; signals.push('FAQ/HowTo/Breadcrumb 보강 스키마'); }
    if (/<script[^>]*ld\+json/i.test(html) && ldObjs.length === 0) gaps.push('JSON-LD가 있으나 파싱 실패(문법 오류)');
    add({
      id: 'schema', label: '구조화 데이터 (JSON-LD)', group: 'technical', weight: 9,
      score: clamp(s), signals, gaps,
      fix: 'Article(author·datePublished·dateModified) + FAQPage 스키마를 삽입하고 Rich Results Test로 검증하세요.',
    });
  }

  /* ── 기술 2. 메타데이터 (weight 6) ── */
  {
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 10;
    if (title.length >= 10 && title.length <= 70) { s += 25; signals.push(`타이틀 ${title.length}자`); }
    else gaps.push(title ? `타이틀 ${title.length}자 — 10~70자 권장` : '타이틀 없음');
    if (description.length >= 50 && description.length <= 200) { s += 25; signals.push(`meta description ${description.length}자`); }
    else gaps.push(description ? `description ${description.length}자 — 50~200자 권장` : 'meta description 없음');
    if (canonical) { s += 20; signals.push('canonical 지정'); } else gaps.push('canonical 없음 — 중복 URL로 인용 신호가 분산');
    if (lang) { s += 10; signals.push(`lang="${lang}"`); } else gaps.push('html lang 속성 없음');
    if (metaContent(head, 'og:title')) { s += 10; signals.push('Open Graph 태그 존재'); } else gaps.push('OG 태그 없음');
    if (/hreflang/i.test(head)) { s += 10; signals.push('hreflang 다국어 신호'); }
    add({
      id: 'metadata', label: '메타데이터 (title·description·canonical)', group: 'technical', weight: 6,
      score: clamp(s), signals, gaps,
      fix: '질문형 타이틀(≤70자) + 답변 요약형 description(≤200자) + canonical + lang을 채우세요.',
    });
  }

  /* ── 기술 3. AI 크롤러 접근성 (weight 8) ── */
  {
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 20;
    const robotsMeta = metaContent(head, 'robots') + ' ' + (page.headers['x-robots-tag'] || '');
    if (/noindex/i.test(robotsMeta)) { s -= 40; gaps.push('noindex 지정 — 검색·AI 인용 대상에서 제외됨'); }
    else { s += 15; signals.push('noindex 없음'); }
    if (/nosnippet|max-snippet\s*:\s*0/i.test(robotsMeta)) { s -= 20; gaps.push('nosnippet — 발췌 인용이 차단됨'); }

    let path = '/';
    try { path = new URL(page.url).pathname || '/'; } catch { /* noop */ }
    if (robots) {
      const blocked = AI_BOTS.filter(b => isBotBlocked(robots, b, path));
      const allowed = AI_BOTS.filter(b => !blocked.includes(b));
      if (blocked.length === 0) { s += 30; signals.push(`주요 AI 크롤러 ${allowed.length}종 모두 접근 가능`); }
      else { s -= blocked.length * 6; gaps.push(`robots.txt에서 차단된 AI 크롤러: ${blocked.join(', ')}`); }
      if (robots.sitemaps.length) { s += 15; signals.push(`robots.txt에 사이트맵 ${robots.sitemaps.length}건 명시`); }
      else gaps.push('robots.txt에 Sitemap 선언 없음');
    } else gaps.push('robots.txt 확인 불가 — 크롤러 정책을 검증할 수 없음');

    if (page.llmsTxt) { s += 20; signals.push('llms.txt 제공'); } else gaps.push('llms.txt 없음 — LLM에 사이트 구조를 안내할 수 없음');
    if (page.status === 200) { s += 10; signals.push('HTTP 200 정상 응답'); }
    add({
      id: 'crawlability', label: 'AI 크롤러 접근성 (robots·llms.txt)', group: 'technical', weight: 8,
      score: clamp(s), signals, gaps,
      fix: 'GPTBot·ClaudeBot·PerplexityBot·Google-Extended를 명시적으로 Allow 하고 llms.txt를 추가하세요.',
    });
  }

  /* ── 기술 4. 렌더 의존성 (weight 4) ── */
  {
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 20;
    const ratio = html.length ? charCount / html.length : 0;
    if (charCount >= 600) { s += 40; signals.push('원본 HTML에 본문 텍스트 존재 (JS 없이 읽힘)'); }
    else gaps.push('원본 HTML에 본문이 거의 없음 — CSR 전용 구조로 의심됨');
    if (ratio >= 0.05) { s += 25; signals.push(`텍스트/HTML 비율 ${(ratio * 100).toFixed(1)}%`); }
    else gaps.push(`텍스트/HTML 비율 ${(ratio * 100).toFixed(1)}% — 마크업 과다`);
    if (/<noscript\b/i.test(html)) { s += 10; signals.push('noscript 폴백 제공'); }
    if (html.length > 1_500_000) { s -= 10; gaps.push('HTML이 1.5MB 초과 — 크롤러가 중간에서 끊길 수 있음'); }
    else s += 15;
    add({
      id: 'render', label: '렌더 의존성 (JS 없이 읽히는가)', group: 'technical', weight: 4,
      score: clamp(s), signals, gaps,
      fix: '본문을 SSR/SSG로 HTML에 직접 포함시키세요(Next.js라면 서버 컴포넌트 또는 ISR).',
    });
  }

  /* ── 기술 5. 접근성·전달 신호 (weight 3) ── */
  {
    const imgs = mainHtml.match(/<img\b[^>]*>/gi) || [];
    const withAlt = imgs.filter(i => attr(i, 'alt').length > 0).length;
    const signals: string[] = [];
    const gaps: string[] = [];
    let s = 30;
    if (imgs.length === 0) { s += 20; signals.push('이미지 의존 없음'); }
    else if (withAlt / imgs.length >= 0.8) { s += 35; signals.push(`이미지 alt ${withAlt}/${imgs.length}`); }
    else gaps.push(`alt 누락 이미지 ${imgs.length - withAlt}/${imgs.length}개 — 이미지 정보가 텍스트로 전달되지 않음`);
    if (/<table\b/i.test(mainHtml) && /<th\b/i.test(mainHtml)) { s += 15; signals.push('표에 th 헤더 셀 사용'); }
    if (page.headers['content-type']?.includes('charset=utf-8') || /charset\s*=\s*["']?utf-8/i.test(head)) { s += 20; signals.push('UTF-8 인코딩 명시'); }
    else gaps.push('문자 인코딩(UTF-8) 명시 없음 — 한글 깨짐 위험');
    add({
      id: 'delivery', label: '접근성·전달 신호 (alt·인코딩)', group: 'technical', weight: 3,
      score: clamp(s), signals, gaps,
      fix: '모든 본문 이미지에 설명형 alt를 넣고 charset=utf-8을 head 최상단에 선언하세요.',
    });
  }

  /* ── 총점 ── */
  const contentChecks = checks.filter(c => c.group === 'content');
  const techChecks = checks.filter(c => c.group === 'technical');
  const weighted = (arr: CheckResult[]) => arr.reduce((sum, c) => sum + c.score * c.weight, 0);
  const weightSum = (arr: CheckResult[]) => arr.reduce((sum, c) => sum + c.weight, 0);

  const score = clamp(weighted(checks) / 100);
  const contentScore = clamp(weighted(contentChecks) / weightSum(contentChecks));
  const technicalScore = clamp(weighted(techChecks) / weightSum(techChecks));

  const verdict: ReadinessVerdict =
    score >= 80 ? 'ready' : score >= 60 ? 'candidate' : score >= 40 ? 'needs_work' : 'unlikely';

  const strengths = [...checks]
    .filter(c => c.score >= 60 && c.signals.length > 0)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 3)
    .map(c => ({ title: `${c.label} ${c.score}점`, detail: c.signals.slice(0, 2).join(' · ') }));

  const weaknesses = [...checks]
    .filter(c => c.score < 75)
    .sort((a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight)
    .slice(0, 3)
    .map(c => ({ title: `${c.label} ${c.score}점`, detail: c.gaps.slice(0, 2).join(' · ') || '기준 미달', fix: c.fix }));

  const meta: PageMeta = {
    title, description, canonical, lang,
    charCount, wordCount,
    headings: hs.slice(0, 40),
    jsonLdTypes: ldTypes,
    publishedAt, modifiedAt, author,
    status: page.status,
    htmlBytes: html.length,
  };

  return {
    url: page.url,
    fetchedAt: new Date().toISOString(),
    score, verdict, verdictLabel: VERDICT_LABEL[verdict],
    contentScore, technicalScore,
    checks,
    strengths: strengths.length ? strengths : [{ title: '뚜렷한 강점 없음', detail: '모든 항목이 60점 미만입니다. 도입부 답변·구조화부터 착수하세요.' }],
    weaknesses,
    meta,
    snippets: buildSnippets(page, meta, bs),
    notes,
  };
}

/* ────────────────────────────────────────────────────────────────
   5. 즉시 복사용 스니펫
   ──────────────────────────────────────────────────────────────── */

function buildSnippets(page: FetchedPage, meta: PageMeta, bs: string[]): ReadinessSnippets {
  let origin = 'https://example.com';
  let pathname = '/';
  try { const u = new URL(page.url); origin = u.origin; pathname = u.pathname; } catch { /* noop */ }

  const robotsTxt = [
    '# GEO — 생성형 답변 엔진 크롤러 허용',
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_BOTS.flatMap(b => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${origin}/sitemap.xml`,
    `# LLM 안내 문서: ${origin}/llms.txt`,
  ].join('\n');

  const today = new Date().toISOString().slice(0, 10);
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: meta.title || '페이지 제목',
        description: meta.description || '이 페이지가 답하는 질문과 결론을 1~2문장으로 요약',
        url: page.url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': page.url },
        inLanguage: meta.lang || 'ko',
        datePublished: (meta.publishedAt || today).slice(0, 10),
        dateModified: (meta.modifiedAt || today).slice(0, 10),
        author: { '@type': 'Person', name: meta.author || '저자 실명', jobTitle: '직함·전문 분야', url: `${origin}/about` },
        publisher: { '@type': 'Organization', name: '운영 주체명', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/logo.png` } },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '실제 사용자가 묻는 질문 1', acceptedAnswer: { '@type': 'Answer', text: '2~3문장 직접 답변 + 수치 근거' } },
          { '@type': 'Question', name: '실제 사용자가 묻는 질문 2', acceptedAnswer: { '@type': 'Answer', text: '2~3문장 직접 답변 + 수치 근거' } },
        ],
      },
    ],
  }, null, 2);

  const llmsTxt = [
    `# ${meta.title || origin}`,
    '',
    `> ${meta.description || '이 사이트가 무엇을 다루고 누구에게 유용한지 1~2문장으로 요약하세요.'}`,
    '',
    '## 핵심 페이지',
    `- [${meta.title || '이 페이지'}](${page.url}): ${(meta.description || bs[0] || '').slice(0, 120)}`,
    `- [사이트맵](${origin}/sitemap.xml): 전체 문서 목록`,
    '',
    '## 인용 안내',
    '- 인용 시 출처 표기: 페이지 제목 + URL',
    `- 최종 업데이트: ${(meta.modifiedAt || today).slice(0, 10)}`,
    `- 문의: ${origin}${pathname === '/' ? '/contact' : '/contact'}`,
  ].join('\n');

  const subject = (meta.headings.find(h => h.level === 1)?.text || meta.title || '이 주제').replace(/[|·—-].*$/, '').trim();
  const improvedLead = [
    `**결론 먼저**: ${subject}은(는) [핵심 정의 한 문장]입니다.`,
    `핵심 기준은 ① [기준1], ② [기준2], ③ [기준3]이며, 실제 데이터로는 [숫자+단위]가 확인됩니다.`,
    `아래에서 ${subject}의 정의, 판단 기준, 비용·기간, 자주 묻는 질문 순으로 정리했습니다.`,
    `(최종 업데이트: ${today} · 작성: ${meta.author || '[저자 실명·직함]'})`,
  ].join('\n');

  return { robotsTxt, jsonLd, llmsTxt, improvedLead };
}

/* ────────────────────────────────────────────────────────────────
   6. LLM 심층 진단용 본문 추출 (CEP·재작성 프롬프트 입력)
   ──────────────────────────────────────────────────────────────── */

export function extractPlainText(html: string, limit = 12_000): string {
  const text = stripTags(extractMainHtml(html));
  return text.length > limit ? `${text.slice(0, limit)}\n…(이하 생략)` : text;
}

/** URL 하나를 받아 수집 + 진단까지 한 번에 */
export async function diagnoseUrl(url: string): Promise<{ page: FetchedPage; result: ReadinessResult }> {
  const page = await fetchPage(url);
  return { page, result: analyzeReadiness(page) };
}
