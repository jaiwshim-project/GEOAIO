'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function PasswordForm() {
  const sp = useSearchParams();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/site-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // 안전한 내부 경로만 허용 (open redirect 방지)
        const raw = sp.get('next') || '/';
        const safeNext = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
        window.location.href = safeNext;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '인증 실패');
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        autoFocus
        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-400/30 text-white placeholder-slate-500 backdrop-blur-md focus:outline-none focus:border-amber-300 focus:bg-white/10 tracking-widest text-center text-lg"
      />
      {error && (
        <p className="mt-3 text-center text-rose-300 text-xs">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || password.length === 0}
        className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-semibold tracking-wider uppercase text-sm hover:from-amber-300 hover:to-amber-400 transition-colors shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? '확인 중...' : 'Enter'}
      </button>
    </form>
  );
}

export default function SitePasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] relative flex items-center justify-center px-4">
      {/* 배경 — 골드 도트 + violet/amber blob */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(252 211 77) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

      <div className="relative w-full max-w-md text-center">
        {/* 골드 hairline frame */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-400/60 via-amber-500/30 to-amber-400/60 blur-[2px] opacity-80" />
          <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-amber-400/20 shadow-2xl px-6 sm:px-8 py-8 sm:py-10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-amber-200 mb-2">Restricted Access</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
              GEO-AIO
            </h1>
            <p className="text-[12px] text-slate-300 mt-2 mb-6">
              플랫폼 접근을 위해 비밀번호를 입력하세요.
            </p>
            <Suspense fallback={null}>
              <PasswordForm />
            </Suspense>
            <p className="text-[10px] text-slate-500 mt-6 tracking-wider">
              인증된 세션은 30일간 유지됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
