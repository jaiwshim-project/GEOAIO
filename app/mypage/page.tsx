'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase-client';
import { getUserPlan, getUsageSummary, type PlanType, type FeatureType, FEATURE_LABELS } from '@/lib/usage';
import type { User } from '@supabase/supabase-js';

const PLAN_LABELS: Record<PlanType, { name: string; color: string; bg: string; border: string }> = {
  admin: { name: '관리자', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  free: { name: '무료', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
  tester: { name: '테스터', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  pro: { name: 'PRO', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  max: { name: 'MAX', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
};

const quickActions = [
  { href: '/analyze', label: '콘텐츠 분석', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'from-sky-500 to-blue-600' },
  { href: '/generate', label: '콘텐츠 생성', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'from-emerald-500 to-teal-600' },
  { href: '/keyword-analysis', label: '키워드 분석', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'from-amber-500 to-orange-600' },
  { href: '/series', label: '시리즈 기획', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'from-violet-500 to-purple-600' },
];

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<PlanType>('free');
  const [usage, setUsage] = useState<{ feature: FeatureType; label: string; current: number; limit: number }[]>([]);
  const [cumulative, setCumulative] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        const [planData, usageData] = await Promise.all([
          getUserPlan(),
          getUsageSummary(),
        ]);
        setPlan(planData);
        setUsage(usageData);

        // 누적 사용량
        const { data: cumulativeData } = await supabase
          .from('usage_counts')
          .select('feature, count')
          .eq('user_id', user.id);

        if (cumulativeData) {
          const totals: Record<string, number> = {};
          cumulativeData.forEach((row: { feature: string; count: number }) => {
            totals[row.feature] = (totals[row.feature] || 0) + row.count;
          });
          setCumulative(totals);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const totalCumulative = Object.values(cumulative).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* 사용자 정보 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">내 정보</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {(user?.user_metadata?.full_name || user?.email?.charAt(0) || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자'}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${PLAN_LABELS[plan].color} ${PLAN_LABELS[plan].bg} ${PLAN_LABELS[plan].border}`}>
                        {PLAN_LABELS[plan].name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      가입일: {user?.created_at ? formatDate(user.created_at) : '-'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href="/pricing"
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      요금제
                    </Link>
                    <Link
                      href="/change-password"
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      비밀번호 변경
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 이번 달 사용량 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">이번 달 사용량</h2>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${PLAN_LABELS[plan].color} ${PLAN_LABELS[plan].bg} ${PLAN_LABELS[plan].border}`}>
                    {PLAN_LABELS[plan].name}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usage.map((u) => {
                    const isAdmin = plan === 'admin';
                    const percentage = isAdmin ? 0 : Math.min((u.current / u.limit) * 100, 100);
                    const isOver = !isAdmin && u.current >= u.limit;
                    const isWarning = !isAdmin && !isOver && percentage >= 80;
                    const barColor = isAdmin ? 'bg-indigo-500' : isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500';

                    return (
                      <div key={u.feature} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-700">{u.label}</span>
                          <span className={`text-xs font-bold tabular-nums ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                            {u.current}
                            <span className="text-gray-400 font-normal">
                              {isAdmin ? ' / 무제한' : ` / ${u.limit}회`}
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-colors ${barColor}`}
                            style={{ width: isAdmin ? '100%' : `${percentage}%` }}
                          />
                        </div>
                        {isOver && (
                          <p className="text-[10px] text-red-500 mt-1">이번 달 사용 한도를 초과했습니다</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 누적 사용량 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">누적 사용량</h2>
                  <span className="text-[10px] text-gray-400">전체 기간</span>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['analyze', 'generate', 'keyword', 'series'] as FeatureType[]).map((feature) => {
                    const count = cumulative[feature] || 0;
                    return (
                      <div key={feature} className="text-center bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                        <p className="text-xl font-bold text-gray-900 tabular-nums">{count}<span className="text-xs text-gray-400 font-normal ml-0.5">회</span></p>
                        <p className="text-[10px] text-gray-500 mt-1">{FEATURE_LABELS[feature]}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                  <span className="text-xs text-indigo-600 font-medium">총 누적 사용</span>
                  <span className="text-sm font-bold text-indigo-700 tabular-nums">{totalCumulative}회</span>
                </div>
              </div>
            </div>

            {/* 빠른 실행 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">빠른 실행</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
                    >
                      <div className={`w-9 h-9 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
