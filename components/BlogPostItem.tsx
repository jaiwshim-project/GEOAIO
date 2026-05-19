'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { BlogPost } from '@/lib/supabase-storage';

interface BlogPostItemProps {
  post: BlogPost;
  meta: { label: string; color: string };
  TAG_COLORS: Record<string, string>;
  formatDate: (dateStr: string) => string;
  onDelete?: (postId: string) => void;
}

export default function BlogPostItem({
  post,
  meta,
  TAG_COLORS,
  formatDate,
  onDelete,
}: BlogPostItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`"${post.title}"을(를) 삭제하시겠습니까?`)) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/blog/${post.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('삭제 실패');

      if (onDelete) {
        onDelete(post.id);
      } else {
        // onDelete 콜백이 없으면 페이지 새로고침
        window.location.reload();
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      setDeleting(false);
    }
  };

  return (
    <article className="group relative bg-white rounded-lg border border-slate-200 hover:border-amber-300 active:border-amber-400 transition-colors duration-200 overflow-hidden hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.18)] hover:bg-amber-50/30 active:bg-amber-50/50">
      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200" />

      {/* 삭제 버튼 */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute right-2 top-2 z-10 p-1.5 rounded-md bg-red-100 text-red-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="글 삭제"
        aria-label="글 삭제"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <Link href={`/blog/${post.id}`} className="flex items-center gap-3 px-3 py-3 sm:py-2.5 min-h-[64px] sm:min-h-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {post.tag && (
              <span className={`px-1.5 py-0.5 text-[10px] sm:text-[9px] tracking-wider uppercase rounded-full ${TAG_COLORS[post.tag] || 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                {post.tag}
              </span>
            )}
            <span className="text-[11px] sm:text-[10px] tracking-wide text-slate-700 font-medium">
              {formatDate(post.createdAt)}
            </span>
            {post.targetKeyword && (
              <span className="text-[9px] tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0 rounded-full hidden sm:inline">
                {post.targetKeyword}
              </span>
            )}
          </div>
          <h2
            className="text-[14px] sm:text-[15px] font-semibold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug tracking-tight line-clamp-2 sm:line-clamp-1 break-keep"
            style={{ fontFamily: 'ui-serif, Georgia, serif' }}
          >
            {post.title}
          </h2>
          {post.summary && (
            <p className="text-[12px] text-slate-800 line-clamp-1 leading-snug mt-0.5">
              {post.summary}
            </p>
          )}
        </div>
        <div
          className={`shrink-0 w-7 h-7 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center text-white opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-colors duration-200 shadow-sm ring-1 ring-amber-200/60`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </article>
  );
}
