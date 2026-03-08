'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { HistoryItem } from '@/lib/types';
import { getHistoryAsync, deleteHistoryItem } from '@/lib/history';
import { useUser } from '@/lib/user-context';

const DashboardStats = dynamic(() => import('@/components/DashboardStats'), { ssr: false });

type TabType = 'analysis' | 'generation';

const CATEGORY_LABELS: Record<string, string> = {
  blog: '블로그',
  product: '제품/서비스',
  faq: 'FAQ',
  howto: 'How-to',
  landing: '랜딩페이지',
  technical: '기술문서',
  social: 'SNS',
  email: '이메일',
};

type ProjectItem = { id: string; name: string };
type GenItem = { id: string; title: string; topic: string; created_at: string; selected_ab_index: number };

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('generation');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);

  // 프로젝트 필터
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [projectItems, setProjectItems] = useState<GenItem[]>([]);
  const [projectItemsLoading, setProjectItemsLoading] = useState(false);

  useEffect(() => {
    getHistoryAsync().then(setHistory);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/user-projects?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(d => setProjects((d.projects || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, [currentUser]);

  const handleProjectClick = async (projectId: string) => {
    if (activeProject === projectId) {
      setActiveProject(null);
      setProjectItems([]);
      return;
    }
    setActiveProject(projectId);
    setProjectItemsLoading(true);
    try {
      const res = await fetch(`/api/generate-results?project_id=${projectId}`);
      const data = await res.json();
      setProjectItems(data.items || []);
    } catch {
      setProjectItems([]);
    } finally {
      setProjectItemsLoading(false);
    }
  };

  // 생성 탭의 콘텐츠 타입 카테고리 목록
  const genCategories = Array.from(
    new Set(history.filter(h => h.type === 'generation' && h.category).map(h => h.category!))
  );

  const filteredHistory = history.filter(h => {
    if (h.type !== activeTab) return false;
    if (activeTab === 'generation' && activeCategory && h.category !== activeCategory) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    await deleteHistoryItem(id);
    const updated = await getHistoryAsync();
    setHistory(updated);
  };

  const toggleRevisions = (id: string) => {
    setExpandedRevisions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* 페이지 제목 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
          <p className="text-sm text-gray-500 mt-1">콘텐츠 분석 및 생성 작업 이력을 관리합니다</p>
        </div>

        {/* 통계 */}
        <div className="bg-white rounded-xl shadow-sm border border-violet-200 overflow-hidden">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-violet-50 transition-colors"
          >
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              콘텐츠 통계
            </h3>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showStats ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showStats && (
            <div className="px-5 pb-4">
              <DashboardStats history={history} />
            </div>
          )}
        </div>

        {/* 탭 */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-1.5 flex gap-1">
          <button
            onClick={() => { setActiveTab('analysis'); setActiveCategory(null); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border hover:shadow-md ${
              activeTab === 'analysis'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm border-sky-300'
                : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-indigo-200'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              콘텐츠 분석
              <span className="text-xs opacity-75">({history.filter(h => h.type === 'analysis').length})</span>
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('generation'); setActiveCategory(null); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border hover:shadow-md ${
              activeTab === 'generation'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-sm border-purple-300'
                : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-purple-200'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              콘텐츠 생성
              <span className="text-xs opacity-75">({history.filter(h => h.type === 'generation').length})</span>
            </span>
          </button>
        </div>

        {/* 생성 탭 - 좌/우 카드 + 목록 */}
        {activeTab === 'generation' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* 왼쪽: 프로젝트 카드 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">프로젝트</h3>
                </div>
                {projects.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">등록된 프로젝트가 없습니다.</p>
                ) : (
                  <div className="space-y-1.5">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleProjectClick(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeProject === p.id
                            ? 'bg-pink-500 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-pink-50 hover:text-pink-700'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 오른쪽: 콘텐츠 타입 카드 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">콘텐츠 타입</h3>
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeCategory === null
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    전체 ({history.filter(h => h.type === 'generation').length})
                  </button>
                  {genCategories.map(cat => {
                    const count = history.filter(h => h.type === 'generation' && h.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeCategory === cat
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        {CATEGORY_LABELS[cat] || cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 선택된 프로젝트의 콘텐츠 목록 */}
            {activeProject && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">
                  {projects.find(p => p.id === activeProject)?.name} 콘텐츠 목록
                </p>
                {projectItemsLoading ? (
                  <p className="text-sm text-gray-400 text-center py-6">불러오는 중...</p>
                ) : projectItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">생성된 콘텐츠가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {projectItems
                      .filter(item => !activeCategory || item.category === activeCategory)
                      .map(item => (
                        <div
                          key={item.id}
                          onClick={() => router.push(`/generate/result?id=${item.id}`)}
                          className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-violet-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-violet-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.title || item.topic}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-xs rounded-lg font-medium shrink-0">보기 →</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 이력 목록 - 생성 탭에서 프로젝트 선택 시 숨김 */}
        {!(activeTab === 'generation' && activeProject) && filteredHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 이력이 없습니다</h3>
            <p className="text-sm text-gray-500">
              {activeTab === 'analysis' ? '콘텐츠 분석' : '콘텐츠 생성'}을 시작하면 이곳에서 이력을 확인할 수 있습니다.
            </p>
          </div>
        ) : !(activeTab === 'generation' && activeProject) ? (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div key={item.id}>
                {/* 메인 항목 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 px-5 py-3">
                    {/* 날짜 */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-gray-400">{item.date.split(' ')[0]}</p>
                      <p className="text-xs text-gray-400">{item.date.split(' ')[1]}</p>
                    </div>

                    {/* 구분선 */}
                    <div className="w-px h-10 bg-gray-200" />

                    {/* 제목 & 요약 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{item.summary}</p>
                    </div>

                    {/* 점수 (분석인 경우) */}
                    {item.type === 'analysis' && item.analysisResult && (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
                          item.analysisResult.overallScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                          item.analysisResult.overallScore >= 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.analysisResult.overallScore}점
                        </span>
                      </div>
                    )}

                    {/* 수정 이력 개수 (생성인 경우) */}
                    {item.type === 'generation' && item.revisions && item.revisions.length > 0 && (
                      <button
                        onClick={() => toggleRevisions(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 hover:shadow-md transition-all"
                      >
                        <svg className={`w-3 h-3 transition-transform ${expandedRevisions.has(item.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        수정 {item.revisions.length}건
                      </button>
                    )}

                    {/* 버튼 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/${item.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 hover:shadow-md transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        보기
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center p-1.5 text-xs rounded-lg text-gray-400 border border-transparent hover:text-red-500 hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 수정 이력 하위 목록 */}
                {expandedRevisions.has(item.id) && item.revisions && item.revisions.length > 0 && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.revisions.map((rev, i) => (
                      <div
                        key={rev.id}
                        className="bg-violet-50 rounded-xl border border-violet-200 hover:border-violet-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4 px-5 py-3">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs text-violet-400">{rev.date.split(' ')[0]}</p>
                            <p className="text-xs text-violet-400">{rev.date.split(' ')[1]}</p>
                          </div>
                          <div className="w-px h-8 bg-violet-200" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-violet-800">수정 #{i + 1}</h4>
                            <p className="text-xs text-violet-500 truncate mt-0.5">{rev.editNotes}</p>
                          </div>
                          <button
                            onClick={() => router.push(`/dashboard/${item.id}?revision=${rev.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-violet-600 border border-violet-200 hover:bg-violet-100 hover:border-violet-400 hover:shadow-md transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            보기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
