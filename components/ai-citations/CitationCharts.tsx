'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

/* ── 요약 카드 ─────────────────────────────────────── */
interface SummaryData {
  perplexity: { totalScans: number; citedCount: number; citationRate: number };
  chatgpt: { totalScans: number; mentionedCount: number; mentionRate: number; recommendedCount: number };
  lastScanned: string | null;
}

export function CitationSummaryCards({ summary, isMock }: { summary: SummaryData; isMock?: boolean }) {
  const cards = [
    { label: 'Perplexity 인용률',  value: `${summary.perplexity.citationRate}%`,  sub: `${summary.perplexity.citedCount}/${summary.perplexity.totalScans}회`, color: 'text-violet-700', bg: 'bg-violet-50' },
    { label: 'ChatGPT 언급률',     value: `${summary.chatgpt.mentionRate}%`,       sub: `${summary.chatgpt.mentionedCount}/${summary.chatgpt.totalScans}회`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'ChatGPT 추천 횟수',  value: summary.chatgpt.recommendedCount,        sub: '언급 + 추천 표현 동반', color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { label: '마지막 스캔',         value: summary.lastScanned ? summary.lastScanned.slice(0, 10) : '—', sub: '', color: 'text-gray-500', bg: 'bg-gray-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-gray-200`}>
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          {c.sub && <div className="text-[11px] text-gray-400 mt-0.5">{c.sub}</div>}
        </div>
      ))}
      {isMock && (
        <div className="col-span-full text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⚠️ MOCK 데이터 표시 중 — 실데이터를 보려면 <code>PERPLEXITY_API_KEY</code> 및 <code>OPENAI_API_KEY</code> 환경 변수를 설정하세요.
        </div>
      )}
      <div className="col-span-full bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">🤖 AI 인용 현황 요약</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Perplexity 인용률은 검색 AI가 답변 출처 목록에 이 사이트 URL을 직접 포함한 비율입니다. ChatGPT 언급률은 GPT-4o가 동일 질문에 답할 때 브랜드명이나 도메인을 텍스트로 언급한 비율이며, 추천 횟수는 언급과 함께 "추천·권장·좋습니다" 등 긍정 표현이 동반된 횟수입니다.
          두 지표를 함께 보면 AI 검색 엔진(Perplexity)과 대화형 AI(ChatGPT) 양쪽에서의 브랜드 인지도를 입체적으로 파악할 수 있습니다.
          Perplexity는 URL 인용 여부로 정확도 높은 측정이 가능하고, ChatGPT는 브랜드 인지도와 추천 강도를 반영합니다. 두 지표가 모두 높을수록 AI 전반에서 신뢰받는 사이트라는 의미입니다.
        </p>
      </div>
    </div>
  );
}

/* ── 추이 차트 ─────────────────────────────────────── */
export function CitationTrendChart({ data }: {
  data: { date: string; perplexity_rate: number; chatgpt_rate: number }[];
}) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">📈 인용·언급률 추이</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={(v: number | undefined) => v != null ? `${v}%` : ''} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="perplexity_rate" stroke="#7c3aed" strokeWidth={2} name="Perplexity 인용률" dot={false} />
            <Line type="monotone" dataKey="chatgpt_rate"    stroke="#10b981" strokeWidth={2} name="ChatGPT 언급률"   dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
        보라색 선(Perplexity)은 URL 출처 인용 비율, 초록색 선(ChatGPT)은 텍스트 언급 비율입니다.
        두 선이 함께 상승하면 AI 전반에서 브랜드 인지도가 높아지고 있다는 신호입니다.
        Perplexity만 높고 ChatGPT가 낮다면 검색 AI에는 노출되지만 대화형 AI의 학습 데이터에 아직 충분히 반영되지 않은 상태입니다.
      </p>
    </div>
  );
}

/* ── 키워드별 결과 테이블 ────────────────────────────── */
interface QueryResult {
  query: string;
  perplexity: { cited: boolean; citedUrl: string | null; answerExcerpt: string; lastScanned: string; isMock?: boolean } | null;
  chatgpt: { mentioned: boolean; recommended: boolean; mentionExcerpt: string; answerExcerpt: string; lastScanned: string; isMock?: boolean } | null;
}

