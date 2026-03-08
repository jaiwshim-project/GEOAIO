'use client';

import Link from 'next/link';
import { useUser } from '@/lib/user-context';

export default function CategoryBanner() {
  const { currentUser, selectedProject } = useUser();

  if (!currentUser) return null;

  return (
    <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-indigo-600 font-semibold truncate">{currentUser.username}</span>
          </div>
          {selectedProject ? (
            <>
              <span className="text-indigo-300 text-xs">·</span>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-xs font-bold text-indigo-700 truncate">{selectedProject.name}</span>
              </div>
            </>
          ) : (
            <>
              <span className="text-indigo-300 text-xs">·</span>
              <span className="text-xs text-amber-600 font-medium">카테고리 미선택</span>
            </>
          )}
        </div>

        <Link
          href="/user-dashboard"
          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg transition-all shrink-0"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          카테고리 변경
        </Link>
      </div>
    </div>
  );
}
