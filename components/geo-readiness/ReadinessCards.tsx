'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import type { ReadinessResult, CheckResult, ReadinessVerdict } from '@/lib/geo-readiness';
import type { CepAuditResult } from '@/lib/geo-cep-audit';
import { COVERAGE_LABEL } from '@/lib/geo-cep-audit';

/* ── 판정 배지 ─────────────────────────────────── */

const VERDICT_STYLE: Record<ReadinessVerdict, { badge: string; ring: string; icon: string; blurb: string }> = {
  ready: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ring: '#059669', icon: '✅',
    blurb: '생성형 답변 엔진이 이 페이지를 출처로 채택할 근거가 충분합니다. 최신성 유지와 CEP 확장에 집중하세요.',
  },
  candidate: {
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    ring: '#0284c7', icon: '🟦',
    blurb: '인용 후보권입니다. 상위 경쟁 페이지 대비 근거(수치·출처)와 E-E-A-T 신호를 보강하면 채택률이 오릅니다.',
  },
  needs_work: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    ring: '#d97706', icon: '⚠️',
    blurb: '주제는 맞지만 AI가 발췌할 문장 단위와 근거가 부족합니다. 도입부 답변·구조화·수치 추가가 최우선입니다.',
  },
  unlikely: {
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    ring: '#e11d48', icon: '❌',
    blurb: '현재 상태로는 답변 출처로 선택되기 어렵습니다. 크롤러 접근성·구조화 데이터·본문 근거를 순서대로 해결하세요.',
  },
};

function Gauge({ score, color, size = 132 }: { score: number; color: string; size?: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" stroke="#e5e7eb" />
        <circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="9" stroke={color}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold leading-none" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function MiniBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-sky-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
    </div>
  );
}

/* ── 히어로: 총점 + 판정 ─────────────────────────── */

