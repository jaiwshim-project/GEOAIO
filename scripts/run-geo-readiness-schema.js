// docs/geo-readiness-supabase-schema.sql 을 Supabase에 적용
// exec_sql RPC가 있으면 자동 실행, 없으면 수동 실행 안내 후 테이블 존재 여부만 확인.
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const m = line.match(/^([^=#]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^"/, '').replace(/"$/, '').trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
if (!url || !key) { console.error('❌ 환경변수 누락'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });
const sql = fs.readFileSync(path.join(__dirname, '..', 'docs', 'geo-readiness-supabase-schema.sql'), 'utf8');

(async () => {
  console.log('🔍 프로젝트:', url.replace(/https:\/\/([^.]+).*/, '$1'));

  // 1) 이미 존재하는지 확인
  const { error: probe } = await supabase.from('geo_readiness_snapshots').select('id').limit(1);
  if (!probe) {
    console.log('✅ geo_readiness_snapshots 테이블이 이미 존재합니다. 적용 불필요.');
    process.exit(0);
  }
  console.log('ℹ️  현재 상태:', probe.message);

  // 2) exec_sql RPC 시도 (인자명 두 가지 모두)
  for (const argName of ['sql_query', 'sql', 'query']) {
    const { error } = await supabase.rpc('exec_sql', { [argName]: sql });
    if (!error) {
      console.log(`✅ exec_sql(${argName}) 로 스키마 적용 완료`);
      const { error: verify } = await supabase.from('geo_readiness_snapshots').select('id').limit(1);
      console.log(verify ? `⚠️ 검증 실패: ${verify.message}` : '✅ 테이블 검증 완료');
      process.exit(verify ? 1 : 0);
    }
  }

  console.log('\n⚠️  exec_sql RPC를 사용할 수 없습니다. 아래 순서로 1분 안에 수동 적용하세요.\n');
  console.log('1. https://app.supabase.com → 프로젝트 whmiinsaxthenpwjtuar');
  console.log('2. SQL Editor → New Query');
  console.log('3. docs/geo-readiness-supabase-schema.sql 전체 복사 → 붙여넣기 → Run');
  console.log('4. 완료 후 `node scripts/run-geo-readiness-schema.js` 재실행하면 ✅ 로 확인됩니다.\n');
  console.log('※ 테이블이 없어도 진단 기능은 정상 동작합니다. 저장/추이 기능만 비활성입니다.');
  process.exit(2);
})();
