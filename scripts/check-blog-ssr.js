const https = require('https');
const fs = require('fs'), path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
function getEnv(key) {
  const line = raw.split(/\r?\n/).find(l => l.startsWith(key + '='));
  if (!line) return '';
  let val = line.slice(key.length+1).replace(/^["']|["']$/g,'').trim();
  while(val.endsWith('\\n')||val.endsWith('\n')) val=val.replace(/\\n$/,'').replace(/\n$/,'').trim();
  return val;
}
const base = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

function httpGet(url, headers = {}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: b }); } catch { resolve({ status: res.statusCode, data: b }); } });
    }).on('error', e => resolve({ error: e.message }));
  });
}

(async () => {
  // 1. 최신 포스트 ID 조회
  const dbRes = await httpGet(
    base + '/rest/v1/blog_articles?select=id,title,content&limit=1&order=created_at.desc',
    { apikey: anonKey, Authorization: 'Bearer ' + anonKey }
  );
  const rows = JSON.parse(dbRes.data);
  if (!rows[0]) { console.log('포스트 없음'); return; }
  const post = rows[0];
  console.log('포스트 제목:', post.title?.substring(0, 50));
  console.log('포스트 ID:', post.id);

  // Q: A: 패턴 확인
  const hasQA = /^Q[:：]/m.test(post.content || '');
  const qaSample = (post.content || '').match(/Q[:：].{0,150}/)?.[0];
  console.log('Q:A: 패턴:', hasQA, '| 샘플:', qaSample || '없음');

  // 2. 실제 포스트 페이지 크롤링
  const pageRes = await httpGet(
    'https://www.geo-aio.com/blog/' + post.id,
    { 'User-Agent': 'PerplexityBot/1.0 (+https://perplexity.ai/perplexitybot)' }
  );
  const html = pageRes.data;
  const koreanCount = (html.match(/[가-힣]/g) || []).length;
  const hasJsonLd = html.includes('application/ld+json');
  const hasFaqSchema = html.includes('FAQPage');
  const hasArticleSchema = html.includes('"Article"');

  // JSON-LD 내용 추출
  const ldMatches = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const schemas = ldMatches.map(m => {
    try { return JSON.parse(m[1]); } catch { return null; }
  }).filter(Boolean);

  console.log('\n=== 크롤러 관점 분석 ===');
  console.log('HTML 길이:', html.length, '| 한글 문자:', koreanCount);
  console.log('JSON-LD:', hasJsonLd, '| FAQPage 스키마:', hasFaqSchema, '| Article 스키마:', hasArticleSchema);
  console.log('스키마 수:', schemas.length, '| 타입들:', schemas.map(s => s['@type']).join(', '));

  // FAQ 스키마 상세
  const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
  if (faqSchema) {
    console.log('\nFAQPage 항목 수:', faqSchema.mainEntity?.length || 0);
    if (faqSchema.mainEntity?.[0]) {
      console.log('첫 번째 Q:', faqSchema.mainEntity[0].name?.substring(0, 60));
    }
  } else {
    console.log('\n⚠ FAQPage 스키마 없음 — Q: A: 패턴 미감지');
  }
})();
