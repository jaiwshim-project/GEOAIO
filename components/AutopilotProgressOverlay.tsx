'use client';

// 자동 반복 발행 진행 상태를 우하단에 floating modal로 표시.
// generate ↔ result 페이지 라운드트립 동안 전 페이지에서 관찰 가능.

import { useEffect, useState } from 'react';
import { readAutopilotRun, type AutopilotRun, type AutopilotPhase, AUTOPILOT_RUN_KEY } from '@/lib/category-match';

const PHASE_LABEL: Record<AutopilotPhase, { label: string; sub: string; weight: number }> = {
  'idle':            { label: '대기',                 sub: '시작 준비 중',                weight: 0 },
  'starting':        { label: '🚀 시작',              sub: '회차 시작',                  weight: 5 },
  'generating':      { label: '✍️ 콘텐츠 생성 중',     sub: '15톤 본문 작성 (Gemini)',     weight: 25 },
  'eeat':            { label: '⚡ EEAT 강화',         sub: '15톤 정의문·FAQ·구조화',      weight: 45 },
  'publishing-ko':   { label: '🇰🇷 한국어 발행',       sub: '카테고리 등록·색인 큐 등록',  weight: 55 },
  'translating-en':  { label: '🇺🇸 영어 번역',         sub: '15톤 자동 번역',              weight: 65 },
  'publishing-en':   { label: '🇺🇸 영어 발행',         sub: '카테고리 등록',               weight: 70 },
  'translating-zh':  { label: '🇨🇳 중국어 번역',       sub: '15톤 자동 번역',              weight: 80 },
  'publishing-zh':   { label: '🇨🇳 중국어 발행',       sub: '카테고리 등록',               weight: 85 },
  'translating-ja':  { label: '🇯🇵 일본어 번역',       sub: '15톤 자동 번역',              weight: 92 },
  'publishing-ja':   { label: '🇯🇵 일본어 발행',       sub: '카테고리 등록',               weight: 97 },
  'cycle-done':      { label: '✅ 회차 완료',          sub: '다음 회차로 이동…',           weight: 100 },
  'all-done':        { label: '🏁 전체 완료',          sub: '모든 회차 발행 완료',         weight: 100 },
};

export default function AutopilotProgressOverlay() {
  const [run, setRun] = useState<AutopilotRun | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // sessionStorage 변화 감지 — storage event(다른 탭) + 커스텀 이벤트(같은 탭) + polling
  useEffect(() => {
    const refresh = () => setRun(readAutopilotRun());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('autopilot-phase-update', refresh);
    // polling — 안전망 (초당 1회)
    const interval = setInterval(refresh, 1000);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('autopilot-phase-update', refresh);
      clearInterval(interval);
    };
  }, []);

  if (!run || (!run.isRunning && run.currentPhase !== 'all-done')) return null;

  const isFinished = run.currentPhase === 'all-done';
  const phaseInfo = PHASE_LABEL[run.currentPhase] || PHASE_LABEL.idle;

  // 전체 진행률 — 회차 단위 가중 + 현재 회차 내 phase 진행도
  const completedCycles = Math.max(0, run.currentRepeat - 1);
  const cycleProgress = phaseInfo.weight; // 0~100
  const overallPct = Math.min(100, Math.round(((completedCycles + cycleProgress / 100) / Math.max(1, run.totalRepeats)) * 100));

  // 현재 회차의 주제
  const currentTopic = run.topicQueue[run.currentRepeat - 1] || '';
  const elapsedSec = run.startedAt ? Math.floor((Date.now() - run.startedAt) / 1000) : 0;
  const elapsedFmt = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] sm:w-96 max-w-md"
    >
      <div className={`bg-white rounded-2xl shadow-2xl shadow-amber-300/30 border-2 ${
        isFinished ? 'border-emerald-400 ring-2 ring-emerald-200/60' : 'border-amber-400 ring-2 ring-amber-200/60'
      } overflow-hidden`}>
        {/* 상단 헤더 */}
        <div className={`relative px-4 py-3 ${
          isFinished ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
        } text-white`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {!isFinished && (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
              )}
              <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase">
                {isFinished ? '🏁 자동 발행 완료' : '🚀 자동 반복 발행 진행 중'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(c => !c)}
              className="text-white/80 hover:text-white text-xs font-bold"
              aria-label={collapsed ? '펼치기' : '접기'}
            >
              {collapsed ? '▲ 펼치기' : '▼ 접기'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="p-4">
            {/* 회차 표시 */}
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {isFinished ? '전체 결과' : `회차 ${run.currentRepeat} / ${run.totalRepeats}`}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{elapsedFmt} 경과</span>
            </div>

            {/* 현재 단계 */}
            <div className="mb-3">
              <p className="text-base font-extrabold text-slate-900 leading-tight">{phaseInfo.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{phaseInfo.sub}</p>
            </div>

            {/* 진행 바 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-600">전체 진행률</span>
                <span className="text-xs font-extrabold text-amber-700">{overallPct}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isFinished
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500'
                  }`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>

            {/* 현재 주제 */}
            {currentTopic && !isFinished && (
              <div className="mb-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[10px] font-bold text-slate-500 mb-0.5 tracking-wide uppercase">현재 주제</p>
                <p className="text-xs text-slate-800 leading-snug line-clamp-2">{currentTopic}</p>
              </div>
            )}

            {/* 누적 발행 편 수 */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">누적 발행</span>
              <span className="font-extrabold text-emerald-700 text-base">{run.publishedTotal}편</span>
            </div>

            {/* 선택 언어 */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500">발행 언어:</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold text-slate-700">🇰🇷 한국어</span>
              {run.translationLangs.map(l => (
                <span key={l} className="text-[10px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded font-bold text-amber-800">
                  {l === 'en' ? '🇺🇸 영어' : l === 'zh' ? '🇨🇳 중국어' : '🇯🇵 일본어'}
                </span>
              ))}
            </div>

            {isFinished && (
              <button
                type="button"
                onClick={() => {
                  try { sessionStorage.removeItem(AUTOPILOT_RUN_KEY); } catch {}
                  setRun(null);
                }}
                className="mt-3 w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-lg shadow-md hover:from-emerald-400 hover:to-teal-500 transition-colors text-sm"
              >
                확인 (닫기)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
