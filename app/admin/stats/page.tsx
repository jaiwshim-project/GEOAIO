'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getUserPlan } from '@/lib/usage';

interface PlanChangeEntry {
  name: string;
  email: string;
  old_plan: string;
  new_plan: string;
  changed_at: string;
  changed_by: string;
}

interface StatsData {
  totalUsers: number;
  planCounts: { admin: number; free: number; tester: number; pro: number; max: number };
  totalByFeature: { analyze: number; generate: number; keyword: number; series: number };
  thisMonthUsage: { analyze: number; generate: number; keyword: number; series: number };
  monthlyTrend: { month: string; analyze: number; generate: number; keyword: number; series: number; total: number }[];
  signupTrend: { month: string; count: number }[];
  activeToday: number;
  activeWeek: number;
  topUsers: { name: string; email: string; plan: string; total: number }[];
  currentMonth: string;
  planChangeTrend: { month: string; upgrades: number; downgrades: number; total: number }[];
  planTransitions: { from: string; to: string; count: number }[];
  changeBySource: { admin: number; system: number };
  recentChanges: PlanChangeEntry[];
  subscriptionSummary: { totalPaid: number; pro: number; max: number; expiringSoon: number; expired: number };
  totalPlanChanges: number;
}

const FEATURE_LABELS: Record<string, string> = {
  analyze: '콘텐츠 분석',
  generate: '콘텐츠 생성',
  keyword: '키워드 분석',
  series: '시리즈 기획',
};

const FEATURE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  analyze: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
  generate: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  keyword: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
  series: { bg: 'bg-violet-50', text: 'text-violet-600', bar: 'bg-violet-500' },
};

const PLAN_STYLES: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  free: 'bg-gray-100 text-gray-700',
  tester: 'bg-emerald-100 text-emerald-700',
  pro: 'bg-blue-100 text-blue-700',
  max: 'bg-violet-100 text-violet-700',
};

const PLAN_LABELS: Record<string, string> = {
  admin: '관리자',
  free: '무료',
  tester: '테스터',
  pro: '프로',
  max: '맥스',
};

