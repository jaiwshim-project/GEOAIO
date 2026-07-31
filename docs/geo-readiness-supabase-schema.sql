-- GEO Readiness(인용 준비도) 대시보드용 테이블
-- Supabase 콘솔 > SQL Editor 에서 그대로 실행
-- 기존 indexing_snapshots / ai_citation_results 와 동일한 RLS 패턴을 따른다.

-- ─────────────────────────────────────────────────────────────────────────────
-- 스냅샷: 사이트 단위 1회 측정 결과 (평균 점수 + 항목별 평균)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.geo_readiness_snapshots (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             text NOT NULL,
  taken_at            timestamptz NOT NULL DEFAULT now(),
  pages_scanned       integer NOT NULL DEFAULT 0,
  avg_score           integer NOT NULL DEFAULT 0,   -- 0~100 GEO Readiness Score
  avg_content_score   integer NOT NULL DEFAULT 0,   -- 콘텐츠 10개 항목 소계
  avg_technical_score integer NOT NULL DEFAULT 0,   -- 기술 5개 항목 소계
  verdict_counts      jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {ready:2, candidate:5, needs_work:3, unlikely:0}
  check_averages      jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{id,label,group,weight,avgScore,fix}]
  source              text,                          -- 'single' | 'sitemap:<url>' | 'explicit'
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_readiness_snapshots_site_taken
  ON public.geo_readiness_snapshots (site_id, taken_at DESC);

ALTER TABLE public.geo_readiness_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "geo_readiness_snapshots_read" ON public.geo_readiness_snapshots;
CREATE POLICY "geo_readiness_snapshots_read"
  ON public.geo_readiness_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "geo_readiness_snapshots_insert" ON public.geo_readiness_snapshots;
CREATE POLICY "geo_readiness_snapshots_insert"
  ON public.geo_readiness_snapshots FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 페이지별 결과: 스냅샷 1건에 N개 페이지
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.geo_readiness_pages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id     uuid NOT NULL REFERENCES public.geo_readiness_snapshots(id) ON DELETE CASCADE,
  site_id         text NOT NULL,
  url             text NOT NULL,
  score           integer NOT NULL DEFAULT 0,
  verdict         text NOT NULL,   -- ready | candidate | needs_work | unlikely
  content_score   integer NOT NULL DEFAULT 0,
  technical_score integer NOT NULL DEFAULT 0,
  checks          jsonb NOT NULL DEFAULT '[]'::jsonb,  -- 15개 항목 상세 (score/signals/gaps/fix)
  strengths       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- Top 3 인용될 이유
  weaknesses      jsonb NOT NULL DEFAULT '[]'::jsonb,  -- Top 3 인용 어려운 이유
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,  -- title/description/canonical/headings/jsonLdTypes 등
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_readiness_pages_snapshot
  ON public.geo_readiness_pages (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_geo_readiness_pages_site_url
  ON public.geo_readiness_pages (site_id, url);

ALTER TABLE public.geo_readiness_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "geo_readiness_pages_read" ON public.geo_readiness_pages;
CREATE POLICY "geo_readiness_pages_read"
  ON public.geo_readiness_pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "geo_readiness_pages_insert" ON public.geo_readiness_pages;
CREATE POLICY "geo_readiness_pages_insert"
  ON public.geo_readiness_pages FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.geo_readiness_snapshots IS 'GEO 인용 준비도 측정 스냅샷 (사이트 단위 평균)';
COMMENT ON TABLE public.geo_readiness_pages IS 'GEO 인용 준비도 페이지별 상세 결과 (15개 항목 스코어카드)';
COMMENT ON COLUMN public.geo_readiness_pages.verdict IS 'ready=인용 준비됨 / candidate=인용 후보 / needs_work=보강 필요 / unlikely=인용 어려움';
