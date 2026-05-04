-- 블로그 카테고리 ↔ 프로젝트 연관 관계 (다대다)
-- 같은 카테고리가 여러 프로젝트에 연결 가능, 같은 프로젝트가 여러 카테고리 보유 가능

CREATE TABLE IF NOT EXISTS blog_category_projects (
  id BIGSERIAL PRIMARY KEY,
  category_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_cp_uq ON blog_category_projects (category_slug, project_name);
CREATE INDEX IF NOT EXISTS blog_cp_project_idx ON blog_category_projects (project_name);
CREATE INDEX IF NOT EXISTS blog_cp_slug_idx ON blog_category_projects (category_slug);

ALTER TABLE blog_category_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bcp_read ON blog_category_projects;
CREATE POLICY bcp_read ON blog_category_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS bcp_insert ON blog_category_projects;
CREATE POLICY bcp_insert ON blog_category_projects FOR INSERT WITH CHECK (
  length(category_slug) BETWEEN 2 AND 80
  AND length(project_name) BETWEEN 1 AND 80
);
DROP POLICY IF EXISTS bcp_delete ON blog_category_projects;
CREATE POLICY bcp_delete ON blog_category_projects FOR DELETE USING (true);

-- ==========================================
-- 백필: 기존 blog_articles의 카테고리 자동 분류
-- ==========================================
-- 규칙 1: 카테고리 슬러그/라벨에 "후보자" 포함 → AI선거솔루션-2026 지방선거 연결
INSERT INTO blog_category_projects (category_slug, project_name)
SELECT DISTINCT category, 'AI선거솔루션-2026 지방선거'
FROM blog_articles
WHERE category IS NOT NULL
  AND category LIKE '%후보자%'
ON CONFLICT (category_slug, project_name) DO NOTHING;

-- 규칙 2: 추가 키워드 패턴 (선거 관련)
INSERT INTO blog_category_projects (category_slug, project_name)
SELECT DISTINCT category, 'AI선거솔루션-2026 지방선거'
FROM blog_articles
WHERE category IS NOT NULL
  AND (category LIKE '%선거%' OR category LIKE '%시장-%' OR category LIKE '%교육감%')
ON CONFLICT (category_slug, project_name) DO NOTHING;

-- 결과 확인 쿼리 (실행 후 SELECT * FROM blog_category_projects ORDER BY project_name, category_slug;)
