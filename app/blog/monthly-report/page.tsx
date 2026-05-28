'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function MonthlyReportPage() {
  const [stats, setStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog-monthly-stats?month=${selectedMonth}`);
      const data = await res.json();
      setStats(data.stats || []);
    } catch (error) {
      console.error('Failed to fetch monthly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <Link href="/proposal" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4 inline-block">
              ← 제안서로 돌아가기
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">블로그 월간 홍보 보고서</h1>
            <p className="text-gray-600">각 클리닉별 블로그 성과를 한눈에 확인하세요</p>
          </div>

          {/* 월 선택 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">보고 월도</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="2026-05">2026년 5월</option>
              <option value="2026-04">2026년 4월</option>
              <option value="2026-03">2026년 3월</option>
              <option value="2026-02">2026년 2월</option>
              <option value="2026-01">2026년 1월</option>
            </select>
          </div>

          {/* 통계 카드 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block text-gray-400">로드 중...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {stats.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-500">해당 월의 데이터가 없습니다.</p>
                </div>
              ) : (
                <>
                  {/* 요약 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
                      <p className="text-gray-600 text-sm mb-1">클리닉 수</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                      <p className="text-gray-600 text-sm mb-1">총 게시물</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.reduce((sum, s) => sum + s.postsCount, 0)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                      <p className="text-gray-600 text-sm mb-1">총 조회수</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.reduce((sum, s) => sum + s.totalViews, 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                      <p className="text-gray-600 text-sm mb-1">평균 조회 (글당)</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {Math.round(
                          stats.reduce((sum, s) => sum + s.totalViews, 0) /
                            stats.reduce((sum, s) => sum + s.postsCount, 0)
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 클리닉별 상세 */}
                  <div className="space-y-4">
                    {stats.map((stat, idx) => (
                      <div key={idx} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                          <div>
                            <p className="text-gray-600 text-sm mb-1">클리닉</p>
                            <Link
                              href={`/blog/category/${encodeURIComponent(stat.clinic)}`}
                              className="text-lg font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              {stat.clinic}
                            </Link>
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
                                    (stat.postsCount / stats[0].postsCount) * 100,
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

                  {/* 분석 */}
                  <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 {getMonthLabel(selectedMonth)} 분석</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• 총 <strong>{stats.reduce((sum, s) => sum + s.postsCount, 0)}</strong>개의 블로그 글이 발행되었습니다.</li>
                      <li>• 평균 글당 조회수는 <strong>{Math.round(
                        stats.reduce((sum, s) => sum + s.totalViews, 0) /
                          stats.reduce((sum, s) => sum + s.postsCount, 0)
                      )}</strong>회입니다.</li>
                      <li>• 가장 활발한 클리닉은 <strong>{stats[0]?.clinic}</strong>로 {stats[0]?.postsCount}개의 글을 발행했습니다.</li>
                      <li>• 블로그 홍보는 클리닉의 온라인 가시성과 신뢰도 향상에 큰 역할을 합니다.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
