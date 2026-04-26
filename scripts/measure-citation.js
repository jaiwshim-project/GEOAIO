/**
 * scripts/measure-citation.js
 *
 * CEP(Category Entry Point) A/B 인용 측정 스크립트
 * ====================================================
 * CEP 위저드를 적용한 콘텐츠와 미적용 콘텐츠를 동일한 쿼리로
 * AI 검색 엔진(Perplexity / ChatGPT)에 던져 우리 콘텐츠가
 * 인용·발췌되었는지 비교 측정한다.
 *
 * 사용법:
 *   node scripts/measure-citation.js \
 *     --query="화장 잘먹는 선크림 추천" \
 *     --applied-url="https://geo-aio.com/blog/123" \
 *     --applied-text-match="아침 화장 전" \
 *     --skipped-url="https://geo-aio.com/blog/124" \
 *     --skipped-text-match="30대 여성 선크림" \
 *     --pair-id="2026-04-26-suncream-test-1" \
 *     --engines=perplexity,chatgpt
 *
 * 환경 변수:
 *   PERPLEXITY_API_KEY        - Perplexity 검색 API 키
 *   OPENAI_API_KEY            - OpenAI ChatGPT search/responses API 키
 *   NEXT_PUBLIC_SUPABASE_URL  - Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase 서비스 롤 키 (RLS 우회 필수)
 *
 * 인용 판정의 한계:
 *   - OpenAI Responses API는 직접적인 citation 메타데이터를 항상 제공하지 않으므로
 *     본문 텍스트에서 source_url 또는 text_match 문자열의 등장 여부로 추정한다.
 *   - Perplexity는 citations 배열을 반환하므로 비교적 정확하지만,
 *     URL 정규화(trailing slash, query string)에 따라 누락될 수 있다.
 *   - citation_position은 응답 본문 기준 첫 등장 위치를 비율로 환산한 추정치다.
 *   - 즉 본 측정은 "정확한 인용률"이 아니라 "상대적 인용 경향"의 비교 지표로 해석해야 한다.
 *
 * 외부 의존성:
 *   - Node 18+ 내장 fetch
 *   - @supabase/supabase-js (이미 설치됨)
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

// ----------------------------------------------------------------------------
// CLI 인자 파싱 (외부 의존성 없이)
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) {
      args[raw.slice(2)] = true;
    } else {
      const key = raw.slice(2, eq);
      const val = raw.slice(eq + 1);
      args[key] = val;
    }
  }
  return args;
}

const args = parseArgs(process.argv);

const QUERY = args['query'];
const APPLIED_URL = args['applied-url'];
const APPLIED_TEXT_MATCH = args['applied-text-match'] || '';
const SKIPPED_URL = args['skipped-url'];
const SKIPPED_TEXT_MATCH = args['skipped-text-match'] || '';
const PAIR_ID = args['pair-id'] || `pair-${Date.now()}`;
const ENGINES = (args['engines'] || 'perplexity,chatgpt')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const APPLIED_CONTENT_ID = args['applied-content-id'] || null;
const SKIPPED_CONTENT_ID = args['skipped-content-id'] || null;
const SCENE_SENTENCE = args['scene-sentence'] || null;
const CEP_KEYWORD = args['cep-keyword'] || null;
const NOTES = args['notes'] || null;

// 필수 인자 검증
if (!QUERY || !APPLIED_URL || !SKIPPED_URL) {
  console.error('[ERR] 필수 인자 누락: --query, --applied-url, --skipped-url');
  console.error('사용법은 파일 상단 주석을 참고하세요.');
  process.exit(1);
}

// ----------------------------------------------------------------------------
// 환경 변수 검증
// ----------------------------------------------------------------------------
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERR] Supabase 환경 변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (ENGINES.includes('perplexity') && !PERPLEXITY_API_KEY) {
  console.error('[ERR] PERPLEXITY_API_KEY 환경 변수 누락 (engines에 perplexity 포함됨)');
  process.exit(1);
}
if (ENGINES.includes('chatgpt') && !OPENAI_API_KEY) {
  console.error('[ERR] OPENAI_API_KEY 환경 변수 누락 (engines에 chatgpt 포함됨)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ----------------------------------------------------------------------------
// AI 검색 엔진 호출 함수들
// ----------------------------------------------------------------------------

/**
 * Perplexity sonar 모델 호출
 * 응답에서 본문 텍스트와 citations 배열을 추출한다.
 */
