-- 색인 모니터링 대시보드용 테이블
-- Supabase 콘솔 > SQL Editor 에서 그대로 실행

CREATE TABLE IF NOT EXISTS public.indexing_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       text NOT NULL,
  site_url      text,
  taken_at      timestamptz NOT NULL DEFAULT now(),
  total_pages   integer NOT NULL DEFAULT 0,
  indexed       integer NOT NULL DEFAULT 0,
  not_indexed   integer NOT NULL DEFAULT 0,
  reasons       jsonb NOT NULL DEFAULT '{}'::jsonb,
  by_category   jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw           jsonb,
  is_mock       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indexing_snapshots_site_taken
  ON public.indexing_snapshots (site_id, taken_at DESC);

-- RLS: 서비스 키만 쓰기, 익명도 읽기 허용 (대시보드는 공개)
ALTER TABLE public.indexing_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "indexing_snapshots_read_all" ON public.indexing_snapshots;
CREATE POLICY "indexing_snapshots_read_all"
  ON public.indexing_snapshots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "indexing_snapshots_insert_authenticated" ON public.indexing_snapshots;
CREATE POLICY "indexing_snapshots_insert_authenticated"
  ON public.indexing_snapshots FOR INSERT
  WITH CHECK (true);  -- 서버 사이드 anon 키 사용 환경 (이미 다른 테이블도 동일 패턴)

-- ─────────────────────────────────────────────────────────────────────────────
-- 커스텀 사이트 등록 테이블 (UI에서 동적으로 추가된 사이트)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.indexing_custom_sites (
  id           text PRIMARY KEY,                         -- kebab-case ID (URL slug)
  label        text NOT NULL,                            -- 표시 이름
  domain       text NOT NULL,                            -- 도메인 (표시용)
  description  text NOT NULL DEFAULT '',
  site_url     text NOT NULL,                            -- GSC 속성 URL
  sitemap_url  text NOT NULL,
  category_map jsonb,                                    -- {라벨: ["/prefix", ...]}
  color        text NOT NULL DEFAULT 'cyan',
  emoji        text NOT NULL DEFAULT '🌐',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.indexing_custom_sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "indexing_custom_sites_read_all" ON public.indexing_custom_sites;
CREATE POLICY "indexing_custom_sites_read_all"
  ON public.indexing_custom_sites FOR SELECT USING (true);

DROP POLICY IF EXISTS "indexing_custom_sites_write" ON public.indexing_custom_sites;
CREATE POLICY "indexing_custom_sites_write"
  ON public.indexing_custom_sites FOR ALL WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- AI 인용 모니터링 테이블 (Perplexity 등 AI 검색 엔진 인용 추적)
-- ─────────────────────────────────────────────────────────────────────────────

-- 사이트별 검색 쿼리 목록
CREATE TABLE IF NOT EXISTS public.ai_citation_queries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     text NOT NULL,
  query       text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_citation_queries_site ON public.ai_citation_queries (site_id, active);
ALTER TABLE public.ai_citation_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_citation_queries_all" ON public.ai_citation_queries;
CREATE POLICY "ai_citation_queries_all" ON public.ai_citation_queries FOR ALL WITH CHECK (true);
DROP POLICY IF EXISTS "ai_citation_queries_read" ON public.ai_citation_queries;
CREATE POLICY "ai_citation_queries_read" ON public.ai_citation_queries FOR SELECT USING (true);

-- 스캔 결과 저장
CREATE TABLE IF NOT EXISTS public.ai_citation_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         text NOT NULL,
  query           text NOT NULL,
  source          text NOT NULL DEFAULT 'perplexity',
  taken_at        timestamptz NOT NULL DEFAULT now(),
  cited           boolean NOT NULL,
  cited_url       text,
  answer_excerpt  text,
  all_citations   jsonb,
  is_mock         boolean NOT NULL DEFAULT false,
  raw             jsonb
);
CREATE INDEX IF NOT EXISTS idx_ai_citation_results_site_taken
  ON public.ai_citation_results (site_id, taken_at DESC);
ALTER TABLE public.ai_citation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_citation_results_read" ON public.ai_citation_results;
CREATE POLICY "ai_citation_results_read" ON public.ai_citation_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "ai_citation_results_insert" ON public.ai_citation_results;
CREATE POLICY "ai_citation_results_insert" ON public.ai_citation_results FOR INSERT WITH CHECK (true);
