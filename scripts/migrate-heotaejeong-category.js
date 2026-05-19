// AI선거솔루션 카테고리에 잘못 저장된 허태정 콘텐츠를 '허태정-대전시장-후보자'로 이전
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

const FROM_CATEGORY = 'AI선거솔루션';
const TO_CATEGORY = '허태정-대전시장-후보자';
const HEO_PATTERNS = ['허태정', '허태정', '許泰正', '許太正', '许泰正', '许太正', '許泰政', '许泰政', 'Heo Tae-jung', 'Heo Tae-jeong', 'Heo Taejung'];

function isHeoArticle(row) {
  const blob = `${row.title || ''}\n${(row.content || '').slice(0, 800)}\n${(row.tags || []).join(',')}`;
  return HEO_PATTERNS.some(p => blob.includes(p)) || /heo\s*tae/i.test(blob);
}

(async () => {
  const mode = process.argv[2] || 'dry-run'; // 'dry-run' | 'apply'
  console.log(`==== Migration Mode: ${mode} ====`);

  // 1. AI선거솔루션 전체 글 fetch
  const PAGE = 1000;
  const all = [];
  for (let p = 0; p < 50; p++) {
    const from = p * PAGE;
    const to = from + PAGE - 1;
    const { data, error } = await supa
      .from('blog_articles')
      .select('id, title, category, tags, created_at, content')
      .eq('category', FROM_CATEGORY)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) { console.error('FETCH error:', error); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`[1] '${FROM_CATEGORY}' 전체 글 수: ${all.length}`);

  // 2. 허태정 관련 vs 비관련 분리
  const heo = all.filter(isHeoArticle);
  const others = all.filter(r => !isHeoArticle(r));
  console.log(`[2] 허태정 관련: ${heo.length}건 / 비관련(이전 제외): ${others.length}건`);

  if (others.length > 0) {
    console.log('\n[2-1] 비관련 글 샘플 (이전에서 제외됨, category 그대로):');
    others.slice(0, 10).forEach(r => {
      console.log(`     - ${(r.title || '').slice(0, 70)}`);
    });
  }

  if (heo.length === 0) {
    console.log('\n이전 대상이 없습니다. 종료.');
    return;
  }

  console.log('\n[3] 이전 대상 (허태정 글) 처음 10건:');
  heo.slice(0, 10).forEach(r => {
    console.log(`     ${r.created_at?.slice(0,19)}  ${(r.title || '').slice(0, 75)}`);
  });

  if (mode === 'dry-run') {
    console.log(`\n*** dry-run 종료 — 'apply'로 다시 실행하면 ${heo.length}건의 category를 '${TO_CATEGORY}'로 업데이트합니다. ***`);
    return;
  }

  // 3. apply: 100건씩 배치 UPDATE
  console.log(`\n[4] APPLY 시작 — ${heo.length}건의 category를 '${TO_CATEGORY}'로 변경`);
  const ids = heo.map(r => r.id);
  const BATCH = 100;
  let done = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    const { error } = await supa
      .from('blog_articles')
      .update({ category: TO_CATEGORY })
      .in('id', slice);
    if (error) { console.error(`     ❌ batch ${i}-${i + slice.length} error:`, error); break; }
    done += slice.length;
    console.log(`     ✓ ${done}/${ids.length}`);
  }

  // 4. 검증
  const { count: afterTo, error: e1 } = await supa
    .from('blog_articles')
    .select('*', { count: 'exact', head: true })
    .eq('category', TO_CATEGORY);
  const { count: afterFrom, error: e2 } = await supa
    .from('blog_articles')
    .select('*', { count: 'exact', head: true })
    .eq('category', FROM_CATEGORY);
  if (e1 || e2) console.error('verify error:', e1, e2);
  console.log(`\n[5] 검증:`);
  console.log(`     - '${TO_CATEGORY}' 현재 글 수: ${afterTo}`);
  console.log(`     - '${FROM_CATEGORY}' 현재 글 수(잔여): ${afterFrom}`);
  console.log(`\n✅ 완료`);
})();
