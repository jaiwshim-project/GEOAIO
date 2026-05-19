// 에바셀 카테고리 글 전부 삭제
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

const CATEGORY = '에바셀';

(async () => {
  const { data: rows, error: selErr } = await supa
    .from('blog_articles')
    .select('id, title, created_at')
    .eq('category', CATEGORY)
    .order('created_at', { ascending: false });
  if (selErr) { console.error('SELECT 오류:', selErr); process.exit(1); }
  console.log(`[삭제 대상] ${rows?.length ?? 0}개 글 (카테고리="${CATEGORY}")`);
  (rows || []).forEach((r, i) => console.log(`  ${i + 1}. id=${r.id} title="${r.title}"`));

  if (!rows || rows.length === 0) { console.log('삭제할 글이 없습니다.'); return; }

  const { error: delErr, count } = await supa
    .from('blog_articles')
    .delete({ count: 'exact' })
    .eq('category', CATEGORY);
  if (delErr) { console.error('DELETE 오류:', delErr); process.exit(1); }
  console.log(`\n✅ 삭제 완료: ${count ?? '?'}개 row 제거됨`);

  // 검증
  const { data: leftover } = await supa
    .from('blog_articles')
    .select('id', { count: 'exact', head: true })
    .eq('category', CATEGORY);
  console.log(`확인: 남은 "${CATEGORY}" 글 개수 = ${leftover?.length ?? 0}`);
})();
