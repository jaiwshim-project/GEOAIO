'use client';

// 단체 고객(병원·기업·정치·공공기관) 대상 GEO-AIO 솔루션 안내 페이지
// 신규 라우트 — 기존 페이지 영향 없음

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SEGMENTS = [
  {
    icon: '🏥',
    name: '병원·의료기관',
    headline: '환자가 AI에게 시술을 물어보는 시대',
    bullets: [
      '"대전 임플란트 어디가 좋아?" → ChatGPT가 우리 병원 인용',
      '외국인 환자 유치 — 영·중·일 다국어 자산 영구 누적',
      'E-E-A-T 자동 구조화 (원장 권위·시술 사례·환자 후기)',
      'JSON-LD 4종 자동 적용 (FAQ·HowTo·Article·Breadcrumb)',
    ],
    case: { name: '디지털스마일치과', href: '/report.html' },
    color: 'from-sky-500 via-blue-500 to-cyan-500',
    accent: 'text-sky-700',
    bg: 'from-sky-50 to-cyan-50',
  },
  {
    icon: '🏢',
    name: '기업 (B2B·기술)',
    headline: '의사결정자가 AI로 기술을 검증하는 시대',
    bullets: [
      '"한화시스템 ECS가 무엇인가" → AI가 우리 글로 답변',
      '13개 구조(정의문·FAQ·비교표) → 정확한 인용 보장',
      '글로벌 시장 — 영문 기술 문서 자동 발행',
      '경쟁사 대비 첫 답변 우위 = 영업 우선순위 확보',
    ],
    case: { name: '한화시스템 ECS 사례', href: '/blog' },
    color: 'from-slate-700 via-indigo-700 to-slate-800',
    accent: 'text-indigo-700',
    bg: 'from-indigo-50 to-slate-50',
  },
  {
    icon: '🗳️',
    name: '정치 후보자·캠프',
    headline: '박빙 지역, 다문화 유권자가 결정',
    bullets: [
      '인천 연수갑 외국 출신 유권자 3,294명 = 평균 박빙 표차의 2배',
      '영·중·일 다국어 발행 → 다문화 유권자 도달',
      '동일 선거구 단독 계약 독점권 — 1지역구 1후보',
      '24~72시간 내 AI 인용 시작 (3주 캠페인에 적합)',
    ],
    case: { name: '6·3 지방선거 양자 대결', href: '/proposal/election-2026' },
    color: 'from-amber-500 via-orange-500 to-rose-500',
    accent: 'text-amber-700',
    bg: 'from-amber-50 to-rose-50',
  },
  {
    icon: '🏛️',
    name: '공공기관·정부',
    headline: '시민의 정책 질문에 AI가 정확히 답하게',
    bullets: [
      '정책 보도자료 → 13개 구조 변환 → AI 인용형 콘텐츠',
      '다국어 행정 — 외국인 주민 대상 영·중·일 자동 발행',
      '정책 이해도 측정 — GSC 색인률·AI 인용 빈도 KPI',
      '민원 감소 효과 — 자주 묻는 질문 자동 정리',
    ],
    case: { name: '맞춤 시연 요청', href: 'mailto:jaiwshim@gmail.com' },
    color: 'from-emerald-500 via-teal-500 to-green-500',
    accent: 'text-emerald-700',
    bg: 'from-emerald-50 to-teal-50',
  },
];

