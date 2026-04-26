-- 파생 콘텐츠 추적용 master_id 컬럼 추가
-- 마스터 글에서 분해한 파생 콘텐츠는 master_id로 원본을 가리킴

ALTER TABLE blog_articles
  ADD COLUMN IF NOT EXISTS master_id text;

CREATE INDEX IF NOT EXISTS idx_blog_articles_master_id
  ON blog_articles(master_id)
  WHERE master_id IS NOT NULL;

-- history 테이블에도 동일 (jsonb generate_result 안에 metadata.master_id로 저장)
-- 별도 컬럼은 불필요 (이미 metadata 안에 저장 가능)

COMMENT ON COLUMN blog_articles.master_id IS '파생 콘텐츠의 마스터 글 ID. NULL이면 독립 글, 값 있으면 그 ID의 마스터에서 파생됨';
