'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserProfile } from '@/lib/user-context';

interface UserItem {
  id: string;
  username: string;
  company_name?: string;
  service_name?: string;
}

export default function UserSelectPage() {
  const router = useRouter();
  const { setCurrentUser } = useUser();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError('');
    if (value && index < 3) document.getElementById(`pin-${index + 1}`)?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0)
      document.getElementById(`pin-${index - 1}`)?.focus();
  };

  const handleVerify = async () => {
    if (!selectedUser) return;
    const pinStr = pin.join('');
    if (pinStr.length !== 4) { setError('비밀번호 4자리를 모두 입력해주세요.'); return; }

    setVerifying(true);
    try {
      const res = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser.username, pin: pinStr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '인증 실패');
        setPin(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
        return;
      }
      setCurrentUser(data.user as UserProfile);
      router.push('/user-dashboard');
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectUser = (user: UserItem) => {
    setSelectedUser(user);
    setPin(['', '', '', '']);
    setError('');
    setTimeout(() => document.getElementById('pin-0')?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="h-12 rounded-lg mx-auto mb-4" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
          <h1 className="text-white text-xl font-bold">GEOAIO</h1>
          <p className="text-gray-400 text-sm mt-1">사용자를 선택하여 시작하세요</p>
        </div>

        {!selectedUser ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-white font-bold text-lg mb-5">사용자 선택</h2>

            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
            ) : users.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">등록된 사용자가 없습니다.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/15 rounded-xl border border-white/10 hover:border-indigo-400/50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm">{user.username}</p>
                      {(user.company_name || user.service_name) && (
                        <p className="text-gray-400 text-xs truncate">
                          {[user.company_name, user.service_name].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              <Link href="/user-register" className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 사용자 등록
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <button onClick={() => { setSelectedUser(null); setPin(['','','','']); setError(''); }}
              className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-5 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold">{selectedUser.username}</p>
                {(selectedUser.company_name || selectedUser.service_name) && (
                  <p className="text-gray-400 text-xs">{[selectedUser.company_name, selectedUser.service_name].filter(Boolean).join(' · ')}</p>
                )}
              </div>
            </div>

            <p className="text-gray-300 text-sm text-center mb-5">비밀번호 4자리를 입력하세요</p>

            <div className="flex gap-3 justify-center mb-5">
              {pin.map((digit, i) => (
                <input key={i} id={`pin-${i}`} type="password" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-colors"
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

            <button onClick={handleVerify} disabled={verifying || pin.join('').length !== 4}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all">
              {verifying ? '확인 중...' : '로그인'}
            </button>
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">홈으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
