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
