'use client';

/**
 * GEO 인용 준비도 대시보드
 *
 * 크롬 익스텐션의 "현재 보고 있는 1페이지 진단"을
 * "사이트맵 기반 다수 페이지 일괄 진단 + 추이 축적"으로 확장한 화면.
 *
 * - 단일 URL 진단: 키 없이 15개 항목 로컬 휴리스틱 즉시 실행
 * - 사이트맵 일괄 진단: 사이트맵에서 균등 샘플링 → 항목별 평균 → Supabase 저장
 * - CEP 진단: LLM 키가 서버에 있을 때만 활성 (본문은 Anthropic 외 어디에도 전송되지 않음)
 */

import { useCallback, useEffect, useState, use } from 'react';
import Link from 'next/link';
import SiteTabs from '@/components/shared/SiteTabs';
import { getSiteConfig } from '@/lib/indexing-sites';
import type { ReadinessResult } from '@/lib/geo-readiness';
import type { CepAuditResult } from '@/lib/geo-cep-audit';
import {
  ReadinessHero, ReasonColumns, ScorecardTable, SnippetPanel, CepPanel,
  SiteSummaryCards, ReadinessTrendChart, PageList, type SiteSummary,
} from '@/components/geo-readiness/ReadinessCards';
import { downloadMarkdown, downloadHtml, downloadDocx } from '@/lib/geo-readiness-export';

interface StatusResponse {
  ok: boolean;
  siteId: string;
  configured: boolean;
  llmConfigured: boolean;
  schemaError?: string;
  latest: {
    id: string;
    taken_at: string;
    pages_scanned: number;
    avg_score: number;
    avg_content_score: number;
    avg_technical_score: number;
    verdict_counts: Record<string, number>;
    check_averages: SiteSummary['weakestChecks'];
    source: string | null;
  } | null;
  pages: {
    url: string; score: number; verdict: string;
    content_score: number; technical_score: number;
    checks: ReadinessResult['checks'];
    strengths: ReadinessResult['strengths'];
    weaknesses: ReadinessResult['weaknesses'];
    meta: ReadinessResult['meta'];
  }[];
  history: { date: string; avg_score: number; content: number; technical: number; pages: number }[];
}

interface ScanResponse {
  ok: boolean;
  source: string;
  summary: SiteSummary;
  results: ReadinessResult[];
  saved: boolean;
  saveError?: string;
  error?: string;
}

