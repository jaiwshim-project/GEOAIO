'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserProject, ProjectFile } from '@/lib/user-context';

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  md: '📋',
  txt: '📃',
};

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function UserDashboardPage() {
  const router = useRouter();
  const { currentUser, selectedProject, setSelectedProject, logout } = useUser();

  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addProgress, setAddProgress] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editIsDragging, setEditIsDragging] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editProgress, setEditProgress] = useState('');
  const [editError, setEditError] = useState('');
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 콘텐츠 생성 목록 상태
  type GenerateItem = {
    id: string; title: string; topic: string; category: string;
    is_ab: boolean; ab_count: number; selected_ab_index: number; created_at: string;
  };
  const [showGenSection, setShowGenSection] = useState(false);
  const [genProjectId, setGenProjectId] = useState<string | null>(null);
  const [genItems, setGenItems] = useState<GenerateItem[]>([]);
  const [genLoading, setGenLoading] = useState(false);

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

  const fetchGenItems = async (projectId: string) => {
    setGenLoading(true);
    try {
      const res = await fetch(`/api/generate-results?project_id=${projectId}`);
      const data = await res.json();
      setGenItems(data.items || []);
    } catch {
      setGenItems([]);
    } finally {
      setGenLoading(false);
    }
  };

  const handleGenProjectSelect = (projectId: string) => {
    setGenProjectId(projectId);
    fetchGenItems(projectId);
  };

  // 파일 유효성 검사
  const validateFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'docx', 'doc', 'md', 'txt'];
    if (!allowed.includes(ext)) return `${file.name}: PDF, DOCX, MD, TXT 파일만 가능합니다.`;
    if (file.size > 20 * 1024 * 1024) return `${file.name}: 20MB 이하 파일만 가능합니다.`;
    return null;
  };

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of arr) {
      const err = validateFile(f);
      if (err) errors.push(err);
      else if (!newFiles.find(e => e.name === f.name)) valid.push(f);
    }
    if (errors.length) setError(errors.join('\n'));
    setNewFiles(prev => [...prev, ...valid]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleAddProject = async () => {
    if (!newName.trim()) { setError('카테고리 이름을 입력해주세요.'); return; }
    setAdding(true);
    setError('');

    try {
      // 1. 카테고리 생성
      setAddProgress('카테고리 생성 중...');
      const res = await fetch('/api/user-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser!.id, name: newName.trim(), description: newDesc.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '추가 실패'); return; }

      const projectId = data.project.id;
      const uploadedFiles: ProjectFile[] = [];

      // 2. 파일 업로드 (parse-file → DB 저장)
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        try {
          // 2a. 텍스트 추출
          setAddProgress(`텍스트 추출 중... (${i + 1}/${newFiles.length}) ${file.name}`);
          const fd = new FormData();
          fd.append('file', file);
          const parseRes = await fetch('/api/parse-file', { method: 'POST', body: fd });
          let content = '';
          if (parseRes.ok) {
            const parseData = await parseRes.json();
            content = parseData.text || '';
          }

          // 2b. DB 저장
          setAddProgress(`저장 중... (${i + 1}/${newFiles.length}) ${file.name}`);
          const fRes = await fetch('/api/user-projects/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId, file_name: file.name, file_size: file.size, file_type: file.type, content }),
          });
          const fData = await fRes.json();
          if (fRes.ok && fData.file) {
            uploadedFiles.push(fData.file as ProjectFile);
          } else {
            setError(`파일 저장 실패 (${file.name}): ${fData.error || `HTTP ${fRes.status}`}`);
          }
        } catch (fileErr) {
          setError(`파일 오류 (${file.name}): ${fileErr instanceof Error ? fileErr.message : '네트워크 오류'}`);
        }
      }

      setProjects(prev => [{ ...data.project, files: uploadedFiles }, ...prev]);
      setNewName('');
      setNewDesc('');
      setNewFiles([]);
      setShowAddForm(false);
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setAdding(false);
      setAddProgress('');
    }
  };

  const startEdit = (project: UserProject) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditNewFiles([]);
    setEditError('');
    setEditProgress('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNewFiles([]);
    setEditError('');
  };

  const addEditFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of arr) {
      const err = validateFile(f);
      if (err) errors.push(err);
      else if (!editNewFiles.find(e => e.name === f.name)) valid.push(f);
    }
    if (errors.length) setEditError(errors.join('\n'));
    setEditNewFiles(prev => [...prev, ...valid]);
  };

  const handleDeleteFile = async (projectId: string, fileId: string) => {
    setDeletingFileId(fileId);
    try {
      const res = await fetch('/api/user-projects/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fileId }),
      });
      if (res.ok) {
        setProjects(prev => prev.map(p =>
          p.id === projectId
            ? { ...p, files: p.files?.filter(f => f.id !== fileId) }
            : p
        ));
      }
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    if (!editName.trim()) { setEditError('카테고리 이름을 입력해주세요.'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      // 1. 이름/설명 수정
      setEditProgress('정보 저장 중...');
      const res = await fetch('/api/user-projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, name: editName.trim(), description: editDesc.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || '수정 실패'); return; }

      // 2. 새 파일 업로드
      const uploadedFiles: ProjectFile[] = [];
      for (let i = 0; i < editNewFiles.length; i++) {
        const file = editNewFiles[i];
        try {
          setEditProgress(`파일 추가 중... (${i + 1}/${editNewFiles.length}) ${file.name}`);
          const fd = new FormData();
          fd.append('file', file);
          const parseRes = await fetch('/api/parse-file', { method: 'POST', body: fd });
          let content = '';
          if (parseRes.ok) {
            const parseData = await parseRes.json();
            content = parseData.text || '';
          }
          const fRes = await fetch('/api/user-projects/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId, file_name: file.name, file_size: file.size, file_type: file.type, content }),
          });
          const fData = await fRes.json();
          if (fRes.ok && fData.file) uploadedFiles.push(fData.file as ProjectFile);
          else setEditError(`파일 저장 실패 (${file.name}): ${fData.error || ''}`);
        } catch (fileErr) {
          setEditError(`파일 오류 (${file.name}): ${fileErr instanceof Error ? fileErr.message : '오류'}`);
        }
      }

      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, name: data.project.name, description: data.project.description, files: [...(p.files || []), ...uploadedFiles] }
          : p
      ));
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, name: data.project.name, description: data.project.description });
      }
      setEditingId(null);
      setEditNewFiles([]);
    } finally {
      setEditSaving(false);
      setEditProgress('');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
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

  const resetAddForm = () => {
    setShowAddForm(false);
    setError('');
    setNewName('');
    setNewDesc('');
    setNewFiles([]);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-4">
      <div className="max-w-2xl mx-auto">

        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← 홈</Link>
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

        {/* ===== 콘텐츠 카테고리 ===== */}
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

          {/* 추가 폼 */}
          {showAddForm && (
            <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10 space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setError(''); }}
                placeholder="카테고리 이름 (예: 치과병원, 동물병원, 줄기세포)"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 text-sm transition-colors"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="설명 (선택사항)"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 text-sm transition-colors"
              />

              {/* 파일 드롭 존 */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-300 text-sm font-medium">파일을 여기에 드래그하거나 클릭하여 업로드</p>
                <p className="text-gray-500 text-xs mt-1">PDF, DOCX, MD, TXT · 최대 20MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.md,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>

              {/* 선택된 파일 목록 */}
              {newFiles.length > 0 && (
                <div className="space-y-1.5">
                  {newFiles.map((file, i) => {
                    const ext = file.name.split('.').pop()?.toLowerCase() || '';
                    return (
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-sm">{FILE_ICONS[ext] || '📄'}</span>
                        <span className="text-white text-xs flex-1 truncate">{file.name}</span>
                        <span className="text-gray-400 text-xs shrink-0">{formatFileSize(file.size)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setNewFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                          className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {error && <p className="text-red-400 text-xs whitespace-pre-line">{error}</p>}
              {addProgress && <p className="text-indigo-300 text-xs">{addProgress}</p>}

              <div className="flex gap-2">
                <button onClick={handleAddProject} disabled={adding}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all">
                  {adding ? addProgress || '처리 중...' : '카테고리 추가'}
                </button>
                <button onClick={resetAddForm}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-lg transition-all">
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 카테고리 목록 */}
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
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedProject?.id === project.id
                      ? 'bg-indigo-600/30 border-indigo-400/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {editingId === project.id ? (
                    /* ===== 수정 폼 ===== */
                    <div className="space-y-3">
                      <p className="text-indigo-300 text-xs font-semibold">카테고리 수정</p>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="카테고리 이름"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 text-sm"
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="설명 (선택사항)"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 text-sm"
                      />

                      {/* 기존 파일 목록 (삭제 가능) */}
                      {project.files && project.files.length > 0 && (
                        <div>
                          <p className="text-gray-500 text-xs mb-1.5">업로드된 파일</p>
                          <div className="space-y-1">
                            {project.files.map((f) => {
                              const ext = f.file_name.split('.').pop()?.toLowerCase() || '';
                              return (
                                <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
                                  <span className="text-sm shrink-0">{FILE_ICONS[ext] || '📄'}</span>
                                  <span className="text-gray-200 text-xs flex-1 truncate">{f.file_name}</span>
                                  {f.file_size && <span className="text-gray-500 text-xs shrink-0">{formatFileSize(f.file_size)}</span>}
                                  <button
                                    onClick={() => handleDeleteFile(project.id, f.id)}
                                    disabled={deletingFileId === f.id}
                                    className="p-1 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
                                    title="파일 삭제"
                                  >
                                    {deletingFileId === f.id
                                      ? <span className="text-xs">...</span>
                                      : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    }
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 새 파일 추가 드롭존 */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setEditIsDragging(true); }}
                        onDragLeave={() => setEditIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setEditIsDragging(false); addEditFiles(e.dataTransfer.files); }}
                        onClick={() => editFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                          editIsDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <p className="text-gray-400 text-xs">새 파일 추가 (드래그 또는 클릭)</p>
                        <p className="text-gray-600 text-xs mt-0.5">PDF, DOCX, MD, TXT · 최대 20MB</p>
                        <input ref={editFileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.md,.txt" className="hidden"
                          onChange={(e) => e.target.files && addEditFiles(e.target.files)} />
                      </div>

                      {/* 추가할 새 파일 목록 */}
                      {editNewFiles.length > 0 && (
                        <div className="space-y-1">
                          {editNewFiles.map((file, i) => {
                            const ext = file.name.split('.').pop()?.toLowerCase() || '';
                            return (
                              <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                                <span className="text-sm shrink-0">{FILE_ICONS[ext] || '📄'}</span>
                                <span className="text-indigo-200 text-xs flex-1 truncate">{file.name}</span>
                                <span className="text-gray-500 text-xs shrink-0">{formatFileSize(file.size)}</span>
                                <button onClick={() => setEditNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                                  className="p-1 text-gray-500 hover:text-red-400 transition-colors shrink-0">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {editError && <p className="text-red-400 text-xs whitespace-pre-line">{editError}</p>}
                      {editProgress && <p className="text-indigo-300 text-xs">{editProgress}</p>}

                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateProject(project.id)} disabled={editSaving}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all">
                          {editSaving ? editProgress || '저장 중...' : '저장'}
                        </button>
                        <button onClick={cancelEdit}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded-lg transition-all">
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ===== 일반 보기 ===== */
                    <>
                      {/* 상단: 이름 + 버튼 */}
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          selectedProject?.id === project.id ? 'bg-indigo-500' : 'bg-white/10'
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">{project.name}</p>
                          {project.description && (
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{project.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleSelectProject(project)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                          >
                            선택
                          </button>
                          <button
                            onClick={() => startEdit(project)}
                            className="p-1.5 text-gray-400 hover:text-indigo-300 transition-colors"
                            title="수정"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={deletingId === project.id}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* 업로드된 파일 목록 */}
                      {project.files && project.files.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-gray-500 text-xs mb-1.5">업로드된 파일 ({project.files.length})</p>
                          <div className="space-y-1">
                            {project.files.map((f) => {
                              const ext = f.file_name.split('.').pop()?.toLowerCase() || '';
                              return (
                                <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
                                  <span className="text-sm shrink-0">{FILE_ICONS[ext] || '📄'}</span>
                                  <span className="text-gray-200 text-xs flex-1 truncate">{f.file_name}</span>
                                  {f.file_size && <span className="text-gray-500 text-xs shrink-0">{formatFileSize(f.file_size)}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 현재 선택된 카테고리 */}
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

        {/* 바로가기 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/analyze" className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            콘텐츠 분석
          </Link>
          <button
            onClick={() => {
              const next = !showGenSection;
              setShowGenSection(next);
              // 섹션 열 때 카테고리 자동 선택 (현재 선택된 프로젝트 or 첫 번째)
              if (next && !genProjectId && projects.length > 0) {
                const autoId = selectedProject?.id || projects[0].id;
                setGenProjectId(autoId);
                fetchGenItems(autoId);
              }
            }}
            className={`flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold rounded-xl transition-all ${
              showGenSection ? 'bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            콘텐츠 생성
            <svg className={`w-3.5 h-3.5 transition-transform ${showGenSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* ===== 콘텐츠 생성 섹션 ===== */}
        {showGenSection && (
          <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 space-y-3">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-bold">생성된 콘텐츠 목록</p>
              <Link href="/generate" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all">
                + 새 콘텐츠 생성
              </Link>
            </div>

            {/* 카테고리(프로젝트) 탭 버튼 */}
            {projects.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-2">등록된 카테고리가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleGenProjectSelect(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      genProjectId === p.id
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {/* 선택된 카테고리의 콘텐츠 목록 */}
            <div className="border-t border-white/10 pt-3">
              {!genProjectId ? (
                <p className="text-gray-500 text-xs text-center py-3">카테고리를 선택하면 생성된 콘텐츠 목록이 표시됩니다.</p>
              ) : genLoading ? (
                <p className="text-gray-400 text-xs text-center py-3">불러오는 중...</p>
              ) : genItems.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-3">아직 생성된 콘텐츠가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {genItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/generate/result?id=${item.id}`)}
                      className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{item.title || item.topic}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 bg-violet-600/50 text-violet-200 text-xs rounded font-medium">
                          5가지 톤
                        </span>
                        <span className="px-1.5 py-0.5 bg-indigo-600/40 text-indigo-200 text-xs rounded">
                          v{(item.selected_ab_index ?? 0) + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
