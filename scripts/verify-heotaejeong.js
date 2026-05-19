// 허태정-대전시장-후보자 카테고리 언어별 분포 검증
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

function detectLanguage(text) {
  if (!text) return 'ko';
  const sample = text.slice(0, 3000);
  const ko = (sample.match(/[가-힣]/g) || []).length;
  const ja = (sample.match(/[぀-ゟ゠-ヿ]/g) || []).length;
  const zh = (sample.match(/[一-鿿]/g) || []).length;
  const en = (sample.match(/[a-zA-Z]/g) || []).length;
  if (ja >= 10) return 'ja';
  const cands = [['ko',ko],['en',en],['zh',zh]];
  cands.sort((a,b)=>b[1]-a[1]);
  const [top, cnt] = cands[0];
  if (cnt === 0) return 'ko';
  if (top === 'zh' && ja >= 5) return 'ja';
  return top;
}

(async () => {
  const PAGE = 1000;
  const all = [];
  for (let p = 0; p < 50; p++) {
    const { data, error } = await supa
      .from('blog_articles')
      .select('id, title, content, created_at')
      .eq('category', '허태정-대전시장-후보자')
      .order('created_at', { ascending: false })
      .range(p*PAGE, (p+1)*PAGE-1);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`'허태정-대전시장-후보자' 전체: ${all.length}건`);
  const counts = { ko:0, en:0, zh:0, ja:0 };
  all.forEach(r => {
    const lang = detectLanguage(`${r.title || ''}\n${(r.content || '').slice(0, 1500)}`);
    counts[lang] = (counts[lang] || 0) + 1;
  });
  console.log(`\n[언어별 자동 감지 결과 — 카테고리 페이지에서 보일 분포]`);
  console.log(`  🇰🇷 한국어: ${counts.ko}`);
  console.log(`  🇺🇸 English: ${counts.en}`);
  console.log(`  🇨🇳 中文: ${counts.zh}`);
  console.log(`  🇯🇵 日本語: ${counts.ja}`);
})();
