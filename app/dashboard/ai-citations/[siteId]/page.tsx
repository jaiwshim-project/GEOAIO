'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/indexing-sites';
import { CitationSummaryCards, CitationTrendChart, QueryResultsTable } from '@/components/ai-citations/CitationCharts';

interface StatusResponse {
  ok: boolean;
  siteId: string;
  perplexityConfigured: boolean;
  summary: { totalScans: number; citedCount: number; citationRate: number; lastScanned: string | null };
  history: { date: string; total: number; cited: number; rate: number }[];
  queryResults: { query: string; cited: boolean; citedUrl: string | null; answerExcerpt: string; lastScanned: string; isMock?: boolean }[];
  queries: { id: string; query: string; active: boolean }[];
}

export default function AiCitationPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params);
  const cfg = getSiteConfig(siteId);
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const [addingQuery, setAddingQuery] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-citations/status?siteId=${encodeURIComponent(siteId)}`);
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `오류 ${res.status}`);
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setLoading(false);
  }

  async function runScan() {
    setScanning(true);
    setError(null);
    try {
      const domain = cfg?.domain || siteId;
      const res = await fetch('/api/ai-citations/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, domain }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `오류 ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setScanning(false);
  }

  async function addQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuery.trim()) return;
    setAddingQuery(true);
    try {
      const res = await fetch('/api/ai-citations/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, query: newQuery.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setNewQuery('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setAddingQuery(false);
  }

  async function deleteQuery(id: string) {
    await fetch(`/api/ai-citations/queries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  useEffect(() => { load(); }, [siteId]);

  const hasMock = data?.queryResults.some(r => r.isMock);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🤖 {cfg ? `${cfg.emoji} ${cfg.label}` : siteId} — AI 인용 모니터링
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {cfg && <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mr-2">{cfg.domain}</code>}
              <Link href="/dashboard/indexing" className="text-xs text-indigo-600 hover:underline mr-3">← 사이트 목록</Link>
              <Link href={`/dashboard/indexing/${siteId}`} className="text-xs text-indigo-600 hover:underline">📊 Google 색인</Link>
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              {loading ? '로딩…' : '↻ 새로고침'}
            </button>
            <button onClick={runScan} disabled={scanning || (data?.queries.length === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:bg-gray-400"
              title={data?.queries.length === 0 ? '먼저 키워드를 추가하세요' : ''}>
              {scanning ? '스캔 중…' : '🔍 지금 스캔'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">❌ {error}</div>
        )}

        {/* Perplexity 미구성 안내 */}
        {data && !data.perplexityConfigured && (
          <div className="mb-4 p-4 bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-300 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-bold text-violet-900 mb-1">Perplexity API 미연결 — 현재 Mock 데이터 표시 중</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                  실제 AI 인용 데이터를 수집하려면 <strong>PERPLEXITY_API_KEY</strong> 환경 변수가 필요합니다.
                  Perplexity 콘솔(<code>perplexity.ai/settings/api</code>)에서 API 키를 발급받아 Vercel 환경 변수에 추가하세요.
                </p>
                <code className="text-xs bg-violet-100 text-violet-800 px-2 py-1 rounded">
                  vercel env add PERPLEXITY_API_KEY
                </code>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <CitationSummaryCards summary={data.summary} isMock={hasMock} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CitationTrendChart data={data.history} />
              {/* 소스별 현황 (현재: Perplexity 단독) */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🌐 AI 소스별 현황</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Perplexity', status: data.perplexityConfigured ? 'active' : 'mock', rate: data.summary.citationRate },
                    { name: 'ChatGPT (SearchGPT)', status: 'planned', rate: null },
                    { name: 'Google AI Overview', status: 'planned', rate: null },
                    { name: 'Gemini', status: 'planned', rate: null },
                  ].map(s => (
                    <div key={s.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : s.status === 'mock' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                        <span className="text-sm text-gray-700">{s.name}</span>
                      </div>
                      <div className="text-right">
                        {s.rate !== null ? (
                          <span className="text-sm font-bold text-violet-700">{s.rate}%</span>
                        ) : (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">준비 중</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                  현재 Perplexity sonar 모델을 통해 실시간 웹 검색 인용을 측정합니다.
                  ChatGPT(SearchGPT)·Google AI Overview·Gemini는 공식 인용 API를 제공하지 않아 자동 측정이 어렵지만, 우회 측정 방법이 확보되는 대로 순차적으로 추가할 예정입니다.
                  현재 Perplexity의 인용률이 높다면 다른 AI 엔진에서도 인용될 가능성이 높습니다.
                </p>
              </div>
            </div>
            <QueryResultsTable results={data.queryResults} />

            {/* 키워드 관리 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">⌨️ 키워드 관리</h3>
              <form onSubmit={addQuery} className="flex gap-2 mb-4">
                <input
                  value={newQuery}
                  onChange={e => setNewQuery(e.target.value)}
                  placeholder="예: GEO-AIO란 무엇인가요?"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button type="submit" disabled={addingQuery || !newQuery.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:bg-gray-400 shrink-0">
                  {addingQuery ? '추가 중…' : '+ 추가'}
                </button>
              </form>
              {data.queries.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 키워드가 없습니다. 위 입력창에서 추가하세요.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.queries.map(q => (
                    <div key={q.id} className="flex items-center gap-1 bg-violet-50 border border-violet-200 text-violet-800 text-xs px-3 py-1.5 rounded-full">
                      <span>{q.query}</span>
                      <button onClick={() => deleteQuery(q.id)} className="ml-1 text-violet-400 hover:text-rose-500 leading-none">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                💡 AI가 실제로 사용자에게 답변할 법한 자연어 질문 형태로 등록하세요. 예: "치과 임플란트 비용은?", "GEO 최적화 방법" 등.
                스캔 1회당 최대 5개 쿼리가 실행됩니다.
              </p>
            </div>
          </div>
        )}

        {!loading && !data && !error && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-2">데이터를 불러오는 중입니다…</p>
          </div>
        )}
      </div>
    </div>
  );
}
