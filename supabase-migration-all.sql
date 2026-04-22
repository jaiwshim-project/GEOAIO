-- =============================================
-- 전체 통합 마이그레이션 SQL
-- 새 Supabase 프로젝트용
-- =============================================

-- =============================================
-- 1. 기본 테이블
-- =============================================

-- 비즈니스 프로필 테이블
CREATE TABLE IF NOT EXISTS business_profiles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  data jsonb not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 이력 테이블
CREATE TABLE IF NOT EXISTS history (
  id text primary key,
  type text not null check (type in ('analysis', 'generation')),
  title text not null,
  summary text,
  date text not null,
  category text,
  target_keyword text,
  analysis_result jsonb,
  original_content text,
  generate_result jsonb,
  topic text,
  tone text,
  revisions jsonb default '[]',
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- API 키 테이블
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid default gen_random_uuid() primary key,
  key_type text not null,
  encrypted_key text not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now(),
  UNIQUE (key_type, user_id)
);

-- 생성된 이미지 테이블
CREATE TABLE IF NOT EXISTS generated_images (
  id uuid default gen_random_uuid() primary key,
  history_id text references history(id) on delete cascade,
  image_url text not null,
  prompt text,
  created_at timestamptz default now()
);

-- 생성 결과 테이블
CREATE TABLE IF NOT EXISTS generate_results (
  id text primary key,
  data jsonb not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- =============================================
-- 2. RLS 활성화 + 사용자별 격리 정책
-- =============================================

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE generate_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own data" ON business_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own data" ON history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own data" ON api_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own images" ON generated_images
  FOR ALL USING (
    history_id IN (SELECT id FROM history WHERE user_id = auth.uid())
  ) WITH CHECK (
    history_id IN (SELECT id FROM history WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own data" ON generate_results
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. user_profiles / user_projects 테이블
-- =============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  company_name TEXT,
  service_name TEXT,
  phone TEXT,
  email TEXT,
  pin TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only for user_profiles" ON user_profiles
  USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS user_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only for user_projects" ON user_projects
  USING (false) WITH CHECK (false);

-- =============================================
-- 4. 블로그 테이블
-- =============================================

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

CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Users can manage their own blog posts"
  ON blog_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

INSERT INTO blog_categories (slug, label, description, color, icon, sort_order) VALUES
  ('geo-aio', 'GEO-AIO', 'AI 검색 최적화 관련 콘텐츠', 'from-indigo-500 to-violet-600', 'search', 0),
  ('regenmed', '리젠메드컨설팅', '컨설팅 관련 콘텐츠', 'from-emerald-500 to-teal-600', 'building', 1),
  ('brewery', '대전맥주장 수제맥주', '수제맥주 관련 콘텐츠', 'from-amber-500 to-orange-600', 'badge', 2),
  ('dental', '치과병원', '치과 관련 콘텐츠', 'from-sky-500 to-blue-600', 'heart', 3)
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. 커뮤니티 테이블 (질문/후기)
-- =============================================

CREATE TABLE IF NOT EXISTS questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  user_name text not null,
  title text not null,
  content text not null,
  answer text,
  answered_at timestamptz,
  created_at timestamptz default now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  user_name text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  content text not null,
  created_at timestamptz default now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 6. 요금제 시스템
-- =============================================

CREATE TABLE IF NOT EXISTS user_plans (
  user_id uuid references auth.users(id) primary key,
  plan text not null default 'free' check (plan in ('admin', 'free', 'pro', 'max')),
  created_at timestamptz default now(),
  expires_at timestamptz
);
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plan" ON user_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS usage_counts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  feature text not null check (feature in ('analyze', 'generate', 'keyword', 'series')),
  month text not null,
  count int not null default 0,
  UNIQUE (user_id, feature, month)
);
ALTER TABLE usage_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own usage" ON usage_counts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. generate_results 프로젝트 연결
-- =============================================

ALTER TABLE generate_results
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selected_ab_index INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_generate_results_project_id ON generate_results(project_id);

-- =============================================
-- 8. project_files 테이블
-- =============================================

CREATE TABLE IF NOT EXISTS project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only for project_files" ON project_files
  USING (false) WITH CHECK (false);

-- Storage 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;
