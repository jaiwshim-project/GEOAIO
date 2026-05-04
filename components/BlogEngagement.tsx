'use client';

import { useEffect, useState, useCallback } from 'react';

interface Comment {
  id: number;
  author_name: string;
  content: string;
  anon_token: string | null;
  user_id: string | null;
  created_at: string;
}

interface Props {
  postId: string;
  defaultAuthorName?: string; // 로그인 사용자 이름 자동 채움용
}

// 익명 토큰 — 브라우저별 1회 생성, localStorage에 영구 저장
function getOrCreateAnonToken(): string {
  if (typeof window === 'undefined') return '';
  const KEY = 'geoaio_anon_token';
  let t = localStorage.getItem(KEY);
  if (!t) {
    t = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, t);
  }
  return t;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return '방금 전';
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}일 전`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BlogEngagement({ postId, defaultAuthorName = '' }: Props) {
  const [anonToken, setAnonToken] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [likeAnimating, setLikeAnimating] = useState(false);

  useEffect(() => {
    setAnonToken(getOrCreateAnonToken());
  }, []);

  // 마운트 + postId 변경 시 데이터 로드
  const loadData = useCallback(async () => {
    if (!postId) return;
    try {
      const t = getOrCreateAnonToken();
      const res = await fetch(`/api/blog/engagement?postId=${encodeURIComponent(postId)}&anonToken=${encodeURIComponent(t)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      setLikeCount(data.likeCount || 0);
      setLikedByMe(!!data.likedByMe);
      setComments(data.comments || []);
    } catch {}
  }, [postId]);

  useEffect(() => { loadData(); }, [loadData]);

  // 저장된 작성자 이름 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (defaultAuthorName) { setAuthorName(defaultAuthorName); return; }
    const saved = localStorage.getItem('geoaio_comment_author');
    if (saved) setAuthorName(saved);
  }, [defaultAuthorName]);

  const handleLike = async () => {
    if (!anonToken || likeAnimating) return;
    setLikeAnimating(true);
    // 낙관적 업데이트
    const next = !likedByMe;
    setLikedByMe(next);
    setLikeCount(c => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await fetch('/api/blog/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like-toggle', postId, anonToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLikeCount(data.likeCount);
      setLikedByMe(data.likedByMe);
    } catch {
      // 롤백
      setLikedByMe(!next);
      setLikeCount(c => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setTimeout(() => setLikeAnimating(false), 250);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = authorName.trim();
    const text = content.trim();
    if (!name) { setError('이름을 입력하세요'); return; }
    if (!text) { setError('댓글 내용을 입력하세요'); return; }
    if (text.length > 1000) { setError('1000자 이내로 입력하세요'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/blog/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment-create', postId, anonToken, authorName: name, content: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '댓글 등록 실패'); return; }
      setComments(prev => [data.comment, ...prev]);
      setContent('');
      // 다음번 자동 채움용
      try { localStorage.setItem('geoaio_comment_author', name); } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch('/api/blog/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment-delete', postId, anonToken, commentId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '삭제 실패');
        return;
      }
      setComments(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('삭제 실패');
    }
  };

  return (
    <div className="space-y-3">
      {/* 좋아요 + 댓글 토글 버튼 (공유 버튼 줄과 함께 어울리는 디자인) */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleLike}
          aria-label={likedByMe ? '좋아요 취소' : '좋아요'}
          aria-pressed={likedByMe}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-full transition-all shadow-sm border ${
            likedByMe
              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
          } ${likeAnimating ? 'scale-105' : ''}`}
        >
          <svg
            className={`w-4 h-4 transition-all ${likedByMe ? 'text-rose-500' : 'text-slate-400'}`}
            fill={likedByMe ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
          </svg>
          좋아요
          <span className={`ml-0.5 ${likedByMe ? 'text-rose-700 font-extrabold' : 'text-slate-700 font-bold'}`}>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(s => !s)}
          aria-label="댓글 영역 토글"
          aria-expanded={showComments}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-full transition-all shadow-sm border bg-white text-slate-700 border-slate-300 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          댓글
          <span className="ml-0.5 text-slate-700 font-bold">{comments.length}</span>
          <svg className={`w-3 h-3 ml-1 transition-transform ${showComments ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 댓글 영역 */}
      {showComments && (
        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          {/* 작성 폼 */}
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="이름"
                maxLength={40}
                className="w-32 sm:w-40 text-sm py-2 px-3 rounded-lg border border-slate-300 bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-300 outline-none"
              />
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="댓글을 남겨주세요..."
                maxLength={1000}
                className="flex-1 text-sm py-2 px-3 rounded-lg border border-slate-300 bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-300 outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all shadow-sm"
              >
                {submitting ? '등록…' : '등록'}
              </button>
            </div>
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <p className="text-[10px] text-slate-500">
              · 등록한 댓글은 이 브라우저에서만 삭제 가능합니다 · 60초당 1개 작성 가능
            </p>
          </form>

          {/* 목록 */}
          <ul className="space-y-2">
            {comments.length === 0 && (
              <li className="text-center text-sm text-slate-500 py-6">아직 댓글이 없습니다. 첫 댓글을 남겨주세요.</li>
            )}
            {comments.map(c => {
              const isMine = c.anon_token === anonToken;
              return (
                <li key={c.id} className="bg-white rounded-lg border border-slate-200 p-3">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">{c.author_name}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(c.created_at)}</span>
                    </div>
                    {isMine && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold shrink-0"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">{c.content}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
