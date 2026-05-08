'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

interface SummaryData {
  totalScans: number;
  citedCount: number;
  citationRate: number;
  lastScanned: string | null;
}

export function CitationSummaryCards({ summary, isMock }: { summary: SummaryData; isMock?: boolean }) {
  const cards = [
    { label: '총 스캔 횟수', value: summary.totalScans, color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'AI 인용 횟수', value: summary.citedCount, color: 'text-violet-700', bg: 'bg-violet-50' },
    { label: '인용률', value: `${summary.citationRate}%`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    {
      label: '마지막 스캔',
      value: summary.lastScanned ? summary.lastScanned.slice(0, 10) : '—',
      color: 'text-gray-500',
      bg: 'bg-gray-50',
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-gray-200`}>
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
        </div>
      ))}
      {isMock && (
        <div className="col-span-full text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⚠️ MOCK 데이터 표시 중 — 실데이터를 보려면 <code>PERPLEXITY_API_KEY</code> 환경 변수를 설정하세요.
        </div>
      )}
      <div className="col-span-full bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">🤖 AI 인용 현황 요약</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          AI 인용 현황은 Perplexity AI가 사용자 질문에 답할 때 이 사이트의 URL을 출처로 얼마나 인용했는지를 보여 줍니다.
          총 스캔 횟수는 등록된 키워드로 Perplexity에 질의한 누적 횟수이며, AI 인용 횟수는 그 중 답변 출처에 이 사이트 URL이 포함된 횟수입니다.
          인용률이 높을수록 AI가 이 사이트를 신뢰할 만한 정보 출처로 평가하고 있다는 의미입니다.
          인용률을 높이려면 질문 형식의 제목, 명확한 정의와 수치 제시, E-E-A-T 강화(저자 정보, 날짜, 출처 명시)가 효과적입니다.
          키워드는 실제 사용자가 AI에 물어볼 법한 질문 형태로 등록할수록 정확한 인용 가능성을 측정할 수 있습니다.
          현재 Perplexity 기준으로 측정되며, 향후 ChatGPT·Gemini·AI Overview 추적이 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}

export function CitationTrendChart({ data }: { data: { date: string; total: number; cited: number; rate: number }[] }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">📈 인용률 추이</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={(v: number | undefined) => v != null ? `${v}%` : ''} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="rate" stroke="#7c3aed" strokeWidth={2} name="인용률(%)" dot={false} />
            <Line type="monotone" dataKey="cited" stroke="#10b981" strokeWidth={1.5} name="인용 횟수" dot={false} />
            <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={1.5} name="총 스캔" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
        인용률 추이 차트는 최근 60일간 Perplexity AI가 등록된 키워드 질문에서 이 사이트를 인용한 비율의 변화를 보여 줍니다.
        보라색 선(인용률%)이 상승하면 AI 엔진에서의 콘텐츠 권위가 높아지고 있다는 신호입니다.
        인용률이 갑자기 하락한다면 최신 콘텐츠 업데이트, 경쟁 콘텐츠 증가, 또는 Perplexity 모델 업데이트를 점검하세요.
        정기적으로 스캔을 실행하여 데이터를 축적할수록 콘텐츠 전략 변경이 AI 인용에 미치는 영향을 정확히 파악할 수 있습니다.
      </p>
    </div>
  );
}

interface QueryResult {
  query: string;
  cited: boolean;
  citedUrl: string | null;
  answerExcerpt: string;
  lastScanned: string;
  isMock?: boolean;
}

export function QueryResultsTable({ results }: { results: QueryResult[] }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🔍 키워드별 인용 결과</h3>
      {results.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">아직 스캔 결과가 없습니다. 위의 지금 스캔 버튼을 눌러 시작하세요.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium w-1/3">질문 키워드</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">인용 여부</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">인용 URL</th>
                <th className="text-left py-2 text-gray-500 font-medium">마지막 스캔</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-4 text-gray-800 font-medium leading-snug">{r.query}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.cited ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.cited ? '✓ 인용됨' : '✗ 미인용'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 max-w-[180px]">
                    {r.citedUrl ? (
                      <a href={r.citedUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate block" title={r.citedUrl}>
                        {r.citedUrl.replace(/^https?:\/\//, '').slice(0, 40)}…
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-gray-400">{r.lastScanned.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
        키워드별 인용 결과는 등록된 각 질문을 Perplexity에 직접 질의했을 때 이 사이트의 URL이 출처 목록에 포함되었는지 보여 줍니다.
        인용됨(✓) 표시는 해당 질문에 대한 AI 답변의 출처 목록에 이 사이트가 포함되었다는 의미입니다.
        인용 URL을 클릭하면 AI가 실제로 참고한 페이지를 확인할 수 있습니다.
        미인용 키워드는 해당 주제의 콘텐츠를 보강하거나 질문 형식의 제목으로 재작성하면 인용 가능성이 높아집니다.
        키워드는 아래 입력창에서 추가·삭제할 수 있으며, 실제 사용자가 AI에게 물어볼 법한 자연어 질문 형태를 권장합니다.
      </p>
    </div>
  );
}
