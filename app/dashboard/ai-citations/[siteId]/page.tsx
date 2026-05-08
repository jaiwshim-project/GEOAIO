'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/indexing-sites';
import { CitationSummaryCards, CitationTrendChart, QueryResultsTable } from '@/components/ai-citations/CitationCharts';

/* ── 인용률 원인 분석 ─────────────────────────────────── */
function CitationRateAnalysis({ rate, isMock }: { rate: number; isMock?: boolean }) {
  const level = rate >= 60 ? 'high' : rate >= 30 ? 'mid' : 'low';
  const config = {
    high: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: `높음 (${rate}%)`,
      icon: '✅',
      title: '인용률이 높은 이유',
      reasons: [
        { icon: '📄', title: '콘텐츠 구조 우수', desc: '질문–답변 형식, 명확한 정의, 수치 데이터가 포함되어 AI가 출처로 채택하기 쉬운 구조입니다.' },
        { icon: '🔗', title: '도메인 신뢰도 축적', desc: '다른 사이트에서의 인바운드 링크와 꾸준한 발행이 Perplexity 크롤러 신뢰도를 높였을 가능성이 큽니다.' },
        { icon: '🕐', title: '최신 콘텐츠 유지', desc: '최근 업데이트된 콘텐츠가 많아 AI가 신뢰할 수 있는 최신 정보 출처로 인식하고 있습니다.' },
        { icon: '🎯', title: '키워드 매칭 정확', desc: '등록된 검색 키워드와 사이트 콘텐츠 주제가 잘 일치하여 관련 질문에 정확히 인용되고 있습니다.' },
      ],
    },
    mid: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      label: `보통 (${rate}%)`,
      icon: '⚠️',
      title: '인용률이 중간 수준인 이유',
      reasons: [
        { icon: '📝', title: '일부 콘텐츠 구조 미흡', desc: '인용되지 않은 키워드의 페이지는 AI가 명확한 답변을 추출하기 어려운 산문형 구조일 가능성이 있습니다.' },
        { icon: '📅', title: '콘텐츠 최신성 불균형', desc: '일부 글이 오래되어 AI가 최신 정보 출처로 우선 채택하지 않을 수 있습니다.' },
        { icon: '🔀', title: '주제 경쟁 심화', desc: '일부 키워드에서는 동일 주제를 다루는 더 권위 있는 출처가 존재해 경쟁이 발생하고 있습니다.' },
        { icon: '🔍', title: '키워드 표현 불일치', desc: '등록 키워드와 실제 사용자 질문 패턴 사이에 차이가 있을 수 있습니다. 더 자연스러운 질문형으로 조정하세요.' },
      ],
    },
    low: {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      label: `낮음 (${rate}%)`,
      icon: '❌',
      title: '인용률이 낮은 이유',
      reasons: [
        { icon: '🕸️', title: 'AI 크롤링 미진행', desc: 'Perplexity가 아직 사이트를 충분히 크롤링하지 않았거나, robots.txt·noindex 설정으로 크롤링이 차단되었을 수 있습니다.' },
        { icon: '📉', title: '콘텐츠 품질 신호 부족', desc: '저자 정보, 날짜, 출처 링크, 수치 데이터 등 E-E-A-T 신호가 부족하면 AI가 신뢰 출처로 채택하지 않습니다.' },
        { icon: '🔑', title: '키워드 관련성 부족', desc: '등록된 키워드와 실제 사이트 콘텐츠의 주제 연관성이 낮거나, AI 사용자가 실제로 묻지 않는 키워드일 수 있습니다.' },
        { icon: '⚡', title: '도메인 신뢰도 미축적', desc: '신규 도메인이거나 외부 인바운드 링크가 적어 AI 인덱스에서 낮은 신뢰 점수를 받고 있을 가능성이 있습니다.' },
      ],
    },
  }[level];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">🔬 현재 인용률 원인 분석</h3>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
          {config.icon} {config.label}
        </span>
        {isMock && <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Mock 데이터 기준</span>}
      </div>
      <p className="text-xs text-gray-500 mb-3">{config.title}:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {config.reasons.map((r, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-lg shrink-0 leading-none mt-0.5">{r.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-0.5">{r.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 인용률 개선 방법 ─────────────────────────────────── */
function CitationImprovementGuide({ rate }: { rate: number }) {
  const steps = [
    {
      priority: rate < 30 ? '🔴 최우선' : rate < 60 ? '🟡 우선' : '🟢 유지',
      icon: '✍️',
      title: '질문 형식으로 콘텐츠 재구성',
      desc: 'AI는 질문에 직접 답하는 구조를 선호합니다. 글 제목과 소제목을 "~란 무엇인가?", "~하는 방법은?" 형식으로 작성하고, 첫 단락에 명확한 정의와 핵심 답변을 배치하세요.',
      actions: ['제목을 자연어 질문 형태로 변환', '첫 단락에 직접 답변 배치 (TL;DR)', 'FAQ 섹션 추가'],
    },
    {
      priority: rate < 30 ? '🔴 최우선' : rate < 60 ? '🟡 우선' : '🟢 유지',
      icon: '🏅',
      title: 'E-E-A-T 신호 강화',
      desc: '저자 경력·전문성 명시, 콘텐츠 작성·업데이트 날짜 표기, 참고 문헌·출처 링크 추가, 실제 경험 기반 사례 포함 — 이 4가지가 AI 신뢰도 점수를 높이는 핵심 신호입니다.',
      actions: ['저자 바이오 페이지 작성 + 글에 연결', '발행일·수정일 명시', '공신력 있는 외부 출처 링크'],
    },
    {
      priority: rate < 60 ? '🟡 우선' : '🟢 유지',
      icon: '📊',
      title: '수치·데이터·정의 명확화',
      desc: 'Perplexity는 구체적인 수치, 통계, 명확한 정의가 포함된 문장을 인용하는 경향이 강합니다. "약 70%의 환자가…", "3단계 프로세스로…" 같은 정량적 표현을 적극 활용하세요.',
      actions: ['통계·수치 포함 문장 추가', '핵심 용어 명확한 1문장 정의', '표·리스트 형식 활용'],
    },
    {
      priority: rate < 60 ? '🟡 우선' : '🟢 권장',
      icon: '🗓️',
      title: '콘텐츠 최신성 유지',
      desc: 'AI는 최신 정보를 선호합니다. 기존 글의 내용을 6개월~1년 주기로 업데이트하고, 날짜를 갱신하세요. 특히 시장 트렌드·법령·가격 정보는 최신화가 인용률에 직결됩니다.',
      actions: ['발행일 기준 상위 10개 글 연간 리뷰', '"2025년 기준" 등 연도 명시', '최신 데이터로 수치 교체'],
    },
    {
      priority: '🟢 권장',
      icon: '🏗️',
      title: 'Schema Markup (구조화 데이터) 추가',
      desc: 'FAQ, HowTo, Article 스키마를 적용하면 AI 엔진이 콘텐츠 구조를 더 쉽게 파악하고 정확한 출처로 인용할 가능성이 높아집니다. 특히 FAQ 스키마는 Perplexity 인용에 효과적입니다.',
      actions: ['FAQ 스키마 적용 (질문 페이지 우선)', 'Article 스키마에 author·dateModified 포함', 'Google Rich Results Test 검증'],
    },
    {
      priority: '🟢 권장',
      icon: '🔗',
      title: '외부 백링크 및 브랜드 언급 확보',
      desc: '다른 신뢰할 수 있는 사이트에서 이 사이트를 인용·링크할수록 Perplexity의 도메인 신뢰도 점수가 올라갑니다. 협업 콘텐츠, 게스트 포스팅, 업계 디렉토리 등록을 병행하세요.',
      actions: ['업계 디렉토리·위키 등록', '게스트 블로그·인터뷰 기고', 'SNS 브랜드 언급 유도'],
    },
  ];

  const priorityColor = (p: string) =>
    p.startsWith('🔴') ? 'bg-rose-50 border-rose-200' :
    p.startsWith('🟡') ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">🚀 AI 인용률 개선 방법</h3>
      <p className="text-xs text-gray-400 mb-4">현재 인용률 {rate}% 기준 우선순위 순서로 정렬됩니다.</p>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 ${priorityColor(s.priority)}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">{s.title}</span>
                  <span className="text-[10px] font-bold text-gray-600 bg-white/70 px-2 py-0.5 rounded-full border border-gray-200">{s.priority}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.actions.map((a, j) => (
                    <span key={j} className="text-[11px] bg-white/80 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

            {/* 인용률 원인 분석 */}
            <CitationRateAnalysis rate={data.summary.citationRate} isMock={hasMock} />

            {/* 인용률 개선 방법 */}
            <CitationImprovementGuide rate={data.summary.citationRate} />

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
