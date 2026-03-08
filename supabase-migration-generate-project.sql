-- generate_results 테이블에 project_id, ab 관련 컬럼 추가
ALTER TABLE generate_results
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selected_ab_index INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_generate_results_project_id ON generate_results(project_id);
