-- blog_articles 테이블 생성
-- 코드에서 사용하는 컬럼: id, title, content, category, tags(jsonb), author(text/json), created_at, updated_at

CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'geo-aio',
  tags JSONB DEFAULT '[]'::jsonb,
  author TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 허용
CREATE POLICY "blog_articles_read" ON public.blog_articles
  FOR SELECT USING (true);

-- 누구나 쓰기 허용 (인증 없이도 게시 가능하도록)
CREATE POLICY "blog_articles_insert" ON public.blog_articles
  FOR INSERT WITH CHECK (true);

-- 누구나 삭제 허용
CREATE POLICY "blog_articles_delete" ON public.blog_articles
  FOR DELETE USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_blog_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_articles_updated_at();
