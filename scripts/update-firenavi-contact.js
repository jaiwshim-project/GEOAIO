// 화이어내비 user_projects row에 실제 이메일·전화 등록
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

const ROW_ID = '05f27b06-d367-4cbc-b3b6-22cb608ab44a'; // 화이어내비
const NEW_EMAIL = 'jaiwshim@gmail.com';
const NEW_PHONE = '010-2397-5734';

(async () => {
  const { data: before } = await supa.from('user_projects').select('id, name, contact_email, contact_phone').eq('id', ROW_ID).single();
  console.log('변경 전:', before);

  const { data, error } = await supa
    .from('user_projects')
    .update({ contact_email: NEW_EMAIL, contact_phone: NEW_PHONE })
    .eq('id', ROW_ID)
    .select('id, name, contact_email, contact_phone')
    .single();
  if (error) { console.error('UPDATE 오류:', error); process.exit(1); }
  console.log('변경 후:', data);
  console.log('\n✅ 완료. 백링크 페이지에서 화이어내비 카테고리 로드맵을 🔄 재생성하면 새 값이 본문·푸터에 반영됩니다.');
})();
