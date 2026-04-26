-- CEP 자동 측정 대기 큐
-- Kilo 분대가 블로그 발행 시 INSERT, Lima 분대(이 파일의 cron)가 SELECT/UPDATE
CREATE TABLE IF NOT EXISTS cep_ab_targets (
  id uuid default gen_random_uuid() primary key,
  pair_id text not null unique,
  query text not null,
  applied_url text not null,
  applied_text_match text,
  skipped_url text,
  skipped_text_match text,
  engines text[] default array['perplexity','chatgpt_search'],
  blog_article_id text,
  active boolean default true,
  last_measured_at timestamptz,
  measure_count integer default 0,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_cep_ab_targets_due
  ON cep_ab_targets(active, last_measured_at)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_cep_ab_targets_blog
  ON cep_ab_targets(blog_article_id);

ALTER TABLE cep_ab_targets ENABLE ROW LEVEL SECURITY;
-- RLS 정책 없음 = service_role만 접근

COMMENT ON TABLE cep_ab_targets IS 'CEP 자동 측정 대기 큐. cron이 일주일에 한 번씩 measure → cep_ab_results에 결과 INSERT';
COMMENT ON COLUMN cep_ab_targets.last_measured_at IS '마지막 측정 시각. NULL 또는 7일 전이면 측정 대상';
COMMENT ON COLUMN cep_ab_targets.measure_count IS '누적 측정 횟수 (시계열 데이터 추적용)';
