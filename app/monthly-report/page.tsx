'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface MonthlyStats {
  clinic: string;
  postsCount: number;
  totalViews: number;
  avgViews: number;
  topPost?: { title: string; views: number };
  reportMonth: string;
}

interface AllProjects {
  projects: string[];
}

export default function MonthlyReportPage() {
  const [allProjects, setAllProjects] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectInput, setProjectInput] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [statsMap, setStatsMap] = useState<Record<string, MonthlyStats[]>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  // 모든 프로젝트 목록 가져오기
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const res = await fetch('/api/all-projects');
        const data = await res.json();
        setAllProjects(data.projects || []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchAllProjects();
  }, []);

  // 선택된 프로젝트들의 데이터 가져오기
  useEffect(() => {
    if (selectedProjects.length === 0) return;

    const fetchDataForProjects = async () => {
      setLoading(true);
      try {
        const newStatsMap: Record<string, MonthlyStats[]> = {};

        for (const project of selectedProjects) {
          const res = await fetch(`/api/blog-monthly-stats?month=${selectedMonth}&category=${encodeURIComponent(project)}`);
          const data = await res.json();
          newStatsMap[project] = data.stats || [];
        }

        setStatsMap(newStatsMap);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataForProjects();
  }, [selectedProjects, selectedMonth]);

  // 프로젝트 추가
  const handleAddProject = () => {
    if (projectInput && !selectedProjects.includes(projectInput)) {
      setSelectedProjects([...selectedProjects, projectInput]);
      if (activeTab === '') {
        setActiveTab(projectInput);
      }
      setProjectInput('');
    }
  };

  // 프로젝트 제거
  const handleRemoveProject = (project: string) => {
    const updated = selectedProjects.filter(p => p !== project);
    setSelectedProjects(updated);

    if (activeTab === project) {
      setActiveTab(updated[0] || '');
    }
  };

  // 월도 선택
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = 5 - i; // 5월부터 역순
    const year = month > 0 ? 2026 : 2025;
    const m = month > 0 ? month : month + 12;
    return `${year}-${String(m).padStart(2, '0')}`;
  });

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  };

  const currentStats = activeTab ? statsMap[activeTab] || [] : [];
  const totalPosts = currentStats.reduce((sum, s) => sum + s.postsCount, 0);
  const totalViews = currentStats.reduce((sum, s) => sum + s.totalViews, 0);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 월간 분석 리포트</h1>
            <p className="text-gray-600">프로젝트를 선택하여 상세 분석 데이터를 확인하세요</p>
          </div>

          {/* 프로젝트 선택 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <label className="block text-sm font-bold text-gray-900 mb-3">프로젝트 선택</label>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddProject();
                  }
                }}
                placeholder="프로젝트명 입력 또는 선택..."
                list="project-list"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <datalist id="project-list">
                {allProjects.map((proj) => (
                  <option key={proj} value={proj} />
                ))}
              </datalist>
              <button
                onClick={handleAddProject}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                추가
              </button>
            </div>

            {/* 선택된 프로젝트 태그 */}
            <div className="flex flex-wrap gap-2">
              {selectedProjects.map((proj) => (
                <div
                  key={proj}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                >
                  {proj}
                  <button
                    onClick={() => handleRemoveProject(proj)}
                    className="hover:text-indigo-900 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">프로젝트를 선택하여 분석 데이터를 확인하세요</p>
            </div>
          ) : (
            <>
              {/* 월도 선택 */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <label className="block text-sm font-bold text-gray-900 mb-3">보고 월도</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {getMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 탭 네비게이션 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {selectedProjects.map((proj) => (
                    <button
                      key={proj}
                      onClick={() => setActiveTab(proj)}
                      className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                        activeTab === proj
                          ? 'text-indigo-600 border-b-2 border-indigo-600'
                          : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
                      }`}
                    >
                      {proj}
                    </button>
                  ))}
                </div>

                {/* 탭 콘텐츠 */}
                <div className="p-8">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400">로드 중...</div>
                    </div>
                  ) : currentStats.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">해당 월의 데이터가 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {/* 요약 통계 */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border-l-4 border-indigo-500">
                          <p className="text-gray-600 text-sm mb-1">클리닉 수</p>
                          <p className="text-3xl font-bold text-gray-900">{currentStats.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-500">
                          <p className="text-gray-600 text-sm mb-1">총 게시물</p>
                          <p className="text-3xl font-bold text-gray-900">{totalPosts}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
                          <p className="text-gray-600 text-sm mb-1">총 조회수</p>
                          <p className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
                          <p className="text-gray-600 text-sm mb-1">평균 조회 (글당)</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {totalPosts > 0 ? Math.round(totalViews / totalPosts).toLocaleString() : 0}
                          </p>
                        </div>
                      </div>

                      {/* 클리닉별 상세 */}
                      <div className="space-y-4">
                        {currentStats.map((stat, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                              <div>
                                <p className="text-gray-600 text-sm mb-1">클리닉</p>
                                <p className="text-lg font-semibold text-indigo-600">{stat.clinic}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 text-sm mb-1">게시물 수</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.postsCount}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 text-sm mb-1">총 조회수</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.totalViews.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 text-sm mb-1">글당 평균</p>
                                <p className="text-2xl font-bold text-gray-900">{Math.round(stat.avgViews).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 text-sm mb-1">성과율</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                  <div
                                    className="bg-indigo-500 h-2 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        (stat.postsCount / Math.max(...currentStats.map(s => s.postsCount))) * 100,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {stat.topPost && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-2">✨ 최고 조회 글</p>
                                <p className="text-sm text-gray-800 font-medium">{stat.topPost.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.topPost.views.toLocaleString()} 회</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 분석 섹션 */}
                      <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6 mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          📊 {getMonthLabel(selectedMonth)} 분석 ({activeTab})
                        </h3>
                        <ul className="space-y-2 text-gray-700 text-sm">
                          <li>• 총 <strong>{totalPosts}</strong>개의 블로그 글이 발행되었습니다.</li>
                          <li>
                            • 평균 글당 조회수는 <strong>{totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0}</strong>회입니다.
                          </li>
                          <li>
                            • 가장 활발한 클리닉은 <strong>{currentStats[0]?.clinic}</strong>로 {currentStats[0]?.postsCount}개의 글을 발행했습니다.
                          </li>
                          <li>• 블로그 홍보는 온라인 가시성과 신뢰도 향상에 큰 역할을 합니다.</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
