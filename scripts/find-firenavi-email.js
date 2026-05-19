// contact@firenavi.com이 저장된 모든 위치 탐색
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

const NEEDLE = 'firenavi';

(async () => {
  // 1. user_projects 모든 컬럼에서 검색
  const { data: ups } = await supa.from('user_projects').select('*');
  console.log(`\n[user_projects] ${ups?.length ?? 0}개 row 스캔`);
  (ups || []).forEach(r => {
    Object.entries(r).forEach(([k, v]) => {
      if (typeof v === 'string' && v.toLowerCase().includes(NEEDLE)) {
        console.log(`  ✔ id=${r.id} name="${r.name}" 컬럼=${k}: ${v.slice(0, 200)}`);
      }
    });
  });

  // 2. blog_articles 본문에서 검색 (대량이라 페이지)
  let total = 0, hits = 0;
  for (let off = 0; off < 5000; off += 500) {
    const { data: bs } = await supa.from('blog_articles').select('id, title, content_md, content_html').range(off, off + 499);
    if (!bs || bs.length === 0) break;
    total += bs.length;
    bs.forEach(r => {
      const blob = `${r.content_md || ''}\n${r.content_html || ''}\n${r.title || ''}`;
      if (blob.toLowerCase().includes(NEEDLE)) {
        hits++;
        const idx = blob.toLowerCase().indexOf(NEEDLE);
        console.log(`  ✔ blog id=${r.id} title="${(r.title || '').slice(0, 60)}" 발췌: ...${blob.slice(Math.max(0, idx - 30), idx + 80)}...`);
      }
    });
    if (bs.length < 500) break;
  }
  console.log(`\n[blog_articles] ${total}개 스캔, "${NEEDLE}" 포함 ${hits}개`);

  // 3. 다른 테이블도 확인
  const tables = ['blog_category_projects', 'users', 'clinics'];
  for (const t of tables) {
    try {
      const { data, error } = await supa.from(t).select('*').limit(2000);
      if (error) { console.log(`\n[${t}] 조회 실패 또는 미존재: ${error.message}`); continue; }
      console.log(`\n[${t}] ${data?.length ?? 0}개 row 스캔`);
      (data || []).forEach(r => {
        Object.entries(r).forEach(([k, v]) => {
          if (typeof v === 'string' && v.toLowerCase().includes(NEEDLE)) {
            console.log(`  ✔ id=${r.id} 컬럼=${k}: ${v.slice(0, 200)}`);
          }
        });
      });
    } catch (e) {
      console.log(`\n[${t}] 예외: ${e.message}`);
    }
  }
})();
