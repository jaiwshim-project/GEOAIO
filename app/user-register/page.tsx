'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', company_name: '', service_name: '', phone: '', email: '' });
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinConfirm, setPinConfirm] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinInput = (
    index: number, value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    prefix: string
  ) => {
    if (!/^\d?$/.test(value)) return;
    setter(prev => { const n = [...prev]; n[index] = value; return n; });
    setError('');
    if (value && index < 3) document.getElementById(`${prefix}-${index + 1}`)?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent, current: string[], prefix: string) => {
    if (e.key === 'Backspace' && !current[index] && index > 0)
      document.getElementById(`${prefix}-${index - 1}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('사용자 이름을 입력해주세요.'); return; }
    const pinStr = pin.join('');
    const pinConfirmStr = pinConfirm.join('');
    if (pinStr.length !== 4) { setError('비밀번호 4자리를 모두 입력해주세요.'); return; }
    if (pinStr !== pinConfirmStr) { setError('비밀번호가 일치하지 않습니다.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pin: pinStr }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '등록 실패'); return; }
      router.push('/user-select');
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white text-xl font-bold">GEOAIO</h1>
          <p className="text-gray-400 text-sm mt-1">새 사용자 등록</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/user-select" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h2 className="text-white font-bold text-lg">사용자 정보 등록</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: '사용자 이름', field: 'username', placeholder: '홍길동', required: true },
              { label: '회사명', field: 'company_name', placeholder: '(주)예시컴퍼니' },
              { label: '서비스명', field: 'service_name', placeholder: '서비스/브랜드명' },
              { label: '휴대폰 번호', field: 'phone', placeholder: '010-0000-0000' },
              { label: '이메일 주소', field: 'email', placeholder: 'example@email.com' },
            ].map(({ label, field, placeholder, required }) => (
              <div key={field}>
                <label className="block text-gray-300 text-xs font-semibold mb-1.5">
                  {label} {required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => { setForm(prev => ({ ...prev, [field]: e.target.value })); setError(''); }}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 text-sm transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1.5">
                비밀번호 (숫자 4자리) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 justify-center">
                {pin.map((d, i) => (
                  <input key={i} id={`pin-${i}`} type="password" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handlePinInput(i, e.target.value, setPin, 'pin')}
                    onKeyDown={(e) => handlePinKeyDown(i, e, pin, 'pin')}
                    className="w-12 h-12 text-center text-xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1.5">
                비밀번호 확인 <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 justify-center">
                {pinConfirm.map((d, i) => (
                  <input key={i} id={`pinc-${i}`} type="password" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handlePinInput(i, e.target.value, setPinConfirm, 'pinc')}
                    onKeyDown={(e) => handlePinKeyDown(i, e, pinConfirm, 'pinc')}
                    className="w-12 h-12 text-center text-xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
              {loading ? '등록 중...' : '사용자 등록'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
