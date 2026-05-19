// 허태정 후보 콘텐츠를 모든 카테고리에서 찾는 스크립트
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .env.local 수동 파싱
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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supa = createClient(url, key);

(async () => {
  const PAGE = 1000;
  const all = [];
  for (let p = 0; p < 50; p++) {
    const from = p * PAGE;
    const to = from + PAGE - 1;
    const { data, error } = await supa
      .from('blog_articles')
      .select('id, title, category, tags, created_at, author')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`전체 글 수: ${all.length}`);

  // 1) 제목/태그/카테고리/키워드에 '허태정'이 들어간 글
  const matched = all.filter(r => {
    const blob = `${r.title || ''} | ${r.category || ''} | ${(r.tags||[]).join(',')}`;
    return blob.includes('허태정') || blob.toLowerCase().includes('heo tae') || blob.includes('许泰正') || blob.includes('ホ・テジョン') || blob.includes('ホテジョン');
  });
  console.log(`\n=== '허태정' 관련 추정 글 수: ${matched.length} ===`);

  // 카테고리별 카운트
  const byCat = {};
  matched.forEach(r => {
    const c = r.category || '(empty)';
    byCat[c] = (byCat[c] || 0) + 1;
  });
  console.log('\n[카테고리별 분포]');
  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).forEach(([c, n]) => {
    console.log(`  ${n.toString().padStart(3)}건  |  category="${c}"`);
  });

  // 최근 30건 미리보기
  console.log('\n[최근 30건 — id / category / title]');
  matched.slice(0, 30).forEach(r => {
    console.log(`  ${r.created_at?.slice(0,19)}  cat="${r.category}"  ${r.title?.slice(0,60)}`);
  });

  // 2) 정확히 카테고리 == "허태정 대전시장 후보자" 인 글 수
  const exact = all.filter(r => r.category === '허태정 대전시장 후보자');
  console.log(`\n=== category === "허태정 대전시장 후보자" 인 글 수: ${exact.length} ===`);

  // 3) 외국어 콘텐츠(영/중/일) 후보 — 제목에 ASCII/한자/일문 포함
  const foreign = matched.filter(r => /[A-Za-z]{6,}/.test(r.title || '') || /[぀-ヿ]/.test(r.title || '') || /[一-鿿]/.test(r.title || ''));
  console.log(`\n=== 외국어(영/중/일) 추정 글 수: ${foreign.length} ===`);
  foreign.slice(0, 20).forEach(r => {
    console.log(`  cat="${r.category}"  ${r.title?.slice(0,80)}`);
  });
})();