export function ReadinessHero({ result, cep }: { result: ReadinessResult; cep?: CepAuditResult | null }) {
  const v = VERDICT_STYLE[result.verdict];
  return (
    <div className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-indigo-500 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <Gauge score={result.score} color={v.ring} />
        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mb-2">
            <span className={`text-base font-bold px-3 py-1 rounded-full border ${v.badge}`}>
              {v.icon} {result.verdictLabel}
            </span>
            <span className="text-sm text-gray-400">GEO Readiness Score</span>
          </div>
          <p className="text-base text-gray-700 leading-relaxed mb-4">{v.blurb}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-left">
              <div className="text-xs text-gray-500 mb-0.5">콘텐츠 (10항목)</div>
              <div className="text-2xl font-bold text-emerald-700 mb-1">{result.contentScore}</div>
              <MiniBar score={result.contentScore} />
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-left">
              <div className="text-xs text-gray-500 mb-0.5">기술 (5항목)</div>
              <div className="text-2xl font-bold text-indigo-700 mb-1">{result.technicalScore}</div>
              <MiniBar score={result.technicalScore} />
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-left">
              <div className="text-xs text-gray-500 mb-0.5">CEP 대응률</div>
              <div className="text-2xl font-bold text-violet-700 mb-1">
                {cep ? `${cep.cepCoverageScore}%` : '—'}
              </div>
              {cep ? <MiniBar score={cep.cepCoverageScore} /> : <p className="text-[11px] text-gray-400">LLM 진단 미실행</p>}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400 break-all">
            {result.url} · {result.fetchedAt.slice(0, 19).replace('T', ' ')} · 본문 {result.meta.charCount.toLocaleString()}자
          </p>
        </div>
      </div>

      {result.notes.length > 0 && (
        <ul className="mt-4 space-y-1 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {result.notes.map((n, i) => (
            <li key={i} className="text-sm text-amber-800 leading-relaxed">⚠️ {n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── 인용 이유 / 어려운 이유 Top 3 ─────────────── */

export function ReasonColumns({ result }: { result: ReadinessResult }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-emerald-500 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3">✅ 인용될 가능성이 높은 이유 Top 3</h3>
        <ol className="space-y-3">
          {result.strengths.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-rose-500 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3">❌ 인용되기 어려운 이유 Top 3</h3>
        <ol className="space-y-3">
          {result.weaknesses.length === 0 && (
            <li className="text-sm text-gray-500">모든 항목이 75점 이상입니다. 구조적 결격 사유가 없습니다.</li>
          )}
          {result.weaknesses.map((w, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-sm font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{w.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{w.detail}</p>
                <p className="text-sm text-indigo-700 mt-1">💡 {w.fix}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ── 항목별 스코어카드 ─────────────────────────── */

function CheckRow({ check }: { check: CheckResult }) {
  const [open, setOpen] = useState(false);
  const tone = check.score >= 80 ? 'text-emerald-700' : check.score >= 60 ? 'text-sky-700' : check.score >= 40 ? 'text-amber-700' : 'text-rose-700';
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${check.group === 'content' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
          {check.group === 'content' ? '콘텐츠' : '기술'}
        </span>
        <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">{check.label}</span>
        <span className="hidden sm:block w-24 shrink-0"><MiniBar score={check.score} /></span>
        <span className={`w-10 text-right text-sm font-bold shrink-0 ${tone}`}>{check.score}</span>
        <span className="w-8 text-right text-[11px] text-gray-400 shrink-0">×{check.weight}</span>
        <span className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && (
        <div className="pb-4 pl-2 pr-2 space-y-2">
          {check.signals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-1">감지된 신호</p>
              <ul className="space-y-0.5">{check.signals.map((s, i) => <li key={i} className="text-sm text-gray-600">✅ {s}</li>)}</ul>
            </div>
          )}
          {check.gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-700 mb-1">부족한 점</p>
              <ul className="space-y-0.5">{check.gaps.map((g, i) => <li key={i} className="text-sm text-gray-600">⚠️ {g}</li>)}</ul>
            </div>
          )}
          <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">💡 {check.fix}</p>
        </div>
      )}
    </div>
  );
}

export function ScorecardTable({ result }: { result: ReadinessResult }) {
  const [group, setGroup] = useState<'all' | 'content' | 'technical'>('all');
  const filtered = result.checks
    .filter(c => group === 'all' || c.group === group)
    .sort((a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight);

  return (
    <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-indigo-400 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-base font-semibold text-gray-800">📊 항목별 스코어카드 <span className="text-sm font-normal text-gray-400">(개선 효과 큰 순)</span></h3>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {([['all', '전체 15'], ['content', '콘텐츠 10'], ['technical', '기술 5']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setGroup(k)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${group === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>{filtered.map(c => <CheckRow key={c.id} check={c} />)}</div>
      <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 leading-relaxed">
        가중치(×)는 총점 100점 중 이 항목이 차지하는 비중입니다. 점수가 낮고 가중치가 큰 항목을 먼저 고치면 총점이 가장 빠르게 오릅니다.
        항목을 클릭하면 감지된 신호와 부족한 점, 처방을 볼 수 있습니다.
      </p>
    </div>
  );
}

/* ── CEP 진단 ──────────────────────────────────── */

const COVERAGE_STYLE: Record<string, { chip: string; border: string }> = {
  sufficient: { chip: 'bg-emerald-100 text-emerald-800 border-emerald-300', border: 'border-l-emerald-500' },
  partial:    { chip: 'bg-amber-100 text-amber-800 border-amber-300',       border: 'border-l-amber-500' },
  missing:    { chip: 'bg-rose-100 text-rose-800 border-rose-300',          border: 'border-l-rose-500' },
};

export function CepPanel({ cep }: { cep: CepAuditResult }) {
  const counts = cep.ceps.reduce<Record<string, number>>((a, c) => { a[c.coverage] = (a[c.coverage] || 0) + 1; return a; }, {});
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-violet-500 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="text-base font-semibold text-gray-800">🎯 CEP(Category Entry Point) 진단</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">대응률 {cep.cepCoverageScore}%</span>
          <span className="text-[11px] text-gray-400">모델 {cep.model}</span>
        </div>
        {cep.summary && <p className="text-sm text-gray-700 leading-relaxed mb-3">{cep.summary}</p>}
        <div className="flex gap-2 flex-wrap">
          {(['sufficient', 'partial', 'missing'] as const).map(k => (
            <span key={k} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${COVERAGE_STYLE[k].chip}`}>
              {COVERAGE_LABEL[k]} {counts[k] || 0}개
            </span>
          ))}
        </div>
        {cep.truncated && (
          <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            ⚠️ 응답이 길이 상한에 걸려 일부 항목이 잘렸을 수 있습니다. 다시 실행하면 완전한 결과를 받을 확률이 높습니다.
          </p>
        )}
        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
          CEP는 사용자가 AI에게 실제로 질문하게 되는 &lsquo;상황 진입점&rsquo;입니다. 어떤 키워드로 검색하는지가 아니라 누가·언제·왜 묻는지,
          어떤 경험과 제약을 가지고 무엇을 기준으로 선택하는지를 봅니다. 대응률이 낮은 상황부터 콘텐츠를 보강하면
          생성형 AI가 이 페이지를 인용해야 할 이유가 구체적으로 생깁니다.
        </p>
      </div>

      {cep.ceps.map((c, i) => {
        const st = COVERAGE_STYLE[c.coverage];
        return (
          <div key={c.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${st.border} p-5 shadow-sm`}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <h4 className="text-base font-semibold text-gray-800 flex-1 min-w-0">
                <span className="text-gray-400 mr-1.5">CEP {i + 1}.</span>{c.situation}
              </h4>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${st.chip}`}>{COVERAGE_LABEL[c.coverage]}</span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 text-sm mb-3">
              {([['누가', c.who], ['언제', c.when], ['왜', c.why], ['제약', c.constraint]] as const)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="shrink-0 w-10 text-gray-400 text-xs pt-0.5">{k}</dt>
                    <dd className="flex-1 text-gray-700">{v}</dd>
                  </div>
                ))}
            </dl>

            {c.decisionCriteria.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">선택 기준</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.decisionCriteria.map((d, j) => (
                    <span key={j} className="text-xs bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {c.likelyQuestions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">AI에게 물을 법한 질문</p>
                <ul className="space-y-1">
                  {c.likelyQuestions.map((q, j) => (
                    <li key={j} className="text-sm text-gray-700 bg-sky-50 border border-sky-100 rounded-lg px-3 py-1.5">&ldquo;{q}&rdquo;</li>
                  ))}
                </ul>
              </div>
            )}

            {c.coverageReason && (
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
                <span className="font-semibold text-gray-700">판정 근거 </span>{c.coverageReason}
              </p>
            )}

            {c.rewrite && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500">제품 중심 → 상황 중심 재작성안</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <p className="text-[11px] font-bold text-rose-600 mb-1">BEFORE</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.rewrite.before || '(해당 문장 없음)'}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-[11px] font-bold text-emerald-700 mb-1">AFTER</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{c.rewrite.after}</p>
                  </div>
                </div>
                {c.rewrite.evidenceNeeded.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-1">이 문장을 뒷받침하려면 추가로 확보할 근거</p>
                    <ul className="space-y-0.5">
                      {c.rewrite.evidenceNeeded.map((e, j) => <li key={j} className="text-sm text-amber-900">• {e}</li>)}
                    </ul>
                  </div>
                )}
                <CopyBox label="AFTER 문장 복사" text={c.rewrite.after} compact />
              </div>
            )}
          </div>
        );
      })}

      {cep.qualitative.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-amber-400 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-3">🔍 정성 평가 (휴리스틱이 잡지 못하는 문제)</h3>
          <ul className="space-y-2">
            {cep.qualitative.map((q, i) => (
              <li key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    q.severity === 'high' ? 'bg-rose-100 text-rose-700' : q.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                  }`}>{q.severity}</span>
                  <span className="text-sm font-semibold text-gray-800">{q.title}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{q.detail}</p>
                {q.fix && <p className="text-sm text-indigo-700 mt-1">💡 {q.fix}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cep.improvedLead && (
        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-emerald-500 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">✍️ 상황 중심으로 다시 쓴 도입부</h3>
          <p className="text-xs text-gray-400 mb-3">대괄호 [ ] 부분은 실제 수치·출처로 채워야 합니다. 검증되지 않은 값을 그대로 게시하지 마세요.</p>
          <CopyBox label="도입부 복사" text={cep.improvedLead} />
        </div>
      )}
    </div>
  );
}

/* ── 복사 박스 ─────────────────────────────────── */

export function CopyBox({ label, text, lang, compact }: { label: string; text: string; lang?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-gray-500">{label}{lang && <code className="ml-1.5 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{lang}</code>}</span>
        <button onClick={copy}
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
            copied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}>
          {copied ? '✓ 복사됨' : '📋 복사'}
        </button>
      </div>
      <pre className={`bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap break-all ${compact ? 'max-h-32' : 'max-h-72'} overflow-y-auto`}>
        {text}
      </pre>
    </div>
  );
}

/* ── 스니펫 패널 ───────────────────────────────── */

export function SnippetPanel({ result }: { result: ReadinessResult }) {
  const tabs = [
    { id: 'lead', label: '개선된 도입부', text: result.snippets.improvedLead, lang: 'text' },
    { id: 'robots', label: 'robots.txt', text: result.snippets.robotsTxt, lang: 'text' },
    { id: 'jsonld', label: 'JSON-LD', text: result.snippets.jsonLd, lang: 'json' },
    { id: 'llms', label: 'llms.txt', text: result.snippets.llmsTxt, lang: 'text' },
  ];
  const [active, setActive] = useState('lead');
  const cur = tabs.find(t => t.id === active) || tabs[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-cyan-500 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-1">📋 즉시 적용 스니펫</h3>
      <p className="text-xs text-gray-400 mb-3">그대로 복사해 붙여 넣을 수 있습니다. 대괄호 [ ] 플레이스홀더는 실제 값으로 교체하세요.</p>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-3 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${active === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <CopyBox label={cur.label} text={cur.text} lang={cur.lang} />
    </div>
  );
}

/* ── 사이트 단위 요약 (다수 페이지 스캔) ─────────── */

export interface SiteSummary {
  pagesScanned: number;
  avgScore: number;
  avgContentScore: number;
  avgTechnicalScore: number;
  verdictCounts: Record<string, number>;
  weakestChecks: { id: string; label: string; group: string; weight: number; avgScore: number; fix: string }[];
  strongestChecks: { id: string; label: string; avgScore: number }[];
}

export function SiteSummaryCards({ summary }: { summary: SiteSummary }) {
  const order: ReadinessVerdict[] = ['ready', 'candidate', 'needs_work', 'unlikely'];
  const labels: Record<ReadinessVerdict, string> = {
    ready: '인용 준비됨', candidate: '인용 후보', needs_work: '보강 필요', unlikely: '인용 어려움',
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">평균 GEO 점수</div>
          <div className="text-3xl font-bold text-indigo-700">{summary.avgScore}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{summary.pagesScanned}개 페이지 기준</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">콘텐츠 평균</div>
          <div className="text-3xl font-bold text-emerald-700">{summary.avgContentScore}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">10개 항목</div>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">기술 평균</div>
          <div className="text-3xl font-bold text-cyan-700">{summary.avgTechnicalScore}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">5개 항목</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1.5">판정 분포</div>
          <div className="space-y-0.5">
            {order.map(k => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-gray-600">{labels[k]}</span>
                <span className="font-bold text-gray-800">{summary.verdictCounts[k] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-rose-400 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-1">🔧 사이트 전체에서 가장 약한 항목</h3>
        <p className="text-xs text-gray-400 mb-3">여러 페이지에서 공통으로 낮은 항목입니다. 개별 글 수정보다 템플릿·레이아웃 차원에서 한 번에 고치는 편이 효율적입니다.</p>
        <div className="space-y-2">
          {summary.weakestChecks.map(c => (
            <div key={c.id} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${c.group === 'content' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                {c.group === 'content' ? '콘텐츠' : '기술'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">{c.label}</span>
                  <span className="text-sm font-bold text-rose-600">평균 {c.avgScore}점</span>
                  <span className="text-[11px] text-gray-400">가중치 ×{c.weight}</span>
                </div>
                <MiniBar score={c.avgScore} />
                <p className="text-sm text-indigo-700 mt-1.5">💡 {c.fix}</p>
              </div>
            </div>
          ))}
        </div>
        {summary.strongestChecks.length > 0 && (
          <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span className="font-semibold text-emerald-700">잘 되어 있는 항목: </span>
            {summary.strongestChecks.map(c => `${c.label} ${c.avgScore}점`).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── 추이 차트 ─────────────────────────────────── */

export function ReadinessTrendChart({ data }: { data: { date: string; avg_score: number; content: number; technical: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-violet-400 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3">📈 인용 준비도 추이</h3>
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">
          측정 이력이 2회 이상 쌓이면 추이가 표시됩니다.
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-violet-400 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 bg-violet-500 rounded-full shrink-0" />
        <h3 className="text-base font-semibold text-gray-800">📈 인용 준비도 추이 (60일)</h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="avg_score" name="총점" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="content" name="콘텐츠" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="technical" name="기술" stroke="#0891b2" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
        총점(남색)이 상승하면 콘텐츠가 점점 인용되기 쉬운 형태로 정리되고 있다는 뜻입니다.
        기술 점수(청록)는 robots.txt·JSON-LD·llms.txt 같은 사이트 전역 설정이라 한 번 고치면 계단식으로 오르고,
        콘텐츠 점수(녹색)는 글마다 개선해야 하므로 완만하게 올라갑니다.
        기술 점수가 먼저 올라간 뒤에도 콘텐츠 점수가 정체된다면 도입부 답변·수치 근거·E-E-A-T 신호를 우선 보강하세요.
      </p>
    </div>
  );
}

/* ── 페이지 목록 (다수 스캔 결과) ───────────────── */

export function PageList({
  results,
  onSelect,
  selectedUrl,
}: {
  results: { url: string; score: number; verdict: string; contentScore: number; technicalScore: number }[];
  onSelect: (url: string) => void;
  selectedUrl?: string;
}) {
  const labels: Record<string, { text: string; chip: string }> = {
    ready: { text: '인용 준비됨', chip: 'bg-emerald-100 text-emerald-800' },
    candidate: { text: '인용 후보', chip: 'bg-sky-100 text-sky-800' },
    needs_work: { text: '보강 필요', chip: 'bg-amber-100 text-amber-800' },
    unlikely: { text: '인용 어려움', chip: 'bg-rose-100 text-rose-800' },
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-gray-400 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-1">📄 페이지별 결과 <span className="text-sm font-normal text-gray-400">({results.length}개 · 낮은 점수 먼저)</span></h3>
      <p className="text-xs text-gray-400 mb-3">행을 클릭하면 해당 페이지의 15개 항목 스코어카드와 스니펫을 볼 수 있습니다.</p>
      <div className="divide-y divide-gray-100">
        {results.map(r => {
          const l = labels[r.verdict] || labels.needs_work;
          const active = r.url === selectedUrl;
          return (
            <button key={r.url} onClick={() => onSelect(r.url)}
              className={`w-full flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg text-left transition-colors ${active ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
              <span className={`text-lg font-bold w-10 text-right shrink-0 ${r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-sky-600' : r.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                {r.score}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${l.chip}`}>{l.text}</span>
              <span className="flex-1 min-w-0 text-sm text-gray-700 truncate" title={r.url}>
                {r.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
              </span>
              <span className="hidden md:block text-[11px] text-gray-400 shrink-0">콘텐츠 {r.contentScore} · 기술 {r.technicalScore}</span>
              <span className={`text-gray-400 shrink-0 ${active ? 'text-indigo-500' : ''}`}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
