-- user_profiles 테이블
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

-- user_projects 테이블 (사용자별 작업 항목)
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
