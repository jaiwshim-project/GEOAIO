// 구 DB → 운영 DB 누락 카테고리 글 마이그레이션
const OLD_URL = 'https://haxcktfnuudlqciyljtp.supabase.co';
const OLD_KEY = process.env.OLD_KEY;
const PROD_URL = 'https://whmiinsaxthenpwjtuar.supabase.co';
const PROD_KEY = process.env.PROD_KEY;

const TARGET_CATEGORIES = [
  '선명회계법인',
  '로엘-법무법인',
  '에블린영풍',
  '틴트라이프tintlife',
  'ax-biz',
  '라이프스타일',
  '바이브코딩-클로드코드',
  'ai선거솔루션-워룸',
];

async function fetchOld(category) {
  const url = `${OLD_URL}/rest/v1/blog_articles?select=*&category=eq.${encodeURIComponent(category)}&limit=200`;
  const res = await fetch(url, {
    headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` },
  });
  if (!res.ok) throw new Error(`fetchOld ${category} ${res.status}`);
  return res.json();
}

async function existsProd(id) {
  const url = `${PROD_URL}/rest/v1/blog_articles?select=id&id=eq.${id}&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: PROD_KEY, Authorization: `Bearer ${PROD_KEY}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.length > 0;
}

async function insertProd(rows) {
  const res = await fetch(`${PROD_URL}/rest/v1/blog_articles`, {
    method: 'POST',
    headers: {
      apikey: PROD_KEY,
      Authorization: `Bearer ${PROD_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`insert ${res.status} ${txt.slice(0, 300)}`);
  }
}

(async () => {
  let total = 0;
  for (const cat of TARGET_CATEGORIES) {
    const rows = await fetchOld(cat);
    if (rows.length === 0) {
      console.log(`[SKIP] ${cat}: 0건`);
      continue;
    }
    // 운영 DB 스키마에 없는 컬럼 제거
    const cleaned = rows.map(r => {
      const { candidate_id, ...rest } = r;
      return rest;
    });
    // PostgREST upsert: id 충돌은 merge-duplicates로 처리
    await insertProd(cleaned);
    console.log(`[OK]   ${cat}: ${rows.length}건 마이그레이션`);
    total += rows.length;
  }
  console.log(`\n총 ${total}건 마이그레이션 완료`);
})();
