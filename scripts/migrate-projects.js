// 구 DB → 운영 DB: 선명회계법인, 로엘 법무법인 프로젝트 + 파일 마이그레이션
const OLD_URL = 'https://haxcktfnuudlqciyljtp.supabase.co';
const OLD_KEY = process.env.OLD_KEY;
const PROD_URL = 'https://whmiinsaxthenpwjtuar.supabase.co';
const PROD_KEY = process.env.PROD_KEY;

const PROD_TESTER_ID = '6524116a-e18e-43c5-9e8c-1930248db9b4';
const PROJECT_IDS = [
  '31809c3f-62f3-4814-abbf-4bc76d3efbb1', // 선명회계법인(SMCPA)
  '3a6dd28a-9cde-4055-b951-2d349b581f68', // 로엘 법무법인
];

async function fetchOld(table, query) {
  const res = await fetch(`${OLD_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` },
  });
  if (!res.ok) throw new Error(`fetchOld ${table} ${res.status}`);
  return res.json();
}

async function upsertProd(table, rows) {
  const res = await fetch(`${PROD_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: PROD_KEY,
      Authorization: `Bearer ${PROD_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`upsert ${table} ${res.status} ${txt.slice(0, 400)}`);
  }
}

(async () => {
  for (const pid of PROJECT_IDS) {
    const projects = await fetchOld('user_projects', `select=*&id=eq.${pid}`);
    if (projects.length === 0) {
      console.log(`[SKIP] ${pid}: 구 DB에 없음`);
      continue;
    }
    const project = projects[0];
    // user_id를 운영 tester ID로 변경
    const projectRow = { ...project, user_id: PROD_TESTER_ID };
    await upsertProd('user_projects', [projectRow]);
    console.log(`[OK] 프로젝트 ${project.name} 추가 (id=${pid})`);

    // 파일도 마이그레이션
    const files = await fetchOld('project_files', `select=*&project_id=eq.${pid}`);
    if (files.length > 0) {
      await upsertProd('project_files', files);
      console.log(`     파일 ${files.length}개 추가: ${files.map(f => f.file_name).join(', ')}`);
    }
  }
  console.log('\n완료');
})();