function AnswerPanel({ result }: { result: QueryResult }) {
  const [tab, setTab] = useState<'chatgpt' | 'perplexity'>('chatgpt');

  function highlightMention(text: string, excerpt: string) {
    if (!excerpt || !text) return text;
    const idx = text.indexOf(excerpt.slice(0, 30));
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-emerald-100 text-emerald-900 rounded px-0.5">{text.slice(idx, idx + excerpt.length)}</mark>
        {text.slice(idx + excerpt.length)}
      </>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      {/* 탭 */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setTab('chatgpt')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors ${tab === 'chatgpt' ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🤖 ChatGPT 답변
          {result.chatgpt && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${result.chatgpt.mentioned ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {result.chatgpt.mentioned ? '언급됨' : '미언급'}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('perplexity')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors ${tab === 'perplexity' ? 'border-b-2 border-violet-500 text-violet-700 bg-violet-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🔍 Perplexity 답변
          {result.perplexity && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${result.perplexity.cited ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
              {result.perplexity.cited ? '인용됨' : '미인용'}
            </span>
          )}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* 사용자 질문 버블 */}
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed shadow-sm">
            {result.query}
          </div>
        </div>

        {/* AI 답변 버블 */}
        {tab === 'chatgpt' && (
          result.chatgpt ? (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-sm">🤖</div>
              <div className="flex-1">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-gray-700 leading-relaxed shadow-sm whitespace-pre-wrap">
                  {result.chatgpt.mentionExcerpt
                    ? highlightMention(result.chatgpt.answerExcerpt, result.chatgpt.mentionExcerpt)
                    : result.chatgpt.answerExcerpt || '(답변 없음)'}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                  {result.chatgpt.mentioned && (
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      ✓ 브랜드 언급됨
                    </span>
                  )}
                  {result.chatgpt.recommended && (
                    <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      ⭐ 추천 표현 포함
                    </span>
                  )}
                  {!result.chatgpt.mentioned && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      ✗ 브랜드 미언급
                    </span>
                  )}
                  {result.chatgpt.isMock && (
                    <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-full">
                      Mock 데이터
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 self-center">
                    {result.chatgpt.lastScanned?.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-4">ChatGPT 스캔 결과 없음</div>
          )
        )}

        {tab === 'perplexity' && (
          result.perplexity ? (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-sm">🔍</div>
              <div className="flex-1">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-gray-700 leading-relaxed shadow-sm whitespace-pre-wrap">
                  {result.perplexity.answerExcerpt || '(답변 없음)'}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                  {result.perplexity.cited ? (
                    <>
                      <span className="text-[10px] bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ URL 인용됨
                      </span>
                      {result.perplexity.citedUrl && (
                        <a href={result.perplexity.citedUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-indigo-600 hover:underline truncate max-w-[200px] self-center"
                          title={result.perplexity.citedUrl}>
                          🔗 {result.perplexity.citedUrl.replace(/^https?:\/\//, '').slice(0, 40)}
                        </a>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      ✗ URL 미인용
                    </span>
                  )}
                  {result.perplexity.isMock && (
                    <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-full">
                      Mock 데이터
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 self-center">
                    {result.perplexity.lastScanned?.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-4">Perplexity 스캔 결과 없음</div>
          )
        )}
      </div>
    </div>
  );
}

export function QueryResultsTable({ results }: { results: QueryResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🔍 키워드별 AI 응답 결과</h3>
      {results.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">아직 스캔 결과가 없습니다. 위의 지금 스캔 버튼을 눌러 시작하세요.</p>
      ) : (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl border transition-colors ${expanded === i ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}>
              {/* 행 헤더 */}
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                {/* 질문 */}
                <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">{r.query}</span>

                {/* Perplexity 뱃지 */}
                <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  r.perplexity?.cited ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  🔍 {r.perplexity ? (r.perplexity.cited ? '인용' : '미인용') : '—'}
                </span>

                {/* ChatGPT 언급 뱃지 */}
                <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  r.chatgpt?.mentioned ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  🤖 {r.chatgpt ? (r.chatgpt.mentioned ? '언급' : '미언급') : '—'}
                </span>

                {/* 추천 뱃지 */}
                {r.chatgpt?.recommended && (
                  <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    ⭐ 추천
                  </span>
                )}

                {/* 펼치기 화살표 */}
                <span className={`shrink-0 text-gray-400 text-xs transition-transform duration-200 ${expanded === i ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* 대화 패널 */}
              {expanded === i && (
                <div className="px-4 pb-4">
                  <AnswerPanel result={r} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
        각 키워드를 클릭하면 ChatGPT·Perplexity의 실제 답변 전문을 확인할 수 있습니다.
        초록색 하이라이트는 ChatGPT 답변에서 브랜드가 언급된 문장을 표시합니다.
        미언급 키워드는 해당 주제의 콘텐츠를 강화하거나 브랜드명을 명확히 노출하는 방식으로 개선할 수 있습니다.
      </p>
    </div>
  );
}
