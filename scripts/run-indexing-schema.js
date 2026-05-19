const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 파싱
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    env[key] = value.trim().replace(/^"/, '').replace(/"$/, '').trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 환경변수 확인:');
console.log('  URL:', url ? `✓ ${url.substring(0, 30)}...` : '❌ 없음');
console.log('  KEY:', key ? `✓ ${key.substring(0, 30)}...` : '❌ 없음\n');

if (!url || !key) {
  console.error('❌ 환경변수 누락');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const sql = `
CREATE TABLE IF NOT EXISTS public.indexing_inspected_pages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id   uuid NOT NULL REFERENCES public.indexing_snapshots(id) ON DELETE CASCADE,
  site_id       text NOT NULL,
  url           text NOT NULL,
  state         text NOT NULL,
  last_crawl    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indexing_inspected_pages_snapshot
  ON public.indexing_inspected_pages (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_indexing_inspected_pages_site_url
  ON public.indexing_inspected_pages (site_id, url);

ALTER TABLE public.indexing_inspected_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "indexing_inspected_pages_read_all" ON public.indexing_inspected_pages;
CREATE POLICY "indexing_inspected_pages_read_all"
  ON public.indexing_inspected_pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "indexing_inspected_pages_insert" ON public.indexing_inspected_pages;
CREATE POLICY "indexing_inspected_pages_insert"
  ON public.indexing_inspected_pages FOR INSERT WITH CHECK (true);
`;

(async () => {
  console.log('🚀 Supabase SQL 실행 중...\n');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error?.code === 'PGRST204' || error?.code === '42883') {
      console.log('⚠️  직접 SQL 실행 함수 없음. 대신 마이그레이션 파일을 참고하세요.\n');
      console.log('📌 수동 실행 방법:');
      console.log('1. Supabase 콘솔 로그인: https://app.supabase.com');
      console.log('2. 프로젝트 선택: whmiinsaxthenpwjtuar');
      console.log('3. SQL Editor → New Query');
      console.log('4. docs/indexing-dashboard-supabase-schema.sql 의 새 테이블 섹션 복사');
      console.log('5. SQL Editor에 붙여넣고 실행\n');
      process.exit(0);
    }
    
    if (error) {
      console.error('❌ SQL 실행 실패:', error.message);
      console.log('\n📌 대신 수동 실행:');
      console.log('1. Supabase 콘솔: https://app.supabase.com');
      console.log('2. SQL Editor → New Query');
      console.log('3. docs/indexing-dashboard-supabase-schema.sql 복사-붙여넣기 실행\n');
      process.exit(1);
    }
    
    console.log('✅ SQL 실행 완료!\n');
    console.log('생성된 테이블:');
    console.log('  ✓ indexing_inspected_pages (개별 페이지 색인 상태)');
    console.log('  ✓ 인덱스 2개, RLS 정책 2개 추가\n');
    console.log('다음 단계: Vercel에 배포');
    
  } catch (e) {
    console.error('❌ 오류:', e.message);
    console.log('\n📌 수동 실행:');
    console.log('1. Supabase 콘솔: https://app.supabase.com');
    console.log('2. SQL Editor → New Query');
    console.log('3. docs/indexing-dashboard-supabase-schema.sql 복사-붙여넣기\n');
    process.exit(1);
  }
})();
