'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserProject } from '@/lib/user-context';

export default function UserDashboardPage() {
  const router = useRouter();
  const { currentUser, selectedProject, setSelectedProject, logout } = useUser();

  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 로그인 안 되어 있으면 user-select로 이동
  useEffect(() => {
    if (!currentUser) router.push('/user-select');
  }, [currentUser, router]);

  const fetchProjects = useCallback(async () => {
    if (!currentUser) return;
    setLoadingProjects(true);
    try {
      const res = await fetch(`/api/user-projects?user_id=${currentUser.id}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleAddProject = async () => {
    if (!newName.trim()) { setError('항목 이름을 입력해주세요.'); return; }
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/user-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser!.id, name: newName.trim(), description: newDesc.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '추가 실패'); return; }
      setProjects(prev => [data.project, ...prev]);
      setNewName('');
      setNewDesc('');
      setShowAddForm(false);
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      await fetch('/api/user-projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectProject = (project: UserProject) => {
    setSelectedProject(project);
    router.push('/analyze');
  };

  const handleLogout = () => {
    logout();
    router.push('/user-select');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-4">
      <div className="max-w-2xl mx-auto">

        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← 홈
          </Link>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>

        {/* ===== 로그인 정보 카드 ===== */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{currentUser.username}</h2>
              <p className="text-indigo-300 text-sm">로그인됨</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currentUser.company_name && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">회사명</p>
                <p className="text-white text-sm font-medium">{currentUser.company_name}</p>
              </div>
            )}
            {currentUser.service_name && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">서비스명</p>
                <p className="text-white text-sm font-medium">{currentUser.service_name}</p>
              </div>
            )}
            {currentUser.phone && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">휴대폰</p>
                <p className="text-white text-sm font-medium">{currentUser.phone}</p>
              </div>
            )}
            {currentUser.email && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">이메일</p>
                <p className="text-white text-sm font-medium truncate">{currentUser.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== 작업 항목 ===== */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold text-base">콘텐츠 카테고리</h3>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setError(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              콘텐츠 카테고리 추가하기
            </button>
          </div>

          {/* 항목 추가 폼 */}
          {showAddForm && (
            <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(''); }}
                placeholder="카테고리 이름 (예: 치과병원, 동물병원, 줄기세포)"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 text-sm mb-2 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="설명 (선택사항)"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 text-sm mb-3 transition-colors"
              />
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleAddProject} disabled={adding}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all">
                  {adding ? '추가 중...' : '추가'}
                </button>
                <button onClick={() => { setShowAddForm(false); setError(''); setNewName(''); setNewDesc(''); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-lg transition-all">
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 항목 목록 */}
          {loadingProjects ? (
            <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">등록된 콘텐츠 카테고리가 없습니다.</p>
              <p className="text-gray-500 text-xs mt-1">"콘텐츠 카테고리 추가하기" 버튼으로 추가하세요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${
                    selectedProject?.id === project.id
                      ? 'bg-indigo-600/30 border-indigo-400/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedProject?.id === project.id ? 'bg-indigo-500' : 'bg-white/10'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{project.name}</p>
                    {project.description && (
                      <p className="text-gray-400 text-xs truncate mt-0.5">{project.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSelectProject(project)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      선택
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deletingId === project.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 현재 선택된 카테고리 표시 */}
          {selectedProject && (
            <div className="mt-4 p-3 bg-indigo-600/20 border border-indigo-400/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-indigo-200 text-xs">
                  선택된 카테고리: <span className="font-bold text-white">{selectedProject.name}</span>
                </p>
              </div>
              <Link href="/analyze" className="text-indigo-300 hover:text-white text-xs font-semibold transition-colors">
                콘텐츠 작업 시작 →
              </Link>
            </div>
          )}
        </div>

        {/* 바로가기 버튼 */}
        {selectedProject && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/analyze" className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              콘텐츠 분석
            </Link>
            <Link href="/generate" className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              콘텐츠 생성
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
