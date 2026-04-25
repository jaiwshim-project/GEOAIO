// 구 DB → 신 DB: user_projects, project_files, generate_results 일괄 마이그레이션
// user_id 22c13232... (구 tester) → 6524116a... (신 tester) 자동 변환
const OLD_URL = 'https://haxcktfnuudlqciyljtp.supabase.co';
const OLD_KEY = process.env.OLD_KEY;
const PROD_URL = 'https://whmiinsaxthenpwjtuar.supabase.co';
const PROD_KEY = process.env.PROD_KEY;

const OLD_TESTER = '22c13232-b213-4eda-9f3c-dfa59822a909';
const NEW_TESTER = '6524116a-e18e-43c5-9e8c-1930248db9b4';

async function fetchAll(url, key, table) {
  const rows = [];
  let offset = 0;
  const limit = 200;
  for (;;) {
    const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return rows;
}

async function upsert(url, key, table, rows, batch = 100) {
  for (let i = 0; i < rows.length; i += batch) {
    const slice = rows.slice(i, i + batch);
    const r = await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify(slice),
    });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`upsert ${table} batch=${i} status=${r.status}: ${txt.slice(0, 400)}`);
    }
  }
}

// 신 DB의 유효한 auth user_id 화이트리스트
const VALID_USER_IDS = new Set([
  '6524116a-e18e-43c5-9e8c-1930248db9b4', // tester (user_profiles.id)
  'b434d724-c41c-4fe4-999c-2f186a45f17a', // 나중수
  '22d9f46e-d4da-4f6c-b315-0211a6a96295', // jaiwshim auth
  'be843397-7ae9-49da-bba4-ce145e89610c', // tester auth
  '4e3e88f7-ae97-4f13-8759-07ac7c27c9b6', // njsbr76 auth
]);

function remapUserId(rows) {
  return rows.map(r => {
    if (r.user_id === OLD_TESTER) return { ...r, user_id: NEW_TESTER };
    if (r.user_id && !VALID_USER_IDS.has(r.user_id)) return { ...r, user_id: NEW_TESTER };
    return r;
  });
}

(async () => {
  // 1. user_projects
  console.log('▶ user_projects 마이그레이션');
  const projects = await fetchAll(OLD_URL, OLD_KEY, 'user_projects');
  console.log(`  구 DB: ${projects.length}개`);
  await upsert(PROD_URL, PROD_KEY, 'user_projects', remapUserId(projects));
  console.log('  ✓ 완료');

  // 2. project_files
  console.log('\n▶ project_files 마이그레이션');
  const files = await fetchAll(OLD_URL, OLD_KEY, 'project_files');
  console.log(`  구 DB: ${files.length}개`);
  await upsert(PROD_URL, PROD_KEY, 'project_files', files);
  console.log('  ✓ 완료');

  // 3. generate_results
  // 주의: generate_results.user_id는 auth.users(id) FK 참조 — auth ID 사용
  console.log('\n▶ generate_results 마이그레이션');
  const results = await fetchAll(OLD_URL, OLD_KEY, 'generate_results');
  console.log(`  구 DB: ${results.length}개`);
  const NEW_TESTER_AUTH = 'be843397-7ae9-49da-bba4-ce145e89610c'; // tester auth.users.id
  const validAuth = new Set([NEW_TESTER_AUTH, '4e3e88f7-ae97-4f13-8759-07ac7c27c9b6', '22d9f46e-d4da-4f6c-b315-0211a6a96295']);
  const remapped = results.map(r => {
    if (!r.user_id || !validAuth.has(r.user_id)) return { ...r, user_id: NEW_TESTER_AUTH };
    return r;
  });
  await upsert(PROD_URL, PROD_KEY, 'generate_results', remapped);
  console.log('  ✓ 완료');

  // 검증
  console.log('\n▶ 신 DB 최종 카운트');
  for (const t of ['user_projects', 'project_files', 'generate_results']) {
    const all = await fetchAll(PROD_URL, PROD_KEY, t);
    console.log(`  ${t}: ${all.length}`);
  }
})();