const VALUES = [
  {
    icon: '📐',
    title: '13개 구조 AI 인용 템플릿',
    desc: '정의문·요약문·FAQ·비교표·핵심 문장 5종을 자동 적용. ChatGPT·Gemini·Perplexity가 인용하기 좋은 형식으로 매 글 변환.',
  },
  {
    icon: '🎭',
    title: '15톤 자동 생성 (다관점 반복)',
    desc: '같은 주제를 전문·친근·감성·뉴스 등 15가지 톤으로 발행. 단순 중복은 신뢰 ↓, 다관점 반복은 AI가 "사실"로 인식 ↑.',
  },
  {
    icon: '🌐',
    title: '다국어 자동 번역·발행',
    desc: '한국어 1편 → 영·중·일 자동 번역·동시 발행. 외국인 고객·해외 시장·다문화 유권자 도달. 영구 자산으로 누적.',
  },
  {
    icon: '📊',
    title: '측정 가능한 KPI',
    desc: 'Google Search Console 색인률 + Perplexity·ChatGPT 인용 발생 빈도 자동 추적. 분기별 보고서로 효과 가시화.',
  },
  {
    icon: '🔗',
    title: '백링크 캠페인',
    desc: 'Tistory(metabiz101 5,400편)·LinkedIn 자체 자산을 활용한 도메인 권위 가속. 외부 도메인 빌딩(블랙햇) 없이 안전.',
  },
  {
    icon: '⚡',
    title: '24~72시간 내 인용 발생',
    desc: '게시 즉시 Google 색인 → 수일 내 ChatGPT·Gemini·Perplexity가 인용·추천. 일반 SEO(1~2개월) 대비 압도적.',
  },
];

const COMPARISON = [
  { axis: '목표', traditional: '키워드 검색 순위', geoaio: 'AI 답변 인용', winner: 'geoaio' },
  { axis: '측정', traditional: '클릭·노출수', geoaio: 'AI 인용률 + GSC 색인', winner: 'geoaio' },
  { axis: '콘텐츠', traditional: '사람 작성 (편당 비용↑)', geoaio: '15톤 × 4언어 자동 생성', winner: 'geoaio' },
  { axis: '다국어', traditional: '별도 외주 (편당 5~10만원)', geoaio: '자동 번역 무상 포함', winner: 'geoaio' },
  { axis: '효과 발생', traditional: '1~2개월', geoaio: '24~72시간', winner: 'geoaio' },
  { axis: '운영 비용', traditional: '월 500~2,000만원', geoaio: '자동화로 80% 절감', winner: 'geoaio' },
];

