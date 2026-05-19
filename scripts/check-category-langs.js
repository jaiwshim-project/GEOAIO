// 카테고리별 언어 분포 확인 — 총 편수 = ko+en+zh+ja 합 일치 여부 검증
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) {
    acc[m[1]] = m[2]
      .replace(/^["']|["']$/g, '')
      .replace(/\\n|\\r|\\t/g, '')
      .replace(/\s/g, '');
  }
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const PAGE_SIZE = 1000;
  const all = [];
  for (let p = 0; p < 50; p++) {
    const { data } = await supa
      .from('blog_articles')
      .select('category, author')
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  console.log(`전체 row 수: ${all.length}`);

  const byCat = {}; // { categoryName: { total, ko, en, zh, ja, other } }
  for (const r of all) {
    const cat = r.category || '(empty)';
    if (!byCat[cat]) byCat[cat] = { total: 0, ko: 0, en: 0, zh: 0, ja: 0, other: 0 };
    byCat[cat].total++;
    let lang = 'ko'; // 기본
    if (r.author) {
      try {
        const m = JSON.parse(r.author);
        const explicit = m?.metadata?.lang || m?.lang;
        if (explicit && ['ko', 'en', 'zh', 'ja'].includes(explicit)) lang = explicit;
        else if (explicit) lang = 'other';
      } catch {}
    }
    byCat[cat][lang]++;
  }

  console.log('\n[카테고리별 언어 분포]');
  console.log('카테고리'.padEnd(45) + '총편수' + '\t' + 'ko' + '\t' + 'en' + '\t' + 'zh' + '\t' + 'ja' + '\t' + 'other' + '\t합계검증');
  Object.entries(byCat)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, c]) => {
      const sum = c.ko + c.en + c.zh + c.ja + c.other;
      const ok = sum === c.total ? '✓' : '✗ DIFF';
      console.log(`${cat.padEnd(45)}${c.total}\t${c.ko}\t${c.en}\t${c.zh}\t${c.ja}\t${c.other}\t${ok}`);
    });
})();
