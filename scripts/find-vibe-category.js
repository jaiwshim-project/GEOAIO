const fs = require('fs'), path = require('path');
const { createClient } = require('@supabase/supabase-js');
const env = {};
fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (!m) return;
  let v = m[2].trim(); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
  env[m[1]] = v.replace(/\\n$/,'').trim();
});
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // 다양한 슬러그 변형 모두 검색
  const patterns = ['말로', '바이브', '창업', '코딩'];
  const allMatches = new Set();
  for (const p of patterns) {
    const { data } = await supa.from('blog_articles').select('category').ilike('category', `%${p}%`).limit(1000);
    (data || []).forEach(r => { if (r.category) allMatches.add(r.category); });
  }
  console.log(`매칭된 카테고리 ${allMatches.size}개:`);

  // 각 카테고리별 글 수 + 언어별 분포 (author 메타 lang)
  for (const cat of allMatches) {
    const { count } = await supa.from('blog_articles').select('*', { count: 'exact', head: true }).eq('category', cat);
    const { data: rows } = await supa.from('blog_articles').select('id, title, author').eq('category', cat).limit(200);
    const langs = { ko: 0, en: 0, zh: 0, ja: 0, unknown: 0 };
    (rows || []).forEach(r => {
      try {
        const meta = JSON.parse(r.author || '{}');
        const lang = meta?.metadata?.lang || meta?.lang || 'unknown';
        if (langs[lang] !== undefined) langs[lang]++;
        else langs.unknown++;
      } catch { langs.unknown++; }
    });
    console.log(`\n  [${count}편] "${cat}"`);
    console.log(`    🇰🇷 ${langs.ko}  🇺🇸 ${langs.en}  🇨🇳 ${langs.zh}  🇯🇵 ${langs.ja}  ❓ ${langs.unknown}`);
    if ((rows || []).length > 0) console.log(`    샘플 제목: ${(rows[0].title || '').slice(0, 70)}`);
  }
})();
