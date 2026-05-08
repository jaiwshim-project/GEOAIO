'use client';

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

export function QueryResultsTable({ results }: { results: QueryResult[] }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🔍 키워드별 AI 응답 결과</h3>
      {results.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">아직 스캔 결과가 없습니다. 위의 지금 스캔 버튼을 눌러 시작하세요.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-3 text-gray-500 font-medium w-1/4">질문 키워드</th>
                <th className="text-left py-2 pr-3 text-gray-500 font-medium">Perplexity 인용</th>
                <th className="text-left py-2 pr-3 text-gray-500 font-medium">ChatGPT 언급</th>
                <th className="text-left py-2 text-gray-500 font-medium">ChatGPT 추천</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-3 text-gray-800 font-medium leading-snug align-top">{r.query}</td>

                  {/* Perplexity */}
                  <td className="py-3 pr-3 align-top">
                    {r.perplexity ? (
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.perplexity.cited ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.perplexity.cited ? '✓ 인용됨' : '✗ 미인용'}
                        </span>
                        {r.perplexity.citedUrl && (
                          <a href={r.perplexity.citedUrl} target="_blank" rel="noopener noreferrer"
                            className="block mt-1 text-indigo-600 hover:underline truncate max-w-[140px]"
                            title={r.perplexity.citedUrl}>
                            {r.perplexity.citedUrl.replace(/^https?:\/\//, '').slice(0, 30)}…
                          </a>
                        )}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>

                  {/* ChatGPT 언급 */}
                  <td className="py-3 pr-3 align-top">
                    {r.chatgpt ? (
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.chatgpt.mentioned ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.chatgpt.mentioned ? '✓ 언급됨' : '✗ 미언급'}
                        </span>
                        {r.chatgpt.mentionExcerpt && (
                          <p className="mt-1 text-gray-400 leading-relaxed max-w-[160px]" title={r.chatgpt.mentionExcerpt}>
                            {r.chatgpt.mentionExcerpt.slice(0, 60)}…
                          </p>
                        )}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>

                  {/* ChatGPT 추천 */}
                  <td className="py-3 align-top">
                    {r.chatgpt ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.chatgpt.recommended ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                        {r.chatgpt.recommended ? '⭐ 추천' : '—'}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
        Perplexity 인용은 답변 출처 URL 포함 여부를 기준으로 측정합니다. ChatGPT 언급은 GPT-4o 응답 텍스트에 브랜드명 또는 도메인이 포함됐는지, 추천은 언급과 함께 "추천·권장·좋습니다" 등 긍정 표현이 동반됐는지를 기준으로 합니다.
        미언급 키워드는 해당 주제의 콘텐츠를 강화하거나 브랜드명을 명확히 노출하는 방식으로 개선할 수 있습니다.
      </p>
    </div>
  );
}
