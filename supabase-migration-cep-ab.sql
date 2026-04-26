-- CEP A/B 인용 측정 결과 테이블
-- 사용처: scripts/measure-citation.js가 Perplexity·SearchGPT에 같은 쿼리로 두 콘텐츠를 던져 인용 여부 기록
--
-- 목적:
--   CEP(Category Entry Point) 위저드를 적용한 콘텐츠와 미적용 콘텐츠가
--   동일한 사용자 쿼리에 대해 AI 검색(Perplexity/ChatGPT/Gemini 등)에서
--   인용·발췌되는 정도를 비교 측정한다.

CREATE TABLE IF NOT EXISTS cep_ab_results (
  id uuid default gen_random_uuid() primary key,
  pair_id text not null,                  -- 같은 쿼리 짝을 묶는 ID (UUID 또는 timestamp)
  variant text not null check (variant in ('cep_applied','cep_skipped')),
  content_id text,                        -- history.id 참조 (선택)
  scene_sentence text,                    -- variant=cep_applied일 때만
  cep_keyword text,
  query text not null,                    -- AI 검색에 던진 쿼리
  search_engine text not null check (search_engine in ('perplexity','searchgpt','chatgpt_search','gemini')),
  cited boolean not null default false,   -- 우리 콘텐츠가 인용/언급됐는지
  citation_position integer,              -- 응답에서 몇 번째로 인용됐는지 (1-based, NULL이면 미인용)
  citation_snippet text,                  -- 인용된 텍스트 부분 (있을 때)
  source_url text,                        -- 우리 콘텐츠 URL (인용 매칭에 사용)
  raw_response jsonb,                     -- AI 검색 원본 응답 보관
  notes text,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_cep_ab_pair ON cep_ab_results(pair_id);
CREATE INDEX IF NOT EXISTS idx_cep_ab_variant ON cep_ab_results(variant);
CREATE INDEX IF NOT EXISTS idx_cep_ab_engine ON cep_ab_results(search_engine);
CREATE INDEX IF NOT EXISTS idx_cep_ab_created ON cep_ab_results(created_at DESC);

-- RLS: 서비스 롤만 접근 (사용자 직접 접근 차단)
ALTER TABLE cep_ab_results ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = 일반 anon/authenticated 접근 차단, service_role은 RLS 우회

COMMENT ON TABLE cep_ab_results IS 'CEP 적용/미적용 콘텐츠의 AI 검색 인용률 비교 측정 결과';
COMMENT ON COLUMN cep_ab_results.pair_id IS '같은 쿼리에 던진 두 콘텐츠(applied/skipped)를 묶는 짝 ID';
COMMENT ON COLUMN cep_ab_results.cited IS 'true=AI 검색 응답에 우리 콘텐츠가 인용/발췌됨';
