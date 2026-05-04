// 1차 카테고리 → 2차 카테고리로 병합
// 말로-만드는-창업-바이브코딩 (15편) → 말로-만드는-창업의-시대,-바이브코딩 (60편)
const fs = require('fs'), path = require('path');
const { createClient } = require('@supabase/supabase-js');
const env = {};
fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (!m) return;
  let v = m[2].trim(); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
  env[m[1]] = v.replace(/\\n$/,'').trim();
});
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FROM = '말로-만드는-창업-바이브코딩';
const TO = '말로-만드는-창업의-시대,-바이브코딩';

(async () => {
  const mode = process.argv[2] || 'dry-run';
  console.log(`==== ${mode}: '${FROM}' → '${TO}' ====`);

  const a = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', FROM);
  const b = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', TO);
  console.log(`현재: '${FROM}'=${a.count}편 / '${TO}'=${b.count}편`);

  if ((a.count || 0) === 0) { console.log('이전할 글 없음.'); return; }

  if (mode === 'dry-run') {
    console.log(`*** dry-run 종료. 'apply'로 ${a.count}편 병합 가능. ***`);
    return;
  }

  const { error } = await supa.from('blog_articles').update({ category: TO }).eq('category', FROM);
  if (error) { console.error('UPDATE 실패:', error); return; }
  const a2 = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', FROM);
  const b2 = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', TO);
  console.log(`이후: '${FROM}'=${a2.count}편 / '${TO}'=${b2.count}편`);
  console.log('✅ 완료');
})();
