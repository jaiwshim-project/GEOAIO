-- project_files 테이블 (카테고리별 업로드 파일 메타데이터)
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

-- Supabase Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- 버킷 접근 정책 (service role만)
CREATE POLICY "Service role storage access" ON storage.objects
  FOR ALL USING (bucket_id = 'project-files' AND auth.role() = 'service_role');
