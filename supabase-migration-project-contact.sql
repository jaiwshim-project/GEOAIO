-- user_projects 테이블에 프로젝트별 연락 정보 컬럼 추가
-- 콘텐츠 생성 시 회사 대표 연락처(이메일/전화) 자동 포함용

ALTER TABLE user_projects
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;
