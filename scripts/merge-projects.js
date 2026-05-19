// 프로젝트 머지: 사용자 이메일 기준으로 프로젝트 목록을 가져와 일련번호 쌍을 합친다.
// 실행: DRY=1 node scripts/merge-projects.js  (드라이런)
//        node scripts/merge-projects.js          (실제 실행)
//
// 정책:
//  - 낮은 번호(오래된 쪽)를 본체로 유지
//  - 본체에 비어있는 메타 필드만 새 쪽에서 흡수
//  - 새 쪽의 모든 project_files를 본체로 이동 (FK 변경)
//  - 새 쪽 user_projects 행 삭제

const fs = require('fs');
const path = require('path');

// .env.local 로드
const envPath = path.join(__dirname, '..', '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, '');

const USER_EMAIL = 'jaiwshim_tester@gmail.com';
const PAIRS = [
  [17, 18],  // [본체 seq, 흡수+삭제 seq]
  [4, 19],
];
const DRY = process.env.DRY === '1';

function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function rest(method, path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers(), Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function findUserId(email) {
  const rows = await rest('GET', `user_profiles?email=eq.${encodeURIComponent(email)}&select=id,username,email`);
  if (!rows.length) throw new Error(`user_profiles에 ${email} 없음`);
  if (rows.length > 1) {
    console.log('주의: 같은 이메일이 여러 개:', rows);
    throw new Error('동일 이메일 다중. 수동 확인 필요');
  }
  return rows[0];
}

async function listProjects(userId) {
  // dashboard와 동일하게 created_at desc 정렬
  return rest('GET', `user_projects?user_id=eq.${userId}&select=*&order=created_at.desc`);
}

function seqFor(projects, idx) {
  // dashboard와 동일: seq = projects.length - idx (1-based, 가장 오래된 것이 01)
  return projects.length - idx;
}

function pickProjectBySeq(projects, targetSeq) {
  for (let i = 0; i < projects.length; i++) {
    if (seqFor(projects, i) === targetSeq) return projects[i];
  }
  return null;
}

function mergedMeta(canonical, donor) {
  // 본체에 비어있는 필드만 도너에서 흡수
  const fields = ['description', 'company_name', 'representative_name', 'region', 'homepage_url', 'blog_url', 'contact_email', 'contact_phone'];
  const patch = {};
  for (const f of fields) {
    const cVal = (canonical[f] ?? '').toString().trim();
    const dVal = (donor[f] ?? '').toString().trim();
    if (!cVal && dVal) patch[f] = dVal;
  }
  return patch;
}

async function moveFiles(fromId, toId) {
  // project_files.project_id 변경
  return rest('PATCH', `project_files?project_id=eq.${fromId}`, { project_id: toId });
}

async function patchProject(id, patch) {
  return rest('PATCH', `user_projects?id=eq.${id}`, patch);
}

async function deleteProject(id) {
  await fetch(`${SB_URL}/rest/v1/user_projects?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
}

async function main() {
  console.log(`=== merge-projects ${DRY ? '(DRY RUN)' : '(REAL)'} ===`);
  console.log(`Supabase: ${SB_URL}`);
  console.log(`Email   : ${USER_EMAIL}`);
  if (!SB_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY 없음');

  const user = await findUserId(USER_EMAIL);
  console.log(`User    : ${user.username} (${user.id})`);

  const projects = await listProjects(user.id);
  console.log(`Projects: ${projects.length}개\n`);
  console.log('== 일련번호 매핑 ==');
  projects.forEach((p, i) => {
    const seq = String(seqFor(projects, i)).padStart(2, '0');
    console.log(`  ${seq}. ${p.name}  (id=${p.id}, files보유는 별도조회)`);
  });
  console.log('');

  for (const [keepSeq, dropSeq] of PAIRS) {
    console.log(`\n--- pair [${String(keepSeq).padStart(2, '0')} ⊕ ${String(dropSeq).padStart(2, '0')}] ---`);
    const keep = pickProjectBySeq(projects, keepSeq);
    const drop = pickProjectBySeq(projects, dropSeq);
    if (!keep || !drop) {
      console.log(`  ❌ seq ${keepSeq} 또는 ${dropSeq} 없음. 건너뜀.`);
      continue;
    }
    console.log(`  KEEP  ${String(keepSeq).padStart(2, '0')}: ${keep.name}  (${keep.id})`);
    console.log(`  DROP  ${String(dropSeq).padStart(2, '0')}: ${drop.name}  (${drop.id})`);

    // 도너의 파일 개수 조회
    const donorFiles = await rest('GET', `project_files?project_id=eq.${drop.id}&select=id,file_name`);
    console.log(`  도너 파일: ${donorFiles.length}개${donorFiles.length ? ' → ' + donorFiles.map(f => f.file_name).join(', ') : ''}`);

    const patch = mergedMeta(keep, drop);
    if (Object.keys(patch).length) {
      console.log(`  본체 메타 흡수:`, patch);
    } else {
      console.log(`  본체 메타 흡수: (없음, 본체가 모든 필드 보유)`);
    }

    if (DRY) {
      console.log(`  [DRY] 위 작업을 실제로 수행하려면 DRY=1 빼고 다시 실행`);
      continue;
    }

    // 1. 메타 흡수
    if (Object.keys(patch).length) {
      await patchProject(keep.id, patch);
      console.log(`  ✓ 본체에 메타 흡수 완료`);
    }
    // 2. 파일 FK 이동
    if (donorFiles.length) {
      await moveFiles(drop.id, keep.id);
      console.log(`  ✓ 파일 ${donorFiles.length}개 본체로 이동`);
    }
    // 3. 도너 삭제
    await deleteProject(drop.id);
    console.log(`  ✓ 도너 ${String(dropSeq).padStart(2, '0')} 삭제 완료`);
  }

  console.log('\n=== 완료 ===');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
