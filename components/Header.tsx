'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { getUserPlan, type PlanType } from '@/lib/usage';
import ApiKeyModal from '@/components/ApiKeyModal';

const PLAN_LABELS: Record<PlanType, { name: string; style: string }> = {
  admin: { name: '관리자', style: 'bg-red-500 text-white' },
  free: { name: '무료', style: 'bg-gray-200 text-gray-600' },
  tester: { name: '테스터', style: 'bg-emerald-500 text-white' },
  pro: { name: 'PRO', style: 'bg-indigo-500 text-white' },
  max: { name: 'MAX', style: 'bg-violet-500 text-white' },
};

interface HeaderProps {
  showApiKeyButton?: boolean;
  onToggleApiKey?: () => void;
  apiKeyOpen?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

const mainNav: NavItem[] = [
  { href: '/analyze', label: '분석' },
  {
    href: '/generate',
    label: '생성',
    children: [
      { href: '/generate', label: '콘텐츠 생성' },
      { href: '/generate/results', label: '생성 결과' },
    ],
  },
  { href: '/keyword-analysis', label: '키워드' },
  { href: '/series', label: '시리즈' },
  { href: '/dashboard/indexing', label: '색인' },
];

const subNav = [
  { href: '/pricing', label: '요금제' },
  { href: '/resources', label: '자료실' },
  { href: '/community', label: '질문/후기' },
  { href: '/make-integration', label: 'Make 연동' },
  { href: '/blog', label: '블로그' },
  { href: '/proposal', label: '제안서' },
];

export default function Header({ showApiKeyButton = false, onToggleApiKey, apiKeyOpen }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<PlanType>('free');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) getUserPlan().then(setPlan).catch(() => {});
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) getUserPlan().then(setPlan).catch(() => {});
      else setPlan('free');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 border-b border-indigo-700 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* 로고 */}
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/images/logo-geoaio.png" alt="GEOAIO" width={320} height={64} className="h-9 w-auto rounded" quality={100} priority unoptimized />
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center">
            {/* 핵심 기능 */}
            <div className="flex items-center bg-white/15 rounded-lg p-0.5">
              {mainNav.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                if (item.children) {
                  return (
                    <div key={item.href} className="relative group">
                      <Link
                        href={item.href}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          isActive
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {item.label}
                        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Link>
                      <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`block px-4 py-2 text-xs font-medium transition-colors ${
                                childActive
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* 구분선 */}
            <div className="w-px h-5 bg-white/25 mx-3" />

            {/* 부가 메뉴 */}
            {subNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'text-white bg-white/20'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 오른쪽 영역 */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative flex items-center gap-2" ref={userMenuRef}>
                {plan === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-2 py-1 text-[10px] font-bold text-red-100 bg-red-500/30 rounded hover:bg-red-500/50 transition-all"
                  >
                    관리 대시보드
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-white/15 rounded-lg hover:bg-white/25 transition-all"
                >
                  대시보드
                </Link>
                {/* 사용자 버튼 (클릭하면 드롭다운) */}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/15 transition-all"
                >
                  <span className="text-xs text-white font-medium max-w-[100px] truncate">{displayName}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${PLAN_LABELS[plan].style}`}>
                    {PLAN_LABELS[plan].name}
                  </span>
                  <svg className={`w-3 h-3 text-white transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 드롭다운 메뉴 */}
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100]">
                    <Link
                      href="/mypage"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      마이페이지
                    </Link>
                    <Link
                      href="/pricing"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      요금제 확인
                    </Link>
                    <Link
                      href="/change-password"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      비밀번호 변경
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); setApiKeyModalOpen(true); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-all w-full"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      API 키 설정
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-all w-full"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-white hover:text-white transition-all"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-700 rounded-lg hover:bg-white/90 transition-all"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>

          {/* 모바일 버튼 */}
          <div className="flex md:hidden items-center gap-1.5">
            {showApiKeyButton && (
              <button
                onClick={onToggleApiKey}
                className={`p-1.5 rounded-lg transition-all ${
                  apiKeyOpen ? 'bg-amber-400 text-white' : 'text-white hover:bg-white/15'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded-lg text-white hover:bg-white/15 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ApiKeyModal show={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-indigo-500 bg-indigo-700">
          <div className="px-4 py-3 space-y-1">
            {[...mainNav, ...subNav].map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-indigo-500 px-4 py-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-1">
                  <span className="text-sm text-white font-medium truncate">{displayName}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${PLAN_LABELS[plan].style}`}>
                    {PLAN_LABELS[plan].name}
                  </span>
                  {plan === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="px-1.5 py-0.5 text-[10px] font-bold text-red-100 bg-red-500/30 rounded"
                    >
                      관리 대시보드
                    </Link>
                  )}
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-white bg-white/20 rounded-lg"
                >
                  대시보드
                </Link>
                <Link
                  href="/mypage"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-white bg-white/10 rounded-lg"
                >
                  마이페이지
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); setApiKeyModalOpen(true); }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-white bg-white/10 rounded-lg"
                >
                  🔑 API 키 설정
                </button>
                <div className="flex gap-2">
                  <Link
                    href="/change-password"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-medium text-white bg-white/10 rounded-lg"
                  >
                    비밀번호 변경
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="flex-1 text-center py-2 text-xs font-medium text-red-200 bg-red-500/20 rounded-lg"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium text-white bg-white/10 rounded-lg"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold text-indigo-700 bg-white rounded-lg"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
