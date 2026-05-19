// geo-aio 카테고리 글 + 전체 카테고리 분포 조사
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
  // 1. geo-aio 카테고리 글 조회
  const { data: articles, error } = await supa
    .from('blog_articles')
    .select('id, title, category, created_at, content')
    .eq('category', 'geo-aio')
    .order('created_at', { ascending: false });
  if (error) { console.error('SELECT 오류:', error); process.exit(1); }
  console.log(`\n[geo-aio 카테고리] ${articles?.length ?? 0}개 글`);
  (articles || []).forEach((a, i) => {
    const excerpt = (a.content || '').slice(0, 120).replace(/\n/g, ' / ');
    console.log(`  ${i + 1}. id=${a.id}`);
    console.log(`     title="${a.title}"`);
    console.log(`     excerpt="${excerpt}..."`);
  });

  // 2. 전체 카테고리 분포
  const { data: all } = await supa.from('blog_articles').select('category');
  const counts = {};
  (all || []).forEach(r => { if (r.category) counts[r.category] = (counts[r.category] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log(`\n[전체 카테고리 분포] ${sorted.length}개 카테고리`);
  sorted.forEach(([cat, n]) => console.log(`  ${n.toString().padStart(4)}편  ${cat}`));
})();
