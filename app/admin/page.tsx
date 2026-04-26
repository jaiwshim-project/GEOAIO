'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getUserPlan } from '@/lib/usage';

interface PlanHistoryEntry {
  old_plan: string;
  new_plan: string;
  changed_at: string;
  changed_by: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  plan: string;
  previous_plan: string | null;
  plan_expires_at: string | null;
  plan_history: PlanHistoryEntry[];
  usage: {
    analyze: number;
    generate: number;
    keyword: number;
    series: number;
  };
  totalUsage: {
    analyze: number;
    generate: number;
    keyword: number;
    series: number;
  };
}

const PLAN_OPTIONS = [
  { value: 'admin', label: '관리자', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'free', label: '무료', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'tester', label: '테스터', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'pro', label: '프로', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'max', label: '맥스', color: 'bg-violet-100 text-violet-700 border-violet-300' },
];

function getPlanBadge(plan: string) {
  const opt = PLAN_OPTIONS.find(o => o.value === plan);
  return opt || { value: plan, label: plan, color: 'bg-gray-100 text-gray-700 border-gray-300' };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getExpiryStatus(expiresAt: string | null) {
  if (!expiresAt) return { label: '-', color: 'text-gray-400', dot: 'bg-gray-300', dday: '' };
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: '만료됨', color: 'text-red-600', dot: 'bg-red-500', dday: `D+${Math.abs(diffDays)}` };
  if (diffDays <= 2) return { label: '2일 이내', color: 'text-red-600', dot: 'bg-red-500', dday: `D-${diffDays}` };
  if (diffDays <= 5) return { label: '5일 이내', color: 'text-green-600', dot: 'bg-green-500', dday: `D-${diffDays}` };
  if (diffDays <= 7) return { label: '7일 이내', color: 'text-blue-600', dot: 'bg-blue-500', dday: `D-${diffDays}` };
  return { label: '정상', color: 'text-gray-500', dot: 'bg-gray-400', dday: `D-${diffDays}` };
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions' | 'contents' | 'api-keys'>('subscriptions');
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordChecking, setPasswordChecking] = useState(false);

  // API 키 관리
  const [geminApiKey, setGeminApiKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [geoAioApiKey, setGeoAioApiKey] = useState('');
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState('');

  // 프로젝트 집계 (등급 관리 탭 + 콘텐츠 현황 탭 공용)
  type AdminProject = { id: string; user_id: string; name: string; description: string | null; created_at: string; content_count: number };
  const [allProjects, setAllProjects] = useState<AdminProject[]>([]);
  const [expandedUserProjects, setExpandedUserProjects] = useState<string | null>(null);

  // CEP 코호트 통계 (분대 Golf의 /api/admin/cep-stats)
  type CepStats = {
    period_days: number;
    total_generations: number;
    cep_applied: number;
    cep_skipped: number;
    adoption_rate: number;
    top_cep_keywords: { keyword: string; count: number }[];
    daily_trend: { date: string; cep: number; total: number }[];
  };
  const [cepStats, setCepStats] = useState<CepStats | null>(null);
  const [cepStatsLoading, setCepStatsLoading] = useState(false);
  const [cepStatsError, setCepStatsError] = useState('');

  const loadCepStats = async (pw?: string) => {
    const password = pw || sessionStorage.getItem('admin_pw') || '';
    if (!password) return;
    setCepStatsLoading(true);
    setCepStatsError('');
    try {
      const res = await fetch('/api/admin/cep-stats?days=14', {
        method: 'POST',
        headers: {
          'X-Admin-Pass': password,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `조회 실패 (${res.status})`);
      }
      const data: CepStats = await res.json();
      setCepStats(data);
    } catch (err) {
      setCepStatsError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setCepStatsLoading(false);
    }
  };

  const loadAllProjects = async (pw?: string) => {
    const password = pw || sessionStorage.getItem('admin_pw') || '';
    try {
      const res = await fetch('/api/admin/projects', {
        headers: password ? { 'X-Admin-Password': password } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data.projects || []);
      }
    } catch { /* ignore */ }
  };

  // 콘텐츠 현황 탭
  type ContentItem = { id: string; title: string; topic: string; category: string; is_ab: boolean; selected_ab_index: number; created_at: string };
  type Project = { id: string; name: string; description: string | null };
  const [contentUserId, setContentUserId] = useState<string>('');
  const [contentProjects, setContentProjects] = useState<Project[]>([]);
  const [contentProjectId, setContentProjectId] = useState<string>('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentProjectsLoading, setContentProjectsLoading] = useState(false);
  const [contentItemsLoading, setContentItemsLoading] = useState(false);

  const loadContentProjects = async (userId: string) => {
    if (!userId) return;
    setContentProjectsLoading(true);
    setContentProjects([]);
    setContentProjectId('');
    setContentItems([]);
    try {
      const res = await fetch(`/api/user-projects?user_id=${userId}`);
      const data = await res.json();
      setContentProjects(data.projects || []);
    } catch { /* ignore */ } finally {
      setContentProjectsLoading(false);
    }
  };

  const loadContentItems = async (projectId: string) => {
    if (!projectId) return;
    setContentItemsLoading(true);
    setContentItems([]);
    try {
      const res = await fetch(`/api/generate-results?project_id=${projectId}`);
      const data = await res.json();
      setContentItems(data.items || []);
    } catch { /* ignore */ } finally {
      setContentItemsLoading(false);
    }
  };

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
            loadUsers(savedPw);
            loadAllProjects(savedPw);
            loadCepStats(savedPw);
            setAuthChecking(false);
            return;
          }
        }
        const plan = await getUserPlan();
        if (plan === 'admin') {
          setAuthenticated(true);
          loadUsers();
          loadAllProjects();
          loadCepStats();
        }
      } catch {
        // not logged in
      } finally {
        setAuthChecking(false);
      }
    };
    checkAdmin();
  }, []);

  const loadUsers = async (pw?: string) => {
    setLoading(true);
    setError('');
    const password = pw || sessionStorage.getItem('admin_pw') || '';
    try {
      const res = await fetch('/api/admin/users', {
        headers: password ? { 'X-Admin-Password': password } : {},
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '조회 실패');
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!adminPassword.trim()) return;
    setPasswordChecking(true);
    setPasswordError('');
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        sessionStorage.setItem('admin_pw', adminPassword);
        setAuthenticated(true);
        loadUsers(adminPassword);
        loadAllProjects(adminPassword);
        loadCepStats(adminPassword);
      } else {
        const data = await res.json();
        setPasswordError(data.error || '비밀번호가 틀렸습니다.');
      }
    } catch {
      setPasswordError('오류가 발생했습니다.');
    } finally {
      setPasswordChecking(false);
    }
  };

  const handlePlanChange = async (userId: string, newPlan: string) => {
    setUpdatingUser(userId);
    try {
      const password = sessionStorage.getItem('admin_pw') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['X-Admin-Password'] = password;
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, plan: newPlan }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '변경 실패');
      }
      // 유료 플랜이면 만료일도 반영
      const newExpiresAt = (newPlan === 'pro' || newPlan === 'max')
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, plan: newPlan, plan_expires_at: newExpiresAt } : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleNameChange = async (userId: string, newName: string) => {
    setUpdatingUser(userId);
    try {
      const password = sessionStorage.getItem('admin_pw') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['X-Admin-Password'] = password;
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, name: newName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '변경 실패');
      }
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, name: newName } : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setUpdatingUser(null);
      setEditingName(null);
    }
  };

  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const handleSendExpiryNotice = async (user: UserData) => {
    if (!user.plan_expires_at) {
      alert('만료일 정보가 없습니다.');
      return;
    }
    const now = new Date();
    const exp = new Date(user.plan_expires_at);
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (!confirm(`${user.name || user.email}님에게 만료 안내 이메일을 발송하시겠습니까?\n\n등급: ${user.plan === 'pro' ? '프로' : '맥스'}\n만료일: ${formatDate(user.plan_expires_at).split(' ')[0]}\nD-day: ${daysLeft < 0 ? `D+${Math.abs(daysLeft)}` : `D-${daysLeft}`}`)) {
      return;
    }

    setSendingEmail(user.id);
    try {
      const password = sessionStorage.getItem('admin_pw') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['X-Admin-Password'] = password;
      const res = await fetch('/api/admin/send-expiry-notice', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          plan: user.plan,
          expiresAt: user.plan_expires_at,
          daysLeft,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '발송 실패');
      }
      alert(`✅ ${user.email}로 만료 안내 이메일을 발송했습니다.`);
    } catch (err) {
      alert(`❌ 발송 실패: ${err instanceof Error ? err.message : '오류 발생'}`);
    } finally {
      setSendingEmail(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRenew = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const password = sessionStorage.getItem('admin_pw') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['X-Admin-Password'] = password;
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '갱신 실패');
      }
      const data = await res.json();
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, plan_expires_at: data.newExpiresAt } : u)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setUpdatingUser(null);
    }
  };

  const subscriptionAlerts = useMemo(() => {
    const now = new Date();
    const paidUsers = users.filter(u => ['pro', 'max'].includes(u.plan) && u.plan_expires_at);
    const expired = paidUsers.filter(u => new Date(u.plan_expires_at!) < now);
    const within3Days = paidUsers.filter(u => {
      const diff = Math.ceil((new Date(u.plan_expires_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 3;
    });
    const within7Days = paidUsers.filter(u => {
      const diff = Math.ceil((new Date(u.plan_expires_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 3 && diff <= 7;
    });
    return { expired, within3Days, within7Days };
  }, [users]);

  const alertCount = subscriptionAlerts.expired.length + subscriptionAlerts.within3Days.length;

  // 다운그레이드된 사용자 (이전에 유료였던 free 사용자)
  const downgradedUsers = useMemo(() => {
    return users.filter(u => u.plan === 'free' && u.previous_plan && ['pro', 'max'].includes(u.previous_plan));
  }, [users]);

  const subscriptionUsers = useMemo(() => {
    return users
      .filter(u => ['pro', 'max'].includes(u.plan))
      .sort((a, b) => {
        const aExp = a.plan_expires_at ? new Date(a.plan_expires_at).getTime() : Infinity;
        const bExp = b.plan_expires_at ? new Date(b.plan_expires_at).getTime() : Infinity;
        return aExp - bExp;
      });
  }, [users]);

  const testerUsers = useMemo(() => {
    return users
      .filter(u => u.plan === 'tester')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [users]);

  const freeUsers = useMemo(() => {
    return users
      .filter(u => u.plan === 'free' && !(u.previous_plan && ['pro', 'max'].includes(u.previous_plan)))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [users]);

  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const planStats = {
    total: users.length,
    admin: users.filter(u => u.plan === 'admin').length,
    free: users.filter(u => u.plan === 'free').length,
    tester: users.filter(u => u.plan === 'tester').length,
    pro: users.filter(u => u.plan === 'pro').length,
    max: users.filter(u => u.plan === 'max').length,
  };

  // 인증 확인 중
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

  // 권한 없음 → 비밀번호 입력 화면
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">관리자 대시보드</h2>
              <p className="text-sm text-gray-500 mt-1">관리자 비밀번호를 입력해주세요.</p>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={adminPassword}
                onChange={e => { setAdminPassword(e.target.value); setPasswordError(''); }}
                onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder="관리자 비밀번호"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              <button
                onClick={handlePasswordLogin}
                disabled={passwordChecking || !adminPassword.trim()}
                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {passwordChecking ? '확인 중...' : '접속'}
              </button>
              <Link href="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-2">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 관리자 대시보드
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

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500">전체 회원</p>
            <p className="text-2xl font-bold text-gray-900">{planStats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
            <p className="text-xs font-medium text-red-500">관리자</p>
            <p className="text-2xl font-bold text-red-600">{planStats.admin}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500">무료</p>
            <p className="text-2xl font-bold text-gray-600">{planStats.free}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
            <p className="text-xs font-medium text-blue-500">프로</p>
            <p className="text-2xl font-bold text-blue-600">{planStats.pro}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
            <p className="text-xs font-medium text-emerald-500">테스터</p>
            <p className="text-2xl font-bold text-emerald-600">{planStats.tester}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-violet-200 shadow-sm">
            <p className="text-xs font-medium text-violet-500">맥스</p>
            <p className="text-2xl font-bold text-violet-600">{planStats.max}</p>
          </div>
        </div>

        {/* CEP 코호트 카드 */}
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
              <span>🎯</span>
              <span>CEP 위저드 도입 코호트 (최근 14일)</span>
            </h2>
            <button
              onClick={() => loadCepStats()}
              disabled={cepStatsLoading}
              className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-all disabled:opacity-50"
            >
              {cepStatsLoading ? '불러오는 중...' : '새로고침'}
            </button>
          </div>

          {cepStatsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-xs text-red-700">
              {cepStatsError}
            </div>
          )}

          {cepStatsLoading && !cepStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-purple-700">CEP 통계 불러오는 중...</span>
            </div>
          ) : !cepStats ? (
            <div className="text-center py-10 text-sm text-purple-400">
              CEP 통계 데이터가 아직 없습니다.
            </div>
          ) : (
            <>
              {/* KPI 3개 박스 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-xl border border-purple-200 p-4">
                  <p className="text-3xl font-bold text-purple-700">
                    {(cepStats.adoption_rate * 100).toFixed(1)}
                    <span className="text-lg text-purple-400 font-semibold">%</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CEP 적용률 (Adoption Rate)</p>
                </div>
                <div className="bg-white rounded-xl border border-purple-200 p-4">
                  <p className="text-3xl font-bold text-indigo-700">
                    {cepStats.cep_applied.toLocaleString()}
                    <span className="text-base text-gray-400 font-semibold"> / {cepStats.total_generations.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CEP 적용 / 전체 생성</p>
                </div>
                <div className="bg-white rounded-xl border border-purple-200 p-4">
                  <p className="text-3xl font-bold text-slate-600">
                    {cepStats.cep_skipped.toLocaleString()}
                    <span className="text-base text-gray-400 font-semibold"> / {cepStats.total_generations.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CEP 미적용 / 전체 생성</p>
                </div>
              </div>

              {/* 일별 추이 막대 그래프 */}
              <div className="bg-white rounded-xl border border-purple-200 p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">일별 추이 (CEP / 전체)</h3>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> CEP
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> 전체
                    </span>
                  </div>
                </div>
                {cepStats.daily_trend.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400">데이터가 없습니다.</p>
                ) : (
                  (() => {
                    const maxTotal = Math.max(1, ...cepStats.daily_trend.map(d => d.total));
                    return (
                      <div className="flex items-end gap-1 h-32">
                        {cepStats.daily_trend.map((d, i) => {
                          const totalPct = (d.total / maxTotal) * 100;
                          const cepPct = (d.cep / maxTotal) * 100;
                          const dayLabel = d.date?.slice(5) || '';
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date} · CEP ${d.cep}/${d.total}`}>
                              <div className="relative w-full flex-1 flex items-end">
                                <div className="absolute bottom-0 left-0 right-0 bg-slate-300 rounded-t" style={{ height: `${totalPct}%` }} />
                                <div className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-t" style={{ height: `${cepPct}%` }} />
                              </div>
                              <span className="text-[9px] text-gray-400">{dayLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Top CEP 키워드 칩 */}
              <div className="bg-white rounded-xl border border-purple-200 p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Top CEP 키워드 (상위 10개)</h3>
                {cepStats.top_cep_keywords.length === 0 ? (
                  <p className="text-center py-3 text-xs text-gray-400">키워드 데이터가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cepStats.top_cep_keywords.slice(0, 10).map((k, i) => (
                      <span
                        key={`${k.keyword}-${i}`}
                        className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-purple-200"
                      >
                        {k.keyword} ({k.count}회)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 폴더 탭 */}
        <div className="flex items-end gap-0 mb-0">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`relative px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-white text-indigo-700 border-t-indigo-500 border-l-gray-300 border-r-gray-300 border-b-0 z-10 -mb-px'
                : 'bg-gray-100 text-gray-500 border-t-transparent border-l-gray-200 border-r-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            구독 관리
            {alertCount > 0 && (
              <span className="absolute -top-2 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r transition-all ${
              activeTab === 'users'
                ? 'bg-white text-emerald-700 border-t-emerald-500 border-l-gray-300 border-r-gray-300 border-b-0 z-10 -mb-px'
                : 'bg-gray-100 text-gray-500 border-t-transparent border-l-gray-200 border-r-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            등급 관리
          </button>
          <button
            onClick={() => setActiveTab('contents')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r transition-all ${
              activeTab === 'contents'
                ? 'bg-white text-violet-700 border-t-violet-500 border-l-gray-300 border-r-gray-300 border-b-0 z-10 -mb-px'
                : 'bg-gray-100 text-gray-500 border-t-transparent border-l-gray-200 border-r-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            콘텐츠 현황
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r transition-all ${
              activeTab === 'api-keys'
                ? 'bg-white text-amber-700 border-t-amber-500 border-l-gray-300 border-r-gray-300 border-b-0 z-10 -mb-px'
                : 'bg-gray-100 text-gray-500 border-t-transparent border-l-gray-200 border-r-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            🔑 API 키 관리
          </button>
          <Link
            href="/admin/stats"
            className="px-5 py-2.5 text-sm font-semibold rounded-t-lg border-t-2 border-l border-r transition-all bg-gray-100 text-gray-500 border-t-transparent border-l-gray-200 border-r-gray-200 hover:bg-gray-50 hover:text-gray-700"
          >
            통계 관리
          </Link>
          <div className="flex-1 border-b border-gray-300" />
        </div>
        <div className="border-l border-r border-b border-gray-300 rounded-b-lg bg-white p-5 mb-5">

        {activeTab === 'subscriptions' && (
          <>
            {/* 구독 알림 카드 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <p className="text-xs font-medium text-red-600">만료됨</p>
                </div>
                <p className="text-2xl font-bold text-red-700">{subscriptionAlerts.expired.length}명</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <p className="text-xs font-medium text-orange-600">3일 이내</p>
                </div>
                <p className="text-2xl font-bold text-orange-700">{subscriptionAlerts.within3Days.length}명</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <p className="text-xs font-medium text-yellow-600">7일 이내</p>
                </div>
                <p className="text-2xl font-bold text-yellow-700">{subscriptionAlerts.within7Days.length}명</p>
              </div>
            </div>

            {/* 구독 사용자 테이블 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-5">
              <h3 className="px-4 py-3 text-sm font-bold text-gray-700 border-b border-gray-200 bg-gray-50">현재 유료 구독자</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">이름</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">이메일</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">이전 등급</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">현재 등급</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">만료일</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">상태</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">D-day</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-400">유료 구독 사용자가 없습니다.</td>
                      </tr>
                    ) : (
                      subscriptionUsers.map((user) => {
                        const badge = getPlanBadge(user.plan);
                        const prevBadge = user.previous_plan ? getPlanBadge(user.previous_plan) : null;
                        const status = getExpiryStatus(user.plan_expires_at);
                        return (
                          <>
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{user.name || <span className="text-gray-400 italic">이름 없음</span>}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                            <td className="text-center px-4 py-3">
                              {prevBadge ? (
                                <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${prevBadge.color}`}>{prevBadge.label}</span>
                              ) : <span className="text-gray-300 text-xs">-</span>}
                            </td>
                            <td className="text-center px-4 py-3">
                              <select
                                value={user.plan}
                                onChange={(e) => handlePlanChange(user.id, e.target.value)}
                                disabled={updatingUser === user.id}
                                className={`px-2.5 py-1 text-xs font-bold rounded-full border ${badge.color} focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${
                                  updatingUser === user.id ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-1 hover:ring-indigo-300'
                                }`}
                                title="등급 변경"
                              >
                                {PLAN_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="text-center px-4 py-3 text-xs text-gray-600">
                              {user.plan_expires_at ? formatDate(user.plan_expires_at).split(' ')[0] : '-'}
                            </td>
                            <td className="text-center px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${status.color}`}>
                                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                            </td>
                            <td className="text-center px-4 py-3">
                              <span className={`text-xs font-bold ${status.color}`}>{status.dday}</span>
                            </td>
                            <td className="text-center px-4 py-3">
                              <div className="flex items-center gap-1 justify-center flex-wrap">
                                <button
                                  onClick={() => handleRenew(user.id)}
                                  disabled={updatingUser === user.id}
                                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
                                >
                                  {updatingUser === user.id ? '...' : '30일 연장'}
                                </button>
                                <button
                                  onClick={() => handleSendExpiryNotice(user)}
                                  disabled={sendingEmail === user.id}
                                  className="px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all disabled:opacity-50"
                                  title="등급 만료일 안내 및 유지 방법 이메일 발송"
                                >
                                  {sendingEmail === user.id ? '발송중...' : '만료 안내'}
                                </button>
                                <button
                                  onClick={() => setExpandedHistory(expandedHistory === user.id ? null : user.id)}
                                  className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                                  title="등급 변경 히스토리"
                                >
                                  {expandedHistory === user.id ? '접기' : '이력'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedHistory === user.id && (
                            <tr key={`${user.id}-history`}>
                              <td colSpan={8} className="px-4 py-3 bg-gray-50">
                                <div className="text-xs">
                                  <p className="font-semibold text-gray-700 mb-2">등급 변경 히스토리</p>
                                  {user.plan_history.length === 0 ? (
                                    <p className="text-gray-400">변경 이력이 없습니다.</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {user.plan_history.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 text-gray-600">
                                          <span className="text-gray-400 w-32">{formatDate(h.changed_at)}</span>
                                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getPlanBadge(h.old_plan).color}`}>{getPlanBadge(h.old_plan).label}</span>
                                          <span className="text-gray-400">→</span>
                                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getPlanBadge(h.new_plan).color}`}>{getPlanBadge(h.new_plan).label}</span>
                                          <span className="text-gray-400">({h.changed_by === 'system' ? '자동' : '관리자'})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 다운그레이드된 사용자 (이전 유료 → 현재 무료) */}
            {downgradedUsers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden mb-5">
                <h3 className="px-4 py-3 text-sm font-bold text-orange-700 border-b border-orange-200 bg-orange-50">만료 후 다운그레이드된 사용자</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-orange-50/50 border-b-2 border-orange-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">이름</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">이메일</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">이전 등급</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">현재 등급</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downgradedUsers.map(user => {
                        const prevBadge = getPlanBadge(user.previous_plan!);
                        return (
                          <>
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{user.name || <span className="text-gray-400 italic">이름 없음</span>}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                            <td className="text-center px-4 py-3">
                              <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${prevBadge.color}`}>{prevBadge.label}</span>
                            </td>
                            <td className="text-center px-4 py-3">
                              <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-gray-100 text-gray-700 border-gray-300">무료</span>
                            </td>
                            <td className="text-center px-4 py-3">
                              <div className="flex items-center gap-1 justify-center">
                                <button
                                  onClick={() => handlePlanChange(user.id, user.previous_plan!)}
                                  disabled={updatingUser === user.id}
                                  className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-50"
                                >
                                  {updatingUser === user.id ? '...' : `${prevBadge.label}로 복원`}
                                </button>
                                <button
                                  onClick={() => setExpandedHistory(expandedHistory === user.id ? null : user.id)}
                                  className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                                >
                                  {expandedHistory === user.id ? '접기' : '이력'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedHistory === user.id && (
                            <tr key={`${user.id}-history`}>
                              <td colSpan={5} className="px-4 py-3 bg-gray-50">
                                <div className="text-xs">
                                  <p className="font-semibold text-gray-700 mb-2">등급 변경 히스토리</p>
                                  {user.plan_history.length === 0 ? (
                                    <p className="text-gray-400">변경 이력이 없습니다.</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {user.plan_history.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 text-gray-600">
                                          <span className="text-gray-400 w-32">{formatDate(h.changed_at)}</span>
                                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getPlanBadge(h.old_plan).color}`}>{getPlanBadge(h.old_plan).label}</span>
                                          <span className="text-gray-400">→</span>
                                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getPlanBadge(h.new_plan).color}`}>{getPlanBadge(h.new_plan).label}</span>
                                          <span className="text-gray-400">({h.changed_by === 'system' ? '자동' : '관리자'})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 테스터 구독자 목록 */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden mb-5">
              <h3 className="px-4 py-3 text-sm font-bold text-emerald-700 border-b border-emerald-200 bg-emerald-50">
                테스터 구독자
                <span className="ml-2 text-xs font-normal text-emerald-400">({testerUsers.length}명)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-emerald-50/50 border-b-2 border-emerald-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">이름</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">이메일</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">등급</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">가입일</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">최근 로그인</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">이번 달 사용량</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testerUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">테스터 구독자가 없습니다.</td>
                      </tr>
                    ) : (
                      testerUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{user.name || <span className="text-gray-400 italic">이름 없음</span>}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                          <td className="text-center px-4 py-3">
                            <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-emerald-100 text-emerald-700 border-emerald-300">테스터</span>
                          </td>
                          <td className="text-center px-4 py-3 text-xs text-gray-600">{formatDate(user.created_at).split(' ')[0]}</td>
                          <td className="text-center px-4 py-3 text-xs text-gray-600">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '-'}</td>
                          <td className="text-center px-4 py-3 text-xs text-gray-500">
                            {user.usage.analyze + user.usage.generate + user.usage.keyword + user.usage.series > 0 ? (
                              <span>분석 {user.usage.analyze} · 생성 {user.usage.generate} · 키워드 {user.usage.keyword} · 시리즈 {user.usage.series}</span>
                            ) : (
                              <span className="text-gray-300">사용 없음</span>
                            )}
                          </td>
                          <td className="text-center px-4 py-3">
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => handlePlanChange(user.id, 'pro')}
                                disabled={updatingUser === user.id}
                                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
                              >
                                {updatingUser === user.id ? '...' : '프로 전환'}
                              </button>
                              <button
                                onClick={() => handlePlanChange(user.id, 'free')}
                                disabled={updatingUser === user.id}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                              >
                                {updatingUser === user.id ? '...' : '해제'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 무료 구독자 목록 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-5">
              <h3 className="px-4 py-3 text-sm font-bold text-gray-700 border-b border-gray-200 bg-gray-50">
                무료 구독자
                <span className="ml-2 text-xs font-normal text-gray-400">({freeUsers.length}명)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">이름</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">이메일</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">등급</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">가입일</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">최근 로그인</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">이번 달 사용량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freeUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">무료 구독자가 없습니다.</td>
                      </tr>
                    ) : (
                      freeUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{user.name || <span className="text-gray-400 italic">이름 없음</span>}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                          <td className="text-center px-4 py-3">
                            <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-full border bg-gray-100 text-gray-700 border-gray-300">무료</span>
                          </td>
                          <td className="text-center px-4 py-3 text-xs text-gray-600">{formatDate(user.created_at).split(' ')[0]}</td>
                          <td className="text-center px-4 py-3 text-xs text-gray-600">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '-'}</td>
                          <td className="text-center px-4 py-3 text-xs text-gray-500">
                            {user.usage.analyze + user.usage.generate + user.usage.keyword + user.usage.series > 0 ? (
                              <span>분석 {user.usage.analyze} · 생성 {user.usage.generate} · 키워드 {user.usage.keyword} · 시리즈 {user.usage.series}</span>
                            ) : (
                              <span className="text-gray-300">사용 없음</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'contents' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 왼쪽 카드: 회원 선택 + 프로젝트 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  회원 · 프로젝트
                </h3>

                {/* 회원 선택 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">회원 선택</label>
                  <select
                    value={contentUserId}
                    onChange={(e) => {
                      setContentUserId(e.target.value);
                      setContentProjectId('');
                      setContentItems([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="">-- 회원을 선택하세요 --</option>
                    {users.map(u => {
                      const projCount = allProjects.filter(p => p.user_id === u.id).length;
                      const totalContent = allProjects.filter(p => p.user_id === u.id).reduce((sum, p) => sum + p.content_count, 0);
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name || '(이름 없음)'} · {u.email} [{getPlanBadge(u.plan).label}] — 프로젝트 {projCount}개 / 콘텐츠 {totalContent}건
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 프로젝트 목록 */}
                {contentUserId && (() => {
                  const userProjList = allProjects.filter(p => p.user_id === contentUserId);
                  return (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      프로젝트 <span className="text-gray-400">({userProjList.length}개)</span>
                    </label>
                    {userProjList.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">등록된 프로젝트가 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {userProjList.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setContentProjectId(p.id);
                              loadContentItems(p.id);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              contentProjectId === p.id
                                ? 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-400/50'
                                : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700'
                            }`}
                          >
                            {p.name}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              contentProjectId === p.id
                                ? 'bg-white/20 text-white'
                                : p.content_count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-400'
                            }`}>
                              {p.content_count}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>

              {/* 오른쪽 카드: 생성된 콘텐츠 목록 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  생성된 콘텐츠
                  {contentItems.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-gray-400">{contentItems.length}건</span>
                  )}
                </h3>

                {!contentProjectId ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400">회원과 프로젝트를 선택하면<br />생성된 콘텐츠 목록이 표시됩니다.</p>
                  </div>
                ) : contentItemsLoading ? (
                  <p className="text-xs text-gray-400 py-8 text-center">불러오는 중...</p>
                ) : contentItems.length === 0 ? (
                  <p className="text-xs text-gray-400 py-8 text-center">이 프로젝트에 생성된 콘텐츠가 없습니다.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {contentItems.map(item => (
                      <a
                        key={item.id}
                        href={`/generate/result?id=${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-violet-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-violet-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.title || item.topic}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.category && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded font-medium">{item.category}</span>
                          )}
                          <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] rounded font-semibold">
                            5가지 톤
                          </span>
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded">
                            v{(item.selected_ab_index ?? 0) + 1}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔑</span>
                AI API 키 관리
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                각 AI 제공자의 API 키를 등록하세요. Vercel 환경변수 또는 로컬 저장소에 저장됩니다.
              </p>

              {apiKeyMessage && (
                <div className={`mb-4 p-3 rounded-lg ${apiKeyMessage.includes('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  <p className="text-sm font-medium">{apiKeyMessage}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {/* Google Gemini */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🌐 Google Gemini API 키
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={geminApiKey}
                      onChange={(e) => setGeminApiKey(e.target.value)}
                      placeholder="AIzaSy... (Gemini API 키)"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      발급받기
                    </a>
                  </div>
                </div>

                {/* Claude API */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🧠 Claude API 키
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={claudeApiKey}
                      onChange={(e) => setClaudeApiKey(e.target.value)}
                      placeholder="sk-ant-... (Claude API 키)"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      발급받기
                    </a>
                  </div>
                </div>

                {/* Geo-AIO API */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ⚡ Geo-AIO API 키
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={geoAioApiKey}
                      onChange={(e) => setGeoAioApiKey(e.target.value)}
                      placeholder="Geo-AIO API 키"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                    <a
                      href="https://www.geo-aio.com/generate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      발급받기
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setApiKeySaving(true);
                    setApiKeyMessage('');
                    try {
                      // localStorage에 저장
                      const keys = { gemini: geminApiKey, claude: claudeApiKey, geoAio: geoAioApiKey };
                      localStorage.setItem('ai_keys_v1', JSON.stringify(keys));
                      setApiKeyMessage('✅ API 키가 로컬 저장소에 저장되었습니다');
                    } catch (e) {
                      setApiKeyMessage(`❌ 저장 실패: ${e instanceof Error ? e.message : '오류 발생'}`);
                    } finally {
                      setApiKeySaving(false);
                    }
                  }}
                  disabled={apiKeySaving || (!geminApiKey && !claudeApiKey && !geoAioApiKey)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  {apiKeySaving ? '저장 중...' : '💾 로컬 저장'}
                </button>
                <button
                  onClick={async () => {
                    if (confirm('저장된 모든 API 키를 삭제하시겠습니까?')) {
                      localStorage.removeItem('ai_keys_v1');
                      setGeminApiKey('');
                      setClaudeApiKey('');
                      setGeoAioApiKey('');
                      setApiKeyMessage('✅ API 키가 삭제되었습니다');
                    }
                  }}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>

            {/* Vercel 환경변수 안내 */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                </svg>
                Vercel 배포 환경변수 설정
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                배포된 애플리케이션에서 API 키를 사용하려면 Vercel CLI를 통해 환경변수를 등록하세요:
              </p>
              <div className="bg-blue-900 text-blue-100 rounded-lg p-3 text-xs font-mono space-y-2 mb-3">
                <div>vercel env add GEMINI_API_KEY</div>
                <div>vercel env add CLAUDE_API_KEY</div>
                <div>vercel env add GEO_AIO_API_KEY</div>
              </div>
              <p className="text-xs text-blue-600">
                또는 <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Vercel 대시보드</a>에서 직접 설정할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (<>
        {/* 검색 + 새로고침 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => loadUsers()}
            disabled={loading}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* 회원 목록 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">이름</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">이메일</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">등급</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">등급 변경</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">
                    <div>분석</div>
                    <div className="text-[10px] font-normal text-gray-400">누적/이번달</div>
                  </th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">
                    <div>생성</div>
                    <div className="text-[10px] font-normal text-gray-400">누적/이번달</div>
                  </th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">
                    <div>키워드</div>
                    <div className="text-[10px] font-normal text-gray-400">누적/이번달</div>
                  </th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">
                    <div>시리즈</div>
                    <div className="text-[10px] font-normal text-gray-400">누적/이번달</div>
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">가입일</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">최근 로그인</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">프로젝트</th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      <svg className="w-6 h-6 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      회원 목록 로딩 중...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      {searchTerm ? '검색 결과가 없습니다.' : '회원이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const badge = getPlanBadge(user.plan);
                    const userProjects = allProjects.filter(p => p.user_id === user.id);
                    const isProjectExpanded = expandedUserProjects === user.id;
                    return (
                      <>
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          {editingName === user.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleNameChange(user.id, editNameValue);
                                  if (e.key === 'Escape') setEditingName(null);
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                autoFocus
                              />
                              <button
                                onClick={() => handleNameChange(user.id, editNameValue)}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingName(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span
                              className="font-medium text-gray-800 cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => { setEditingName(user.id); setEditNameValue(user.name || ''); }}
                              title="클릭하여 이름 수정"
                            >
                              {user.name || <span className="text-gray-400 italic">이름 없음</span>}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-600 text-xs">{user.email}</span>
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="text-center px-4 py-3">
                          <select
                            value={user.plan}
                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                            disabled={updatingUser === user.id}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${
                              updatingUser === user.id ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-indigo-300'
                            }`}
                          >
                            {PLAN_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        {(['analyze', 'generate', 'keyword', 'series'] as const).map(feature => {
                          const total = user.totalUsage?.[feature] || 0;
                          const monthly = user.usage[feature] || 0;
                          return (
                            <td key={feature} className="text-center px-2 py-2.5">
                              <div className="inline-flex flex-col items-center gap-0.5 min-w-[40px]">
                                <span className={`text-sm font-bold tabular-nums ${total > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{total}</span>
                                <span className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${monthly > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-300'}`}>{monthly}</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="text-center px-4 py-3 text-gray-500 text-xs">{formatDate(user.created_at)}</td>
                        <td className="text-center px-4 py-3 text-gray-500 text-xs">{formatDate(user.last_sign_in_at)}</td>
                        <td className="text-center px-4 py-3">
                          {userProjects.length > 0 ? (
                            <button
                              onClick={() => setExpandedUserProjects(isProjectExpanded ? null : user.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              {userProjects.length}개
                              <svg className={`w-3 h-3 transition-transform ${isProjectExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                      {isProjectExpanded && (
                        <tr key={`${user.id}-projects`}>
                          <td colSpan={11} className="px-4 py-3 bg-violet-50/60 border-b border-violet-100">
                            <p className="text-xs font-semibold text-violet-700 mb-2">프로젝트 목록 ({userProjects.length}개)</p>
                            <div className="flex flex-wrap gap-2">
                              {userProjects.map(p => (
                                <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-violet-200 rounded-xl shadow-sm">
                                  <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-gray-800">{p.name}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.content_count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                                    콘텐츠 {p.content_count}건
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>)}
        </div>
      </main>
      <Footer />
    </div>
  );
}
