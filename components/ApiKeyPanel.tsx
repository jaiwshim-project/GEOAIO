'use client';

import { useState, useEffect } from 'react';
import { getApiKey, saveApiKey, deleteApiKey } from '@/lib/supabase-storage';

interface ApiKeyPanelProps {
  visible: boolean;
}

export default function ApiKeyPanel({ visible }: ApiKeyPanelProps) {
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [geminiKeyStatus, setGeminiKeyStatus] = useState<'none' | 'saved' | 'error'>('none');
  const [geminiKeyMessage, setGeminiKeyMessage] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    // Supabase (또는 localStorage 폴백)에서 저장된 키 확인
    getApiKey('gemini').then(key => {
      if (key) setHasGeminiKey(true);
    });
    // 서버 측 키도 확인
    fetch('/api/set-api-key')
      .then(res => res.json())
      .then(data => {
        if (data.hasGeminiKey) setHasGeminiKey(true);
      })
      .catch(() => {});
  }, []);

  const handleSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) return;
    setIsSavingGemini(true);
    setGeminiKeyStatus('none');
    try {
      const key = geminiKeyInput.trim();
      // Supabase에 저장
      await saveApiKey('gemini', key);
      // 서버에도 전송 (현재 세션용)
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeminiKeyStatus('saved');
      setGeminiKeyMessage('Gemini API Key가 저장되었습니다! 새 키를 입력하기 전까지 계속 사용됩니다.');
      setGeminiKeyInput('');
      setHasGeminiKey(true);
    } catch (err) {
      setGeminiKeyStatus('error');
      setGeminiKeyMessage(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSavingGemini(false);
    }
  };

  const handleDeleteGeminiKey = async () => {
    await deleteApiKey('gemini');
    setHasGeminiKey(false);
    setGeminiKeyStatus('saved');
    setGeminiKeyMessage('Gemini API Key가 삭제되었습니다.');
  };

  if (!visible) return null;

  return (
    <div className="border-b border-gray-200">
      {/* Gemini API Key 섹션 */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h3 className="font-semibold text-green-800">🍌 Gemini (Nano Banana) API Key 설정</h3>
            {hasGeminiKey && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                ✅ 저장됨
              </span>
            )}
          </div>
          <p className="text-xs text-green-700 mb-3">한번 저장하면 Supabase에 영구 저장되어, 새 키를 입력하기 전까지 계속 사용됩니다.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              placeholder={hasGeminiKey ? '새 키를 입력하면 기존 키가 교체됩니다' : 'AIza... Gemini API 키를 입력하세요'}
              className="flex-1 px-4 py-2.5 border border-green-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveGeminiKey()}
            />
            <button
              onClick={handleSaveGeminiKey}
              disabled={isSavingGemini || !geminiKeyInput.trim()}
              className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap border border-green-300"
            >
              {isSavingGemini ? '저장 중...' : '저장'}
            </button>
            {hasGeminiKey && (
              <button
                onClick={handleDeleteGeminiKey}
                className="px-4 py-2.5 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                삭제
              </button>
            )}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white border border-green-300 text-green-700 text-sm font-medium rounded-xl hover:bg-green-100 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
            >
              🍌 키 발급
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          {geminiKeyStatus !== 'none' && (
            <p className={`text-sm mt-2 ${geminiKeyStatus === 'saved' ? 'text-emerald-600' : 'text-red-600'}`}>
              {geminiKeyMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