export default function GeoReadinessPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params);
  const staticCfg = getSiteConfig(siteId);
  const [customCfg, setCustomCfg] = useState<{ label: string; domain: string; emoji: string } | null>(null);
  const cfg = staticCfg || customCfg;

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [selected, setSelected] = useState<ReadinessResult | null>(null);
  const [cep, setCep] = useState<CepAuditResult | null>(null);

  const [singleUrl, setSingleUrl] = useState('');
  const [sampleSize, setSampleSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/geo-readiness/status?siteId=${encodeURIComponent(siteId)}`);
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `오류 ${res.status}`);
      setStatus(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    load();
    if (!staticCfg) {
      fetch('/api/indexing/sites')
        .then(r => r.json())
        .then(j => {
          const found = (j.sites || []).find((s: { id: string }) => s.id === siteId);
          if (found) setCustomCfg({ label: found.label, domain: found.domain, emoji: found.emoji || '🌐' });
        })
        .catch(() => {});
    }
  }, [siteId, staticCfg, load]);

  /** 사이트맵 기반 일괄 진단 */
  async function runSiteScan() {
    setScanning(true);
    setError(null);
    setNotice(null);
    setCep(null);
    try {
      const res = await fetch('/api/geo-readiness/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, sampleSize, sitemapUrl: staticCfg?.sitemapUrl }),
      });
      const j: ScanResponse = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `오류 ${res.status}`);
      setScan(j);
      setSelected(j.results[0] ?? null);
      if (j.saveError) setNotice(`측정은 완료됐지만 저장에 실패했습니다: ${j.saveError}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setScanning(false);
  }

  /** 단일 URL 진단 (저장하지 않음) */
  async function runSingleScan() {
    const url = singleUrl.trim();
    if (!url) return;
    setScanning(true);
    setError(null);
    setNotice(null);
    setCep(null);
    try {
      const res = await fetch('/api/geo-readiness/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const j: ScanResponse = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `오류 ${res.status}`);
      setScan(j);
      setSelected(j.results[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setScanning(false);
  }

  /** 선택된 페이지에 대한 CEP 진단 (LLM) */
  async function runCep() {
    if (!selected) return;
    setCepLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/geo-readiness/cep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: selected.url,
          weakChecks: selected.checks.filter(c => c.score < 60).map(c => `${c.label} (${c.score}점): ${c.gaps.slice(0, 2).join(' / ')}`),
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.cep) throw new Error(j.error || `오류 ${res.status}`);
      setCep(j.cep);
      if (j.local) setSelected(j.local);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    }
    setCepLoading(false);
  }

  /** 저장된 스냅샷의 페이지 행을 ReadinessResult 형태로 복원 */
  function restoreFromSnapshot(row: StatusResponse['pages'][number]): ReadinessResult {
    return {
      url: row.url,
      fetchedAt: status?.latest?.taken_at || new Date().toISOString(),
      score: row.score,
      verdict: row.verdict as ReadinessResult['verdict'],
      verdictLabel: ({ ready: '인용 준비됨', candidate: '인용 후보', needs_work: '보강 필요', unlikely: '인용 어려움' } as Record<string, string>)[row.verdict] || row.verdict,
      contentScore: row.content_score,
      technicalScore: row.technical_score,
      checks: row.checks || [],
      strengths: row.strengths || [],
      weaknesses: row.weaknesses || [],
      meta: row.meta,
      snippets: { robotsTxt: '', jsonLd: '', llmsTxt: '', improvedLead: '' },
      notes: ['저장된 스냅샷을 복원한 결과입니다. 스니펫과 최신 상태는 「지금 측정」으로 다시 진단하세요.'],
    };
  }

  const summary: SiteSummary | null = scan?.summary ?? (status?.latest ? {
    pagesScanned: status.latest.pages_scanned,
    avgScore: status.latest.avg_score,
    avgContentScore: status.latest.avg_content_score,
    avgTechnicalScore: status.latest.avg_technical_score,
    verdictCounts: status.latest.verdict_counts || {},
    weakestChecks: (status.latest.check_averages || []).slice(0, 5),
    strongestChecks: [...(status.latest.check_averages || [])].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3)
      .map(c => ({ id: c.id, label: c.label, avgScore: c.avgScore })),
  } : null);

  const pageRows = scan
    ? scan.results.map(r => ({ url: r.url, score: r.score, verdict: r.verdict, contentScore: r.contentScore, technicalScore: r.technicalScore }))
    : (status?.pages || []).map(p => ({ url: p.url, score: p.score, verdict: p.verdict, contentScore: p.content_score, technicalScore: p.technical_score }));

  function selectUrl(url: string) {
    setCep(null);
    const fromScan = scan?.results.find(r => r.url === url);
    if (fromScan) { setSelected(fromScan); return; }
    const row = status?.pages.find(p => p.url === url);
    if (row) setSelected(restoreFromSnapshot(row));
  }

  const canExport = !!selected;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/40 to-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4 pb-4 border-b-2 border-violet-100">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {cfg ? `${cfg.emoji} ${cfg.label}` : '🎯 인용 준비도'}
              </h1>
              <p className="text-base text-gray-500 mt-1">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">{cfg?.domain || siteId}</code>
                <Link href="/dashboard/indexing" className="ml-3 text-sm text-indigo-600 hover:underline">← 사이트 목록</Link>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={load} disabled={loading}
                className="px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm disabled:opacity-50">
                {loading ? '로딩…' : '↻ 새로고침'}
              </button>
              <button onClick={runSiteScan} disabled={scanning}
                className="px-4 py-2 text-base font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:bg-gray-400 shadow-sm">
                {scanning ? `측정 중… (${sampleSize}p)` : '🔄 지금 측정'}
              </button>
            </div>
          </div>
          <SiteTabs siteId={siteId} active="geo-readiness" />
        </div>

        {/* 소개 */}
        <div className="mb-4 p-5 bg-white rounded-xl border border-gray-200 border-l-4 border-l-violet-500 shadow-sm">
          <p className="text-base text-gray-800 leading-relaxed mb-2">
            <strong>SEO는 검색 결과에서 발견되기 위한 최적화</strong>였지만, <strong>GEO는 생성형 AI의 답변 안에서 선택되고 인용되기 위한 최적화</strong>입니다.
            이 화면은 ChatGPT · Perplexity · Gemini · Google AI Overviews가 이 사이트의 페이지를 <em>출처로 인용할 만한가</em>를
            콘텐츠 10개 + 기술 5개, 총 15개 항목으로 0~100점 채점합니다.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            15개 항목은 정규식·HTML 구조 분석 기반 <strong>로컬 휴리스틱</strong>이라 LLM 키 없이 즉시 진단됩니다.
            여기에 CEP 진단을 실행하면 정성 평가와 문장 재작성안(Before → After)까지 받을 수 있습니다.
            페이지 본문은 GEO-AIO 서버가 대신 수집해 Anthropic으로만 전송되며, 별도 애널리틱스·텔레메트리는 사용하지 않습니다.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 rounded-lg text-base text-rose-700">
            ❌ {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-lg text-base text-amber-800">
            ⚠️ {notice}
          </div>
        )}
        {status?.schemaError && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-lg text-sm text-amber-800">
            ⚠️ 추이 저장용 테이블이 아직 없습니다. <code className="bg-white px-1.5 py-0.5 rounded">docs/geo-readiness-supabase-schema.sql</code>을
            Supabase SQL Editor에서 실행하면 측정 이력이 누적됩니다. (진단 자체는 지금도 동작합니다 · {status.schemaError})
          </div>
        )}

        {/* 측정 컨트롤 */}
        <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-violet-400 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-1">🗺️ 사이트맵 일괄 진단</h3>
            <p className="text-xs text-gray-400 mb-3">
              사이트맵 전체에서 균등 간격으로 표본을 뽑습니다. 앞쪽만 보면 최신 글에만 편향되기 때문입니다. 결과는 스냅샷으로 저장돼 추이가 쌓입니다.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm text-gray-600">표본 수</label>
              <select value={sampleSize} onChange={e => setSampleSize(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
                {[5, 10, 20, 30].map(n => <option key={n} value={n}>{n}개 페이지</option>)}
              </select>
              <button onClick={runSiteScan} disabled={scanning}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:bg-gray-400">
                {scanning ? '측정 중…' : '일괄 진단 실행'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-cyan-400 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-1">🔗 단일 URL 진단</h3>
            <p className="text-xs text-gray-400 mb-3">
              이 사이트 외의 URL(경쟁사 페이지 포함)도 진단할 수 있습니다. 단일 진단 결과는 저장되지 않습니다.
            </p>
            <div className="flex gap-2">
              <input value={singleUrl} onChange={e => setSingleUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSingleScan(); }}
                placeholder="https://example.com/blog/post"
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
              <button onClick={runSingleScan} disabled={scanning || !singleUrl.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 shrink-0">
                진단
              </button>
            </div>
          </div>
        </div>

        {/* 사이트 요약 + 추이 */}
        {summary && (
          <div className="space-y-4 mb-4">
            <SiteSummaryCards summary={summary} />
            <ReadinessTrendChart data={status?.history || []} />
          </div>
        )}

        {/* 페이지 목록 */}
        {pageRows.length > 1 && (
          <div className="mb-4">
            <PageList results={pageRows} onSelect={selectUrl} selectedUrl={selected?.url} />
          </div>
        )}

        {/* 선택 페이지 상세 */}
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <h2 className="text-xl font-bold text-gray-900">📄 페이지 상세 진단</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={runCep} disabled={cepLoading || !status?.llmConfigured}
                  title={status?.llmConfigured ? 'LLM으로 CEP 6~8개 도출 + 문장 재작성안' : '서버에 ANTHROPIC_API_KEY가 없어 CEP 진단을 실행할 수 없습니다.'}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400">
                  {cepLoading ? 'CEP 분석 중… (약 30초)' : '🎯 CEP 진단 실행'}
                </button>
                <button onClick={() => downloadMarkdown({ result: selected, cep })} disabled={!canExport}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">📝 MD</button>
                <button onClick={() => downloadHtml({ result: selected, cep })} disabled={!canExport}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">🌐 HTML</button>
                <button onClick={() => downloadDocx({ result: selected, cep })} disabled={!canExport}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">📄 DOCX</button>
              </div>
            </div>

            {!status?.llmConfigured && (
              <p className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-lg p-3">
                ℹ️ 서버에 LLM 키가 설정되지 않아 CEP 진단은 비활성 상태입니다. 15개 항목 스코어카드와 스니펫은 키 없이도 모두 제공됩니다.
              </p>
            )}

            <ReadinessHero result={selected} cep={cep} />
            <ReasonColumns result={selected} />
            <ScorecardTable result={selected} />
            {selected.snippets.jsonLd && <SnippetPanel result={selected} />}
            {cep && <CepPanel cep={cep} />}
          </div>
        )}

        {/* 최초 진입 안내 */}
        {!selected && !summary && !loading && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-base font-semibold text-gray-800 mb-1">아직 측정 이력이 없습니다.</p>
            <p className="text-sm text-gray-500 mb-4">
              「일괄 진단 실행」으로 사이트맵 표본을 진단하거나, 단일 URL을 입력해 바로 확인하세요. LLM 키 없이 15개 항목이 즉시 채점됩니다.
            </p>
            <button onClick={runSiteScan} disabled={scanning}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:bg-gray-400">
              {scanning ? '측정 중…' : '지금 측정하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
