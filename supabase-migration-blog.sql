-- ============================================
-- 블로그 포스트 테이블 (blog_posts)
-- ============================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL DEFAULT 'geo-aio',
  tag TEXT,
  hashtags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  target_keyword TEXT,
  history_id TEXT,
  published BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- RLS 정책
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 발행된 포스트를 읽을 수 있음
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (published = true);

-- 로그인한 사용자는 자신의 포스트를 관리할 수 있음
CREATE POLICY "Users can manage their own blog posts"
  ON blog_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 블로그 카테고리 테이블 (사용자 커스텀 카테고리)
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'from-gray-500 to-gray-600',
  icon TEXT DEFAULT 'document',
  sort_order INT DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_categories_slug_user
  ON blog_categories(slug, user_id);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog categories are viewable by everyone"
  ON blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own blog categories"
  ON blog_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 기본 카테고리 삽입 (anon 사용자용 - user_id NULL)
INSERT INTO blog_categories (slug, label, description, color, icon, sort_order) VALUES
  ('geo-aio', 'GEO-AIO', 'AI 검색 최적화 관련 콘텐츠', 'from-indigo-500 to-violet-600', 'search', 0),
  ('regenmed', '리젠메드컨설팅', '컨설팅 관련 콘텐츠', 'from-emerald-500 to-teal-600', 'building', 1),
  ('brewery', '대전맥주장 수제맥주', '수제맥주 관련 콘텐츠', 'from-amber-500 to-orange-600', 'badge', 2),
  ('dental', '치과병원', '치과 관련 콘텐츠', 'from-sky-500 to-blue-600', 'heart', 3)
ON CONFLICT DO NOTHING;