function formatMonth(month: string) {
  const [y, m] = month.split('-');
  return `${y}.${m}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminStatsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // 세션에 저장된 관리자 비밀번호 확인
        const savedPw = sessionStorage.getItem('admin_pw');
        if (savedPw) {
          const res = await fetch('/api/admin/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: savedPw }),
          });
          if (res.ok) {
            setAuthenticated(true);
            loadStats(savedPw);
            setAuthChecking(false);
            return;
          }
        }
        const plan = await getUserPlan();
        if (plan === 'admin') {
          setAuthenticated(true);
          loadStats();
        }
      } catch {
        // not logged in
      } finally {
        setAuthChecking(false);
      }
    };
    checkAdmin();
  }, []);

  const loadStats = async (pw?: string) => {
    setLoading(true);
    setError('');
    const password = pw || sessionStorage.getItem('admin_pw') || '';
    try {
      const res = await fetch('/api/admin/stats', {
        headers: password ? { 'X-Admin-Password': password } : {},
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '조회 실패');
      }
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-500">관리자 권한 확인 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">접근 권한 없음</h2>
            <p className="text-sm text-gray-500 mt-2">관리자 계정으로 로그인해야 접근할 수 있습니다.</p>
            <Link href="/" className="inline-block mt-4 px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all">
              홈으로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalUsageAll = stats ? Object.values(stats.totalByFeature).reduce((a, b) => a + b, 0) : 0;
  const thisMonthTotal = stats ? Object.values(stats.thisMonthUsage).reduce((a, b) => a + b, 0) : 0;
  const maxMonthlyTotal = stats ? Math.max(...stats.monthlyTrend.map(m => m.total), 1) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            관리자 대시보드
          </h1>
          <p className="text-gray-500 text-sm">구독 관리 · 등급 관리 · 통계 관리</p>
        </div>

        {/* 폴더 탭 */}
        <div className="flex items-end gap-0 mb-0">
          <Link
            href="/admin"
            className="px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r transition-all bg-gray-100 text-gray-500 border-t-transparent border-l-gray-200 border-r-gray-200 hover:bg-gray-50 hover:text-gray-700"
          >
            구독 관리
          </Link>
          <Link
            href="/admin"
            className="px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r transition-all bg-gray-100 text-gray-500 border-t-transparent border-l-gray-200 border-r-gray-200 hover:bg-gray-50 hover:text-gray-700"
          >
            등급 관리
          </Link>
          <span className="px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r bg-white text-amber-700 border-t-amber-500 border-l-gray-300 border-r-gray-300 border-b-0 z-10 -mb-px">
            통계 관리
          </span>
          <div className="flex-1 border-b border-gray-300 flex justify-end items-center pr-2 pb-1">
            <button
              onClick={() => loadStats()}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="border-l border-r border-b border-gray-300 bg-white p-5 mb-5">

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {loading && !stats ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-8 h-8 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            통계 로딩 중...
          </div>
        ) : stats && (
          <>
            {/* 1행: 핵심 지표 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">전체 회원</p>
                <p className="text-3xl font-extrabold text-gray-900 tabular-nums">{stats.totalUsers}</p>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {Object.entries(stats.planCounts).map(([plan, count]) => (
                    count > 0 && (
                      <span key={plan} className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${PLAN_STYLES[plan]}`}>
                        {plan === 'admin' ? '관리' : plan === 'free' ? '무료' : plan.toUpperCase()} {count}
                      </span>
                    )
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 border border-indigo-200 shadow-sm">
                <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">누적 사용량</p>
                <p className="text-3xl font-extrabold text-indigo-600 tabular-nums">{totalUsageAll.toLocaleString()}<span className="text-base font-bold ml-0.5">회</span></p>
                <p className="text-[11px] text-gray-400 mt-1">전체 기간 합계</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-5 border border-emerald-200 shadow-sm">
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">이번 달 사용량</p>
                <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">{thisMonthTotal.toLocaleString()}<span className="text-base font-bold ml-0.5">회</span></p>
                <p className="text-[11px] text-gray-400 mt-1">{stats.currentMonth}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border border-amber-200 shadow-sm">
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2">활성 사용자</p>
                <p className="text-3xl font-extrabold text-amber-600 tabular-nums">{stats.activeWeek}<span className="text-base font-bold ml-0.5">명</span></p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-gray-500">오늘 <span className="font-bold text-amber-600">{stats.activeToday}</span>명</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-[11px] text-gray-500">7일 <span className="font-bold text-amber-600">{stats.activeWeek}</span>명</span>
                </div>
              </div>
            </div>

            {/* 2행: 기능별 사용량 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* 누적 사용량 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">기능별 누적 사용량</h3>
                <div className="space-y-4">
                  {Object.entries(stats.totalByFeature).map(([feature, count]) => {
                    const maxCount = Math.max(...Object.values(stats.totalByFeature), 1);
                    const pct = (count / maxCount) * 100;
                    const colors = FEATURE_COLORS[feature];
                    return (
                      <div key={feature}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${colors.bar}`} />
                            <span className="text-xs font-semibold text-gray-700">{FEATURE_LABELS[feature]}</span>
                          </div>
                          <span className={`text-sm font-extrabold tabular-nums ${colors.text}`}>{count.toLocaleString()}<span className="text-[10px] font-semibold ml-0.5">회</span></span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 이번 달 사용량 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">이번 달 사용량 <span className="text-gray-400 font-normal">({stats.currentMonth})</span></h3>
                <div className="space-y-4">
                  {Object.entries(stats.thisMonthUsage).map(([feature, count]) => {
                    const maxCount = Math.max(...Object.values(stats.thisMonthUsage), 1);
                    const pct = (count / maxCount) * 100;
                    const colors = FEATURE_COLORS[feature];
                    return (
                      <div key={feature}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${colors.bar}`} />
                            <span className="text-xs font-semibold text-gray-700">{FEATURE_LABELS[feature]}</span>
                          </div>
                          <span className={`text-sm font-extrabold tabular-nums ${colors.text}`}>{count.toLocaleString()}<span className="text-[10px] font-semibold ml-0.5">회</span></span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3행: 월별 추이 차트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">월별 사용량 추이 <span className="text-gray-400 font-normal">(최근 6개월)</span></h3>
                <div className="flex items-end gap-3 h-44">
                  {stats.monthlyTrend.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs font-extrabold text-gray-800 tabular-nums">{m.total}</span>
                      <div className="w-full bg-gray-50 rounded-lg overflow-hidden relative" style={{ height: '130px' }}>
                        <div className="absolute bottom-0 w-full flex flex-col">
                          {(['series', 'keyword', 'generate', 'analyze'] as const).map(f => {
                            const h = maxMonthlyTotal > 0 ? (m[f] / maxMonthlyTotal) * 130 : 0;
                            return <div key={f} className={`w-full ${FEATURE_COLORS[f].bar} first:rounded-t-md`} style={{ height: `${h}px` }} />;
                          })}
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-gray-500">{formatMonth(m.month)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 justify-center border-t border-gray-100 pt-3">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${FEATURE_COLORS[key].bar}`} />
                      <span className="text-[11px] font-medium text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">월별 가입자 추이 <span className="text-gray-400 font-normal">(최근 6개월)</span></h3>
                <div className="flex items-end gap-3 h-44">
                  {stats.signupTrend.map((m) => {
                    const maxSignup = Math.max(...stats.signupTrend.map(s => s.count), 1);
                    const h = (m.count / maxSignup) * 130;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-xs font-extrabold text-gray-800 tabular-nums">{m.count}</span>
                        <div className="w-full bg-gray-50 rounded-lg overflow-hidden" style={{ height: '130px' }}>
                          <div className="relative w-full h-full flex items-end">
                            <div className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md" style={{ height: `${h}px` }} />
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-gray-500">{formatMonth(m.month)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4행: 구독 현황 + 등급 변경 요약 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-200 shadow-sm">
                <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">유료 구독자</p>
                <p className="text-2xl font-extrabold text-indigo-600 tabular-nums">{stats.subscriptionSummary.totalPaid}<span className="text-sm font-bold ml-0.5">명</span></p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">PRO {stats.subscriptionSummary.pro}</span>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">MAX {stats.subscriptionSummary.max}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-200 shadow-sm">
                <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-1">만료 임박</p>
                <p className="text-2xl font-extrabold text-orange-600 tabular-nums">{stats.subscriptionSummary.expiringSoon}<span className="text-sm font-bold ml-0.5">명</span></p>
                <p className="text-[10px] text-gray-400 mt-1">7일 이내</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-4 border border-red-200 shadow-sm">
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1">만료됨</p>
                <p className="text-2xl font-extrabold text-red-600 tabular-nums">{stats.subscriptionSummary.expired}<span className="text-sm font-bold ml-0.5">명</span></p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">총 등급 변경</p>
                <p className="text-2xl font-extrabold text-emerald-600 tabular-nums">{stats.totalPlanChanges}<span className="text-sm font-bold ml-0.5">건</span></p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">관리자 {stats.changeBySource.admin}</span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">자동 {stats.changeBySource.system}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl p-4 border border-cyan-200 shadow-sm">
                <p className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1">이번 달 변경</p>
                {(() => {
                  const thisMonth = stats.planChangeTrend[stats.planChangeTrend.length - 1];
                  return (
                    <>
                      <p className="text-2xl font-extrabold text-cyan-600 tabular-nums">{thisMonth?.total || 0}<span className="text-sm font-bold ml-0.5">건</span></p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">↑ {thisMonth?.upgrades || 0}</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">↓ {thisMonth?.downgrades || 0}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 5행: 월별 등급 변경 추이 + 등급 전환 흐름 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* 월별 업그레이드/다운그레이드 추이 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">월별 등급 변경 추이 <span className="text-gray-400 font-normal">(최근 6개월)</span></h3>
                <div className="flex items-end gap-3 h-44">
                  {stats.planChangeTrend.map((m) => {
                    const maxVal = Math.max(...stats.planChangeTrend.map(t => Math.max(t.upgrades, t.downgrades)), 1);
                    const upH = (m.upgrades / maxVal) * 120;
                    const downH = (m.downgrades / maxVal) * 120;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-0.5 text-[10px] font-bold">
                          <span className="text-green-600">↑{m.upgrades}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-red-600">↓{m.downgrades}</span>
                        </div>
                        <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
                          <div className="flex-1 bg-green-400 rounded-t-md transition-all" style={{ height: `${upH}px` }} />
                          <div className="flex-1 bg-red-400 rounded-t-md transition-all" style={{ height: `${downH}px` }} />
                        </div>
                        <span className="text-[11px] font-medium text-gray-500">{formatMonth(m.month)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-6 mt-4 justify-center border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-[11px] font-medium text-gray-500">업그레이드</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="text-[11px] font-medium text-gray-500">다운그레이드</span>
                  </div>
                </div>
              </div>

              {/* 등급 전환 흐름 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">등급 전환 흐름 <span className="text-gray-400 font-normal">(전체 기간)</span></h3>
                {stats.planTransitions.length === 0 ? (
                  <div className="flex items-center justify-center h-44 text-gray-400 text-sm">변경 이력이 없습니다</div>
                ) : (
                  <div className="space-y-2.5 max-h-52 overflow-y-auto">
                    {stats.planTransitions.map((t, i) => {
                      const maxCount = stats.planTransitions[0]?.count || 1;
                      const pct = (t.count / maxCount) * 100;
                      const isUpgrade = (() => {
                        const rank: Record<string, number> = { free: 0, tester: 1, pro: 2, max: 3, admin: 4 };
                        return (rank[t.to] || 0) > (rank[t.from] || 0);
                      })();
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${PLAN_STYLES[t.from] || PLAN_STYLES.free}`}>{PLAN_LABELS[t.from] || t.from}</span>
                              <span className="text-gray-400 text-xs">→</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${PLAN_STYLES[t.to] || PLAN_STYLES.free}`}>{PLAN_LABELS[t.to] || t.to}</span>
                              <span className={`text-[10px] font-bold ${isUpgrade ? 'text-green-500' : 'text-red-500'}`}>{isUpgrade ? '↑' : '↓'}</span>
                            </div>
                            <span className="text-xs font-extrabold text-gray-700 tabular-nums">{t.count}건</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isUpgrade ? 'bg-green-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 6행: 최근 등급 변경 내역 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">최근 등급 변경 내역 <span className="text-gray-400 font-normal">(최근 20건)</span></h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">일시</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">이름</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">이메일</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500">이전 등급</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500"></th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500">변경 등급</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500">변경 주체</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentChanges.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">등급 변경 이력이 없습니다.</td>
                      </tr>
                    ) : (
                      stats.recentChanges.map((c, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.changed_at)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800 text-xs">{c.name}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                          <td className="text-center px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${PLAN_STYLES[c.old_plan] || PLAN_STYLES.free}`}>{PLAN_LABELS[c.old_plan] || c.old_plan}</span>
                          </td>
                          <td className="text-center px-2 py-3 text-gray-400">→</td>
                          <td className="text-center px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${PLAN_STYLES[c.new_plan] || PLAN_STYLES.free}`}>{PLAN_LABELS[c.new_plan] || c.new_plan}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${c.changed_by === 'system' ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                              {c.changed_by === 'system' ? '자동' : '관리자'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7행: 상위 사용자 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">상위 사용자 TOP 10 <span className="text-gray-400 font-normal">(누적 사용량 기준)</span></h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500 w-10">#</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">이름</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500">이메일</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-gray-500">등급</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-gray-500">사용량</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 w-48"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">사용 기록이 없습니다.</td>
                      </tr>
                    ) : (
                      stats.topUsers.map((user, i) => {
                        const maxTotal = stats.topUsers[0]?.total || 1;
                        const rankColor = i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300';
                        return (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className={`text-center px-4 py-3 font-extrabold text-base tabular-nums ${rankColor}`}>{i + 1}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{user.name}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                            <td className="text-center px-4 py-3">
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${PLAN_STYLES[user.plan] || PLAN_STYLES.free}`}>
                                {user.plan === 'admin' ? '관리자' : user.plan === 'free' ? '무료' : user.plan.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-right px-4 py-3">
                              <span className="text-sm font-extrabold text-indigo-600 tabular-nums">{user.total.toLocaleString()}</span>
                              <span className="text-[10px] text-indigo-400 font-semibold ml-0.5">회</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all" style={{ width: `${(user.total / maxTotal) * 100}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
