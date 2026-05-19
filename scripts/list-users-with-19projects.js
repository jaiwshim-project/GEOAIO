// 19개 프로젝트를 가진 사용자(=쌍 04, 17, 18, 19가 존재 가능한 계정)를 식별
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '');
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

async function main() {
  // user_projects를 user_id별로 카운트하기 위해 모두 가져옴
  const projs = await fetch(`${SB_URL}/rest/v1/user_projects?select=user_id,name,created_at&order=created_at.desc`, { headers: H }).then(r => r.json());
  const byUser = {};
  for (const p of projs) {
    byUser[p.user_id] = (byUser[p.user_id] || 0) + 1;
  }
  // 카운트가 큰 순으로 정렬
  const sorted = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('상위 사용자별 프로젝트 수:');
  for (const [uid, cnt] of sorted) {
    const u = await fetch(`${SB_URL}/rest/v1/user_profiles?id=eq.${uid}&select=username,email,company_name`, { headers: H }).then(r => r.json());
    console.log(`  ${cnt}개 — id=${uid}  ${JSON.stringify(u[0] || {})}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