const TIERS = [
  {
    badge: 'STARTER',
    name: '소규모 단체',
    target: '1인 전문가·소규모 의원·로컬 사업자',
    volume: '월 50~100편',
    features: [
      '15톤 자동 생성 (한국어)',
      'GSC 색인 모니터링',
      '13개 구조 자동 적용',
      'JSON-LD 4종 자동 삽입',
    ],
    color: 'from-slate-100 to-slate-200',
    accent: 'text-slate-700',
    border: 'border-slate-300',
    recommended: false,
  },
  {
    badge: 'PRO ⭐',
    name: '중규모 단체',
    target: '중견 병원·전문 클리닉·정치 후보자·중소기업',
    volume: '월 100~150편 + 다국어 50편',
    features: [
      'Starter 전체 +',
      '영·중·일 자동 번역·발행',
      'AI 인용 측정 (Perplexity·ChatGPT)',
      '카테고리 자동 분류 + 백링크 캠페인',
      '분기별 성과 보고서',
    ],
    color: 'from-amber-100 to-orange-100',
    accent: 'text-amber-700',
    border: 'border-amber-400',
    recommended: true,
  },
  {
    badge: 'ENTERPRISE',
    name: '대형 단체',
    target: '대기업·대형 병원·공공기관·정당 본부',
    volume: '무제한 발행',
    features: [
      'Pro 전체 +',
      '13개 구조 업종별 맞춤 템플릿',
      '전담 컨설턴트 + 월간 인터뷰',
      'Neo4j 링크 그래프 시각화',
      '부가: 100공약·33일 유세·기술 권위 콘텐츠 맵',
    ],
    color: 'from-indigo-100 to-violet-100',
    accent: 'text-indigo-700',
    border: 'border-indigo-400',
    recommended: false,
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ── Section 1. 히어로 ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-12 sm:py-16 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[11px] font-bold tracking-[0.2em] text-amber-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              AI CITATION OS · ENTERPRISE SOLUTION
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-3">
              <span className="block">검색 시대는 끝났습니다.</span>
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                의사결정자는 이제 AI에게 묻습니다.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-200/95 leading-relaxed max-w-3xl mb-6">
              ChatGPT·Gemini·Perplexity가 답변에 <strong className="text-amber-300">단 1~3개 출처</strong>만 인용합니다.
              <strong className="text-white"> 그 1~3개에 들어가는 13개 구조와 15톤 자동화</strong>가 우리의 차별점입니다.
              병원·기업·정치 후보자·공공기관의 <strong className="text-amber-300">AI 시대 검색 자산</strong>을 24~72시간 내에 구축합니다.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="mailto:jaiwshim@gmail.com"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold rounded-full shadow-lg hover:from-amber-400 hover:to-amber-500 transition-colors"
              >
                무료 시연 신청
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <a
                href="tel:010-2397-5734"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white text-sm font-bold rounded-full hover:bg-white/20 transition-colors"
              >
                📞 010-2397-5734
              </a>
              <a
                href="#cases"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white text-sm font-bold rounded-full hover:bg-white/20 transition-colors"
              >
                실제 사례 보기 ↓
              </a>
            </div>
          </div>
        </section>

        {/* ── Section 2. 6가지 차별 가치 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 ring-2 ring-violet-300/50 flex items-center justify-center text-base font-bold shadow-md">1</span>
            <h2 className="text-xl font-extrabold text-gray-900">6가지 차별 가치</h2>
          </div>
          <p className="text-base text-gray-700 mb-5 leading-relaxed">
            일반 SEO·PR 회사가 가진 적 없는 <strong>AI 인용 우선 설계</strong> 자산입니다.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-2xl mb-2">{v.icon}</div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1.5 leading-tight">{v.title}</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3. 4개 세그먼트별 가치 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 ring-2 ring-emerald-300/50 flex items-center justify-center text-base font-bold shadow-md">2</span>
            <h2 className="text-xl font-extrabold text-gray-900">단체 유형별 적용 가치</h2>
          </div>
          <p className="text-base text-gray-700 mb-5 leading-relaxed">
            업종 특성에 맞춰 <strong>13개 구조 템플릿</strong>·<strong>다국어 발행</strong>·<strong>측정 KPI</strong>를 조합합니다.
          </p>
          <div id="cases" className="grid sm:grid-cols-2 gap-4">
            {SEGMENTS.map((s, i) => (
              <div key={i} className={`relative bg-gradient-to-br ${s.bg} border-2 border-slate-200 rounded-2xl p-5 shadow-md overflow-hidden`}>
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${s.color}`} />
                <div className={`absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br ${s.color} opacity-15 rounded-full blur-2xl pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl">{s.icon}</span>
                    <h3 className="text-lg font-extrabold text-slate-900">{s.name}</h3>
                  </div>
                  <p className={`text-sm font-bold ${s.accent} mb-3 italic`}>{s.headline}</p>
                  <ul className="space-y-1.5 text-sm text-slate-800 mb-4">
                    {s.bullets.map((b, bi) => (
                      <li key={bi} className="flex gap-2 leading-snug">
                        <span className={`shrink-0 ${s.accent} font-bold`}>·</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={s.case.href}
                    target={s.case.href.startsWith('http') || s.case.href.startsWith('mailto') ? '_blank' : undefined}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${s.color} text-white text-xs font-extrabold rounded-full shadow-sm hover:shadow-md transition-colors`}
                  >
                    📂 {s.case.name}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4. 비교표 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 ring-2 ring-rose-300/50 flex items-center justify-center text-base font-bold shadow-md">3</span>
            <h2 className="text-xl font-extrabold text-gray-900">일반 SEO/PR 회사 vs GEO-AIO</h2>
          </div>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="text-left p-3 font-bold text-slate-700">비교축</th>
                  <th className="text-center p-3 font-bold text-slate-700">일반 SEO/PR</th>
                  <th className="text-center p-3 font-bold text-emerald-700">GEO-AIO ⭐</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-3 font-bold text-slate-800">{row.axis}</td>
                    <td className="p-3 text-center text-gray-600">{row.traditional}</td>
                    <td className="p-3 text-center font-bold text-emerald-800 bg-emerald-50/40">{row.geoaio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Section 5. 티어 패키지 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-300/50 flex items-center justify-center text-base font-bold shadow-md">4</span>
            <h2 className="text-xl font-extrabold text-gray-900">티어 패키지</h2>
          </div>
          <p className="text-base text-gray-700 mb-5 leading-relaxed">
            단체 규모와 발행 양에 맞춰 <strong>3개 티어</strong>를 제공합니다. 정확한 견적은 상담 후 산정됩니다.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {TIERS.map((tier, i) => (
              <div
                key={i}
                className={`relative bg-gradient-to-br ${tier.color} border-2 ${tier.border} rounded-2xl p-5 shadow-md ${
                  tier.recommended ? 'ring-4 ring-amber-300/60 sm:scale-[1.03]' : ''
                }`}
              >
                {tier.recommended && (
                  <span className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                    추천
                  </span>
                )}
                <div className={`text-[11px] font-extrabold tracking-[0.2em] ${tier.accent} mb-1`}>{tier.badge}</div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{tier.name}</h3>
                <p className="text-xs text-slate-700 mb-2 leading-snug">{tier.target}</p>
                <p className="text-sm font-bold text-slate-900 mb-3">📦 {tier.volume}</p>
                <ul className="space-y-1.5">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex gap-2 text-sm text-slate-800 leading-snug">
                      <span className={`shrink-0 ${tier.accent} font-bold`}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 6. 48시간 도입 로드맵 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-700 ring-2 ring-cyan-300/50 flex items-center justify-center text-base font-bold shadow-md">5</span>
            <h2 className="text-xl font-extrabold text-gray-900">48시간 도입 로드맵</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { step: '오늘', title: '무료 시연 신청', desc: '단체 자료 1건만 업로드 (PDF/Word)' },
              { step: '24시간', title: '첫 콘텐츠 5편 검토', desc: '실제 톤·구조·인용 가능성 확인' },
              { step: '48시간', title: '정식 도입 결정', desc: '캠페인·발행 즉시 시작' },
            ].map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-extrabold text-cyan-700 tracking-widest mb-1">STEP {i + 1} · {s.step}</div>
                <div className="text-base font-extrabold text-slate-900 mb-1">{s.title}</div>
                <div className="text-sm text-slate-700 leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 7. CTA ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-10 sm:py-12 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              <span className="block">AI 시대에 인용되는 조직</span>
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                지금 시작하세요
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-200/95 max-w-2xl mx-auto mb-6 leading-relaxed">
              1주일 무료 시연으로 귀 단체의 <strong className="text-amber-300">첫 AI 인용 발생</strong>을 직접 확인하세요.
              디지털스마일치과·한화시스템·6명 6개 지역구 후보자에서 이미 검증된 솔루션입니다.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:jaiwshim@gmail.com?subject=GEO-AIO 단체 솔루션 도입 문의"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold rounded-full shadow-lg hover:from-amber-400 hover:to-amber-500 transition-colors"
              >
                ✉ 이메일 상담
              </a>
              <a
                href="tel:010-2397-5734"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/25 text-white text-sm font-bold rounded-full hover:bg-white/20 transition-colors"
              >
                📞 010-2397-5734
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-white/15 text-sm text-slate-300">
              <p className="font-bold text-white">AX Biz Group · 심재우 대표</p>
              <p className="mt-1 text-[13px] text-slate-400">특허 출원번호 10-2026-0073485 (다중 LLM 에이전트 예측 시스템)</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
