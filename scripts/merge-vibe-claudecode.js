// 바이브코딩-클로드코드 + 말로-만드는-창업의-시대,-바이브코딩
// → 말로-만드는-창업의-시대, 바이브코딩 클로드코드 (사용자 입력 그대로)
const fs = require('fs'), path = require('path');
const { createClient } = require('@supabase/supabase-js');
const env = {};
fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (!m) return;
  let v = m[2].trim(); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
  env[m[1]] = v.replace(/\\n$/,'').trim();
});
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FROM_LIST = ['바이브코딩-클로드코드', '말로-만드는-창업의-시대,-바이브코딩'];
const TO = '말로-만드는-창업의-시대, 바이브코딩 클로드코드';

(async () => {
  const mode = process.argv[2] || 'dry-run';
  console.log(`==== ${mode}: 두 카테고리 → '${TO}' 통합 ====`);

  for (const cat of FROM_LIST) {
    const { count } = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', cat);
    console.log(`  '${cat}' = ${count}편`);
  }
  const target0 = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', TO);
  console.log(`  '${TO}' = ${target0.count}편 (target)`);

  if (mode === 'dry-run') {
    console.log(`\n*** dry-run 종료. 'apply'로 실제 병합 가능. ***`);
    return;
  }

  for (const cat of FROM_LIST) {
    const { error } = await supa.from('blog_articles').update({ category: TO }).eq('category', cat);
    if (error) { console.error(`'${cat}' UPDATE 실패:`, error); continue; }
    console.log(`  ✓ '${cat}' → '${TO}' 이전 완료`);
  }

  const target1 = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', TO);
  console.log(`\n[검증] '${TO}' = ${target1.count}편`);
  console.log('✅ 완료');
})();
