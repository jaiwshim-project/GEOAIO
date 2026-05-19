// 정원오 서울시장 후보 카테고리 두 개 통일
// '정원오-서울시장-후보' → '정원오-서울시장-후보자'로 일괄 변경
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envText = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envText.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) return;
  let v = m[2].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  v = v.replace(/\\n$/,'').trim();
  env[m[1]] = v;
});
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FROM = '정원오-서울시장-후보';
const TO = '정원오-서울시장-후보자';

(async () => {
  const mode = process.argv[2] || 'dry-run';
  console.log(`==== ${mode} : '${FROM}' → '${TO}' ====`);

  // 두 카테고리 글 수 조회
  const { count: fromCount } = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', FROM);
  const { count: toCount } = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', TO);
  console.log(`[현재] '${FROM}' = ${fromCount}건  /  '${TO}' = ${toCount}건`);

  if ((fromCount || 0) === 0) {
    console.log('이전할 글 없음. 종료.');
    return;
  }

  // 샘플 5건 미리보기
  const { data: sample } = await supa.from('blog_articles').select('id, title').eq('category', FROM).limit(5);
  console.log('\n[샘플 5건]');
  (sample || []).forEach(r => console.log(`  - ${(r.title || '').slice(0, 70)}`));

  if (mode === 'dry-run') {
    console.log(`\n*** dry-run 종료 — 'apply'로 다시 실행하면 ${fromCount}건 카테고리 변경. ***`);
    return;
  }

  // apply
  console.log(`\n[APPLY] ${fromCount}건 UPDATE 실행`);
  const { error } = await supa.from('blog_articles').update({ category: TO }).eq('category', FROM);
  if (error) { console.error('UPDATE 실패:', error); return; }

  // 검증
  const { count: afterFrom } = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', FROM);
  const { count: afterTo } = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', TO);
  console.log(`\n[검증] '${FROM}' = ${afterFrom}건  /  '${TO}' = ${afterTo}건`);
  console.log(`✅ 완료`);
})();
