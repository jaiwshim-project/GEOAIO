// Supabase에 tistory_publish_queue 테이블 생성
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')
);

const SQL = `
CREATE TABLE IF NOT EXISTS public.tistory_publish_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_name TEXT NOT NULL DEFAULT 'axbiz',
  category_slug TEXT NOT NULL,
  post_no INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  tistory_category TEXT DEFAULT '1. AX 비즈',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','publishing','published','failed')),
  post_url TEXT,
  error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT uq_tistory_queue UNIQUE (blog_name, category_slug, post_no)
);

-- 인덱스: 오늘 발행 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_tistory_queue_status_date
  ON public.tistory_publish_queue (status, scheduled_date);

-- RLS 비활성화 (service role key로만 접근)
ALTER TABLE public.tistory_publish_queue DISABLE ROW LEVEL SECURITY;
`;

(async () => {
  console.log('▶ tistory_publish_queue 테이블 생성 중...');
  const { error } = await supabase.rpc('exec_sql', { sql: SQL }).catch(() => ({ error: { message: 'rpc not available' } }));

  if (error) {
    // rpc 방식 실패 → 직접 REST API로 시도
    console.log('  rpc 불가, 테이블 존재 여부 확인...');
    const { data, error: selectError } = await supabase
      .from('tistory_publish_queue')
      .select('id')
      .limit(1);

    if (selectError && selectError.code === '42P01') {
      console.log('  ❌ 테이블 없음. Supabase 대시보드에서 직접 SQL을 실행하세요:');
      console.log('\n---');
      console.log(SQL);
      console.log('---\n');
      console.log('  URL: https://supabase.com/dashboard → SQL Editor → 위 SQL 붙여넣기 후 실행');
    } else if (!selectError) {
      console.log('  ✅ 테이블 이미 존재합니다!');
    } else {
      console.log('  오류:', selectError.message);
      console.log('\n  Supabase 대시보드 SQL Editor에서 다음 SQL을 실행하세요:');
      console.log('\n---');
      console.log(SQL);
      console.log('---\n');
    }
    return;
  }
  console.log('✅ 테이블 생성 완료!');
})();
