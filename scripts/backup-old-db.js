// 구 DB 전체 백업 — 모든 핵심 테이블을 JSON 파일로 저장
const fs = require('fs');
const path = require('path');

const OLD_URL = 'https://haxcktfnuudlqciyljtp.supabase.co';
const OLD_KEY = process.env.OLD_KEY;
const TABLES = ['user_profiles', 'user_projects', 'project_files', 'generate_results', 'blog_articles'];

async function fetchAll(table) {
  const rows = [];
  let offset = 0; const limit = 200;
  for (;;) {
    const r = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`, {
      headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` },
    });
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return rows;
}

(async () => {
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = path.join(process.cwd(), 'backup', `old-db-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  const summary = {};
  for (const t of TABLES) {
    const rows = await fetchAll(t);
    fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2), 'utf8');
    summary[t] = rows.length;
    console.log(`  ${t}: ${rows.length} rows → ${path.join(dir, t + '.json')}`);
  }
  fs.writeFileSync(path.join(dir, '_summary.json'), JSON.stringify({ db: OLD_URL, backedUpAt: new Date().toISOString(), counts: summary }, null, 2));
  console.log('\n백업 완료:', dir);
})();
