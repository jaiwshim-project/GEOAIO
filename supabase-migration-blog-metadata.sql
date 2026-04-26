-- blog_articles에 metadata jsonb 컬럼 1급 시민화
-- 기존 author 필드의 JSON 중첩 데이터는 후속 백필 마이그레이션으로 처리

ALTER TABLE blog_articles
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- CEP 적용 글 빠르게 찾기 위한 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_blog_articles_cep_applied
  ON blog_articles ((metadata->'cep' IS NOT NULL))
  WHERE metadata->'cep' IS NOT NULL;

-- 일반 메타 조회용 GIN 인덱스 (선택)
CREATE INDEX IF NOT EXISTS idx_blog_articles_metadata_gin
  ON blog_articles USING gin (metadata);

-- 데이터 백필: 기존 author 필드의 JSON에서 metadata 추출
-- author가 '{"name":"...","metadata":{...}}' 형태인 경우만 대상
UPDATE blog_articles
SET metadata = COALESCE((author::jsonb -> 'metadata'), '{}'::jsonb)
WHERE metadata = '{}'::jsonb
  AND author IS NOT NULL
  AND author ~ '^\s*\{'
  AND (author::jsonb ? 'metadata');

COMMENT ON COLUMN blog_articles.metadata IS '블로그 글 메타데이터 (CEP·SEO·생성 옵션 등). metadata->cep 형태로 sceneSentence/cepKeyword/searchPath 보유';
