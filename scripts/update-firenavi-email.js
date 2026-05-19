// contact@firenavi.com → jaiwshim@gmail.com (Supabase user_projects 갱신)
// 실행: node scripts/update-firenavi-email.js
const path = require('path');
const fs = require('fs');

// .env.local 직접 로드 (따옴표 + 리터럴 \n / \r 제거)
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
const supa = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  (env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s/g, ''),
);

const OLD_EMAIL = 'contact@firenavi.com';
const NEW_EMAIL = 'jaiwshim@gmail.com';

(async () => {
  // 1. 매치되는 row 조회
  const { data: rows, error: selErr } = await supa
    .from('user_projects')
    .select('id, name, contact_email')
    .eq('contact_email', OLD_EMAIL);
  if (selErr) { console.error('SELECT error:', selErr); process.exit(1); }
  console.log(`매치 row: ${rows?.length ?? 0}개`);
  (rows || []).forEach(r => console.log(`  - id=${r.id} name="${r.name}" email=${r.contact_email}`));

  if (!rows || rows.length === 0) {
    console.log('업데이트할 row가 없습니다. 종료.');
    process.exit(0);
  }

  // 2. 일괄 업데이트
  const { data: updated, error: updErr } = await supa
    .from('user_projects')
    .update({ contact_email: NEW_EMAIL })
    .eq('contact_email', OLD_EMAIL)
    .select('id, name, contact_email');
  if (updErr) { console.error('UPDATE error:', updErr); process.exit(1); }
  console.log(`\n✅ 업데이트 완료: ${updated?.length ?? 0}개 row`);
  (updated || []).forEach(r => console.log(`  - id=${r.id} name="${r.name}" email=${r.contact_email}`));
})();