async function callPerplexity(query) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Perplexity API ${res.status}: ${errText.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content || '';
  const citations = json?.citations || json?.search_results || [];
  return { text, citations, raw: json };
}

/**
 * OpenAI Responses API 호출 (web_search 도구 사용)
 * 인용 메타데이터를 직접 받지 못하면 본문 텍스트에서 매칭한다.
 */
async function callChatGPT(query) {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: query,
      tools: [{ type: 'web_search' }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 300)}`);
  }
  const json = await res.json();
  // output_text가 있으면 우선 사용, 없으면 output 배열 순회
  let text = json?.output_text || '';
  if (!text && Array.isArray(json?.output)) {
    for (const item of json.output) {
      if (item?.type === 'message' && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (typeof c?.text === 'string') text += c.text + '\n';
        }
      }
    }
  }
  return { text, citations: [], raw: json };
}

// ----------------------------------------------------------------------------
// 인용 판정 로직
// ----------------------------------------------------------------------------

/**
 * URL 정규화: 끝 슬래시 제거, 소문자 변환.
 */
function normalizeUrl(u) {
  if (!u) return '';
  return String(u).trim().toLowerCase().replace(/\/+$/, '');
}

/**
 * 응답에서 우리 콘텐츠가 인용됐는지 판정한다.
 * - cited: URL 또는 text_match 문자열이 본문/citations에 등장하면 true
 * - position: 본문 내 첫 등장 위치 비율(0~100)을 1-based 등수로 환산.
 *   여기서는 단순화하여 본문 길이 대비 등장 인덱스로 추정.
 * - snippet: 등장 위치 주변 200자 추출
 */
function judgeCitation({ text, citations }, sourceUrl, textMatch) {
  const haystack = String(text || '');
  const lowerHay = haystack.toLowerCase();
  const normUrl = normalizeUrl(sourceUrl);
  const lowerMatch = (textMatch || '').toLowerCase();

  // 1) citations 배열에서 URL 매칭
  let citedByMeta = false;
  let metaPosition = null;
  if (Array.isArray(citations)) {
    for (let i = 0; i < citations.length; i++) {
      const c = citations[i];
      const cUrl = typeof c === 'string' ? c : (c?.url || c?.link || '');
      if (normalizeUrl(cUrl) === normUrl) {
        citedByMeta = true;
        metaPosition = i + 1;
        break;
      }
    }
  }

  // 2) 본문 텍스트에서 URL 등장 위치
  let urlIdx = -1;
  if (normUrl) urlIdx = lowerHay.indexOf(normUrl);
  // 3) text_match 등장 위치
  let textIdx = -1;
  if (lowerMatch) textIdx = lowerHay.indexOf(lowerMatch);

  const cited = citedByMeta || urlIdx !== -1 || textIdx !== -1;

  let position = metaPosition;
  if (position == null && (urlIdx !== -1 || textIdx !== -1)) {
    const firstIdx = [urlIdx, textIdx].filter((x) => x !== -1).sort((a, b) => a - b)[0];
    // 본문 길이 대비 등장 위치를 10등분으로 환산하여 1~10 등수로 반환
    if (haystack.length > 0) {
      const ratio = firstIdx / haystack.length; // 0~1
      position = Math.max(1, Math.min(10, Math.floor(ratio * 10) + 1));
    }
  }

  let snippet = null;
  if (cited) {
    const idx = urlIdx !== -1 ? urlIdx : textIdx !== -1 ? textIdx : 0;
    const start = Math.max(0, idx - 50);
    snippet = haystack.slice(start, start + 200);
  }

  return { cited, position, snippet };
}

// ----------------------------------------------------------------------------
// 한 variant + 한 engine 측정
// ----------------------------------------------------------------------------
async function measureOne({ variant, sourceUrl, textMatch, contentId, engine }) {
  let raw = null;
  let text = '';
  let citations = [];
  try {
    if (engine === 'perplexity') {
      ({ text, citations, raw } = await callPerplexity(QUERY));
    } else if (engine === 'chatgpt') {
      ({ text, citations, raw } = await callChatGPT(QUERY));
    } else {
      throw new Error(`지원하지 않는 엔진: ${engine}`);
    }
  } catch (err) {
    console.error(`[ERR] ${variant} × ${engine} 호출 실패:`, err.message);
    return { variant, engine, cited: false, position: null, error: err.message };
  }

  const { cited, position, snippet } = judgeCitation({ text, citations }, sourceUrl, textMatch);

  // search_engine 컬럼 매핑 (chatgpt → chatgpt_search)
  const searchEngineColumn = engine === 'chatgpt' ? 'chatgpt_search' : engine;

  const row = {
    pair_id: PAIR_ID,
    variant,
    content_id: contentId,
    scene_sentence: variant === 'cep_applied' ? SCENE_SENTENCE : null,
    cep_keyword: variant === 'cep_applied' ? CEP_KEYWORD : null,
    query: QUERY,
    search_engine: searchEngineColumn,
    cited,
    citation_position: position,
    citation_snippet: snippet,
    source_url: sourceUrl,
    raw_response: raw,
    notes: NOTES,
  };

  const { error } = await supabase.from('cep_ab_results').insert(row);
  if (error) {
    console.error(`[WARN] Supabase insert 실패 (${variant} × ${engine}):`, error.message);
  }

  return { variant, engine, cited, position };
}

// ----------------------------------------------------------------------------
// 메인 실행
// ----------------------------------------------------------------------------
async function main() {
  const tasks = [];
  for (const engine of ENGINES) {
    tasks.push(
      measureOne({
        variant: 'cep_applied',
        sourceUrl: APPLIED_URL,
        textMatch: APPLIED_TEXT_MATCH,
        contentId: APPLIED_CONTENT_ID,
        engine,
      })
    );
    tasks.push(
      measureOne({
        variant: 'cep_skipped',
        sourceUrl: SKIPPED_URL,
        textMatch: SKIPPED_TEXT_MATCH,
        contentId: SKIPPED_CONTENT_ID,
        engine,
      })
    );
  }

  const settled = await Promise.allSettled(tasks);
  const results = settled.map((s) =>
    s.status === 'fulfilled' ? s.value : { variant: '?', engine: '?', cited: false, position: null, error: s.reason?.message }
  );

  // ---- 표 형식 출력 ----
  const pad = (s, n) => {
    const str = String(s);
    if (str.length >= n) return str.slice(0, n);
    return str + ' '.repeat(n - str.length);
  };

  console.log('');
  console.log(`pair_id: ${PAIR_ID}`);
  console.log(`query  : ${QUERY}`);
  console.log('');
  console.log('+--------------------+--------------+----------+-------+');
  console.log('| variant            | engine       | cited    | pos   |');
  console.log('+--------------------+--------------+----------+-------+');
  for (const r of results) {
    const posStr = r.position == null ? '-' : String(r.position);
    console.log(`| ${pad(r.variant, 18)} | ${pad(r.engine, 12)} | ${pad(r.cited, 8)} | ${pad(posStr, 5)} |`);
  }
  console.log('+--------------------+--------------+----------+-------+');

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    console.log('');
    console.log(`[INFO] 실패 ${failed.length}건:`);
    for (const f of failed) console.log(`  - ${f.variant} × ${f.engine}: ${f.error}`);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
