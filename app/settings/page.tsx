'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/lib/user-context';

const LS_KEY = 'geoaio_gemini_key';

export default function SettingsPage() {
  const { setGeminiApiKey: setContextKey } = useUser();
  const [geminiKey, setGeminiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setHasKey(true);
    } catch {}
  }, []);

  const handleSave = async () => {
    const key = geminiKey.trim();
    if (!key) return;
    setSaving(true);
    setStatus(null);
    try {
      localStorage.setItem(LS_KEY, key);
      setContextKey(key); // 전역 context에도 즉시 반영
      await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: key }),
      }).catch(() => {});
      setStatus({ type: 'success', msg: 'Gemini API 키가 저장되었습니다.' });
      setGeminiKey('');
      setHasKey(true);
    } catch (e) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : '저장 실패' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setContextKey('');
    setHasKey(false);
    setStatus({ type: 'success', msg: 'Gemini API 키가 삭제되었습니다.' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">API 키 설정</h1>
          <p className="text-sm text-gray-500 mt-1">AI 기능 사용에 필요한 Gemini API 키를 등록하세요.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Google Gemini API 키</h2>
              <p className="text-blue-100 text-xs">AI 콘텐츠 생성 · 주제 추천 · 키워드 분석</p>
            </div>
            {hasKey && (
              <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-400 text-white">
                ✓ 등록됨
              </span>
            )}
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* 설명 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Gemini API 키란?</p>
              <p className="text-blue-700 text-xs leading-relaxed">
                Google AI Studio에서 무료로 발급받을 수 있는 API 키입니다.
                이 키를 등록하면 AI 주제 추천, 키워드 제안, 콘텐츠 생성 기능을 사용할 수 있습니다.
              </p>
            </div>

            {/* 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                API 키 입력 {hasKey && <span className="text-xs text-gray-400 font-normal">(새 키 입력 시 기존 키 교체)</span>}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder={hasKey ? '새 키를 입력하면 기존 키가 교체됩니다' : 'AIza... 로 시작하는 Gemini API 키'}
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !geminiKey.trim()}
                  className="px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            {/* 상태 메시지 */}
            {status && (
              <p className={`text-sm ${status.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {status.type === 'success' ? '✓ ' : '✗ '}{status.msg}
              </p>
            )}

            {/* 삭제 버튼 */}
            {hasKey && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-700 hover:underline"
              >
                등록된 키 삭제
              </button>
            )}

            {/* 키 발급 링크 */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 mb-2">아직 API 키가 없으신가요?</p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                Google AI Studio에서 무료 키 발급받기
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/generate" className="text-sm text-blue-600 hover:underline">← 콘텐츠 생성으로 돌아가기</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
