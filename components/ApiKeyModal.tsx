'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiKey, saveApiKey, deleteApiKey } from '@/lib/supabase-storage';

interface ApiKeyModalProps {
  show: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ show, onClose }: ApiKeyModalProps) {
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!show) return;
    getApiKey('gemini').then(key => { if (key) setHasKey(true); });
    fetch('/api/set-api-key')
      .then(res => res.json())
      .then(data => { if (data.hasGeminiKey) setHasKey(true); })
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [show]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (show) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [show, onClose]);

  const handleSave = async () => {
    const key = geminiKeyInput.trim();
    if (!key) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await saveApiKey('gemini', key);
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({ type: 'success', msg: 'Gemini API 키가 저장되었습니다.' });
      setGeminiKeyInput('');
      setHasKey(true);
    } catch (err) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : '저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteApiKey('gemini');
    setHasKey(false);
    setStatus({ type: 'success', msg: 'Gemini API 키가 삭제되었습니다.' });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-base">API 키 설정</h2>
            <p className="text-blue-100 text-xs">Google Gemini API 키를 등록하세요</p>
          </div>
          {hasKey && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-400 text-white shrink-0">
              ✓ 등록됨
            </span>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 space-y-4">
          {/* 안내 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-sm text-blue-800">
            <p className="font-semibold mb-1 text-sm">Gemini API 키란?</p>
            <p className="text-blue-700 text-xs leading-relaxed">
              Google AI Studio에서 무료로 발급받을 수 있는 키입니다.
              등록하면 AI 주제 추천, 키워드 제안, 콘텐츠 생성 기능을 사용할 수 있습니다.
            </p>
          </div>

          {/* 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              API 키 입력{hasKey && <span className="text-xs text-gray-400 font-normal ml-1">(새 키 입력 시 기존 키 교체)</span>}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type={showKey ? 'text' : 'password'}
                  value={geminiKeyInput}
                  onChange={e => setGeminiKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={hasKey ? '새 키를 입력하면 기존 키가 교체됩니다' : 'AIza... 로 시작하는 키'}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 font-mono"
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
                disabled={isSaving || !geminiKeyInput.trim()}
                className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {/* 상태 메시지 */}
          {status && (
            <p className={`text-sm ${status.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
              {status.type === 'success' ? '✓ ' : '✗ '}{status.msg}
            </p>
          )}

          {/* 삭제 / 발급 링크 */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            {hasKey ? (
              <button
                onClick={handleDelete}
                className="text-xs text-red-500 hover:text-red-700 hover:underline"
              >
                등록된 키 삭제
              </button>
            ) : <span />}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              키 무료 발급받기
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
