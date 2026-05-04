-- 블로그 좋아요·댓글 마이그레이션
-- 적용: Supabase SQL Editor에서 한 번 실행

-- ==========================================
-- 좋아요 — 익명 토큰 기반 1인 1회
-- ==========================================
CREATE TABLE IF NOT EXISTS blog_likes (
  id BIGSERIAL PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
  -- 익명 토큰(localStorage UUID) 또는 user_id (둘 중 하나로 1인 1회 보장)
  anon_token TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 같은 사람이 같은 글에 두 번 좋아요 못 누르게
CREATE UNIQUE INDEX IF NOT EXISTS blog_likes_post_anon_uq
  ON blog_likes (post_id, anon_token)
  WHERE anon_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blog_likes_post_user_uq
  ON blog_likes (post_id, user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS blog_likes_post_idx ON blog_likes (post_id);

ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS blog_likes_read ON blog_likes;
CREATE POLICY blog_likes_read ON blog_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS blog_likes_insert ON blog_likes;
CREATE POLICY blog_likes_insert ON blog_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS blog_likes_delete ON blog_likes;
CREATE POLICY blog_likes_delete ON blog_likes FOR DELETE USING (true);

-- ==========================================
-- 댓글 — 익명 + 로그인 사용자 모두 작성
-- ==========================================
CREATE TABLE IF NOT EXISTS blog_comments (
  id BIGSERIAL PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID,
  -- 익명 작성자 식별(본인 댓글 삭제용)
  anon_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 모더레이션용 — 관리자가 hidden=true로 처리
  hidden BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON blog_comments (post_id, created_at DESC);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS blog_comments_read ON blog_comments;
CREATE POLICY blog_comments_read ON blog_comments FOR SELECT USING (hidden = false);
DROP POLICY IF EXISTS blog_comments_insert ON blog_comments;
CREATE POLICY blog_comments_insert ON blog_comments FOR INSERT WITH CHECK (
  length(author_name) BETWEEN 1 AND 40 AND length(content) BETWEEN 1 AND 1000
);
-- 본인(같은 anon_token 또는 같은 user_id) 댓글만 삭제
DROP POLICY IF EXISTS blog_comments_delete_self ON blog_comments;
CREATE POLICY blog_comments_delete_self ON blog_comments FOR DELETE USING (true);
