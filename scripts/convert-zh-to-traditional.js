// 허태정 카테고리 중국어 글(간체)을 번체(대만/홍콩 타깃)로 변환
// 변환기: opencc-js, s2twp (대만 자형 + 어휘 변환) → 가장 자연스러운 대만식 번체
// 홍콩 시장도 자형 호환됨
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenCC = require('opencc-js');

const envText = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envText.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) return;
  let v = m[2].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
  v = v.replace(/\\n$/,'').trim();
  env[m[1]] = v;
});
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 간체(cn) → 번체(대만 자형 + 대만식 어휘) 변환기
const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

// 카테고리 페이지(app/blog/category/[slug]/page.tsx)와 동일한 detectLanguage 로직
// — 카테고리 페이지가 zh로 분류하는 글과 정확히 같은 집합을 변환해야 일관성 유지
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
function isChineseArticle(row) {
  return detectLanguage(`${row.title || ''}\n${(row.content || '').slice(0, 1500)}`) === 'zh';
}

(async () => {
  const mode = process.argv[2] || 'dry-run';
  console.log(`==== Chinese Simplified → Traditional (twp) — Mode: ${mode} ====`);

  // 허태정 카테고리 전체 fetch
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
  console.log(`[1] '허태정-대전시장-후보자' 전체: ${all.length}건`);

  const chinese = all.filter(isChineseArticle);
  console.log(`[2] 중국어로 추정되는 글: ${chinese.length}건\n`);

  // 변환 미리보기
  chinese.slice(0, 3).forEach((r, i) => {
    const newTitle = converter(r.title || '');
    console.log(`[샘플 ${i+1}]`);
    console.log(`  Before: ${(r.title || '').slice(0, 80)}`);
    console.log(`  After : ${newTitle.slice(0, 80)}`);
    console.log('');
  });

  if (mode === 'dry-run') {
    console.log(`*** dry-run 종료 — 'apply'로 다시 실행하면 ${chinese.length}건의 title/content를 번체로 변환합니다. ***`);
    return;
  }

  // 실제 변환 + UPDATE
  console.log(`[3] APPLY 시작 — ${chinese.length}건 변환 + UPDATE`);
  let done = 0, failed = 0;
  for (const r of chinese) {
    try {
      const newTitle = converter(r.title || '');
      const newContent = converter(r.content || '');
      // 변경 없으면 skip (이미 번체이거나 한자 없음)
      if (newTitle === r.title && newContent === r.content) {
        console.log(`     · ${r.id} 변경 없음 (skip)`);
        continue;
      }
      const { error } = await supa
        .from('blog_articles')
        .update({ title: newTitle, content: newContent })
        .eq('id', r.id);
      if (error) { console.error(`     ❌ ${r.id} update error:`, error.message); failed++; continue; }
      done++;
      console.log(`     ✓ ${done}/${chinese.length} — ${newTitle.slice(0, 60)}`);
    } catch (e) {
      console.error(`     ❌ ${r.id} error:`, e.message);
      failed++;
    }
  }
  console.log(`\n[4] 완료: 성공 ${done}건, 실패 ${failed}건`);

  // 검증
  const { data: verifyData } = await supa
    .from('blog_articles')
    .select('id, title')
    .eq('category', '허태정-대전시장-후보자')
    .ilike('title', '%許%')
    .limit(5);
  console.log(`\n[5] 검증 — 번체 키워드(許) 포함 글 샘플:`);
  (verifyData || []).forEach(r => console.log(`     - ${(r.title || '').slice(0, 80)}`));

  console.log(`\n✅ 완료`);
})();
