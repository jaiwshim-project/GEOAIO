// 블로그 카테고리 병합:
//   FROM 'ax온톨로지-진단' → TO 'ax온톨로지-조직진단'
// DRY=1 으로 먼저 확인, 그 다음 실제 실행.

const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '');
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

const FROM = 'ax온톨로지-진단';
const TO = 'ax온톨로지-조직진단';
const DRY = process.env.DRY === '1';

async function rest(method, path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: { ...H, Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log(`=== merge-blog-category ${DRY ? '(DRY RUN)' : '(REAL)'} ===`);
  console.log(`Supabase: ${SB_URL}`);
  console.log(`FROM: '${FROM}'`);
  console.log(`TO  : '${TO}'\n`);

  // 양 카테고리에 어떤 변형들이 있는지 확인 (대소문자·하이픈 등)
  const from = encodeURIComponent(FROM);
  const to = encodeURIComponent(TO);
  const fromPosts = await rest('GET', `blog_articles?category=eq.${from}&select=id,title,category&limit=10000`);
  const toPosts = await rest('GET', `blog_articles?category=eq.${to}&select=id,title,category&limit=10000`);

  console.log(`병합 대상 (FROM='${FROM}'): ${fromPosts.length}개`);
  if (fromPosts.length > 0) {
    fromPosts.slice(0, 5).forEach((p, i) => console.log(`  ${i + 1}. ${p.title.slice(0, 50)}...`));
    if (fromPosts.length > 5) console.log(`  ... +${fromPosts.length - 5}개`);
  }
  console.log(`기존 (TO='${TO}'): ${toPosts.length}개\n`);

  if (fromPosts.length === 0) {
    console.log('병합할 글 없음. 종료.');
    return;
  }

  if (DRY) {
    console.log(`[DRY] 위 ${fromPosts.length}개의 category를 '${TO}'로 일괄 update 예정.`);
    console.log('실제 실행하려면 DRY=1 빼고 다시 실행.');
    return;
  }

  // 일괄 update
  const updateRes = await fetch(`${SB_URL}/rest/v1/blog_articles?category=eq.${from}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ category: TO }),
  });
  if (!updateRes.ok) {
    console.error(`UPDATE 실패: ${updateRes.status} ${await updateRes.text()}`);
    process.exit(1);
  }
  console.log(`✓ ${fromPosts.length}개 글의 category를 '${FROM}' → '${TO}'로 변경 완료`);

  // 검증
  const after = await rest('GET', `blog_articles?category=eq.${to}&select=id&limit=10000`);
  console.log(`✓ '${TO}' 최종 글 수: ${after.length}개 (이전 ${toPosts.length} + 병합 ${fromPosts.length} = ${toPosts.length + fromPosts.length})`);

  const fromAfter = await rest('GET', `blog_articles?category=eq.${from}&select=id&limit=10000`);
  console.log(`✓ '${FROM}' 최종 글 수: ${fromAfter.length}개 (0이면 성공)`);
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
