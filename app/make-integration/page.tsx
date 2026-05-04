'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';

const useCases = [
  {
    title: '블로그 생성',
    description: '주제만 입력하면 GEO/AIO 최적화된 블로그 글이 생성되고, Google Sheets에 저장됩니다.',
    flow: ['주제 입력', 'GEO/AIO 최적화 블로그 글 생성', 'Google Sheets 저장'],
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: 'from-emerald-500 to-teal-600',
    borderHover: 'hover:border-emerald-300',
  },
  {
    title: '콘텐츠 자동 분석',
    description: '새 글을 작성하면 자동으로 GEO/AIO 점수를 분석하고, 70점 미만이면 자동으로 최적화합니다.',
    flow: ['새 글 작성', '자동 GEO/AIO 점수 분석', '70점 미만 시 자동 최적화'],
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: 'from-blue-500 to-indigo-600',
    borderHover: 'hover:border-blue-300',
  },
  {
    title: 'SNS 멀티채널 배포',
    description: '하나의 글을 인스타그램, 링크드인, 네이버, 카드뉴스, 요약 등 5개 채널로 동시에 변환합니다.',
    flow: ['하나의 글', '5개 채널 동시 변환', '인스타/링크드인/네이버/카드뉴스/요약'],
    icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    color: 'from-pink-500 to-rose-600',
    borderHover: 'hover:border-pink-300',
  },
];

const steps = [
  {
    step: 1,
    title: 'Make.com 무료 가입',
    description: 'make.com에 접속하여 무료 계정을 만드세요. 이메일만 있으면 바로 시작할 수 있습니다.',
    link: 'https://www.make.com',
    linkLabel: 'Make.com 바로가기',
  },
  {
    step: 2,
    title: 'Gemini API 키 준비',
    description: 'AI 콘텐츠 생성 및 분석에 필요한 API 키를 Google AI Studio에서 발급받으세요. 이 키를 Make.com의 HTTP 모듈 헤더에 입력해야 합니다.',
    link: 'https://aistudio.google.com/apikey',
    linkLabel: 'Google AI Studio 바로가기',
  },
  {
    step: 3,
    title: '새 시나리오 생성 + HTTP 모듈 추가',
    description: 'Make.com에서 "Create a new scenario"를 클릭한 후, 모듈 목록에서 "HTTP > Make a request" 모듈을 추가하세요.',
    link: null,
    linkLabel: null,
  },
  {
    step: 4,
    title: '웹훅 URL 및 Method 설정',
    description: 'HTTP 모듈 설정에서 아래와 같이 입력하세요.',
    link: null,
    linkLabel: null,
    code: 'https://aio-geo-optimizer.vercel.app/api/webhook',
    httpConfig: true,
  },
  {
    step: 5,
    title: 'API 키 설정 (필수)',
    description: 'HTTP 모듈의 Headers 항목에 API 키를 추가해야 합니다. 이 설정이 없으면 401 인증 오류가 발생합니다.',
    link: null,
    linkLabel: null,
    apiKeyConfig: true,
  },
  {
    step: 6,
    title: 'Body에 action과 파라미터 설정',
    description: 'Body type을 "Raw"로 선택하고, Content type을 "JSON (application/json)"으로 설정한 후, 아래처럼 JSON을 입력하세요.',
    link: null,
    linkLabel: null,
    actions: ['generate', 'analyze', 'optimize', 'convert', 'keyword-analysis', 'generate-series'],
    bodyExample: true,
  },
];

const blueprints = [
  {
    title: '블로그 생성',
    description: '주제 입력부터 Google Sheets 저장까지 한번에 처리하는 블루프린트',
    file: '/make-blueprints/blog-auto-generate.json',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: '콘텐츠 분석 + 최적화',
    description: '자동 점수 분석 후 기준 미달 시 자동 최적화하는 블루프린트',
    file: '/make-blueprints/content-analyze-optimize.json',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: '멀티채널 SNS 배포',
    description: '하나의 콘텐츠를 5개 SNS 채널 형식으로 동시 변환하는 블루프린트',
    file: '/make-blueprints/multi-channel-distribute.json',
    color: 'from-pink-500 to-rose-600',
  },
];

const webhookActions = [
  { action: 'generate', description: 'GEO/AIO 최적화 콘텐츠 생성', params: 'topic, keyword, contentType' },
  { action: 'analyze', description: '기존 콘텐츠의 GEO/AIO 점수 분석', params: 'content, keyword' },
  { action: 'optimize', description: '분석 결과 기반 콘텐츠 자동 최적화', params: 'content, keyword' },
  { action: 'convert', description: 'SNS 채널별 콘텐츠 변환', params: 'content, channels' },
  { action: 'keyword-analysis', description: '키워드 경쟁 분석 및 전략 제안', params: 'keyword' },
  { action: 'generate-series', description: '콘텐츠 시리즈 기획 및 생성', params: 'topic, count' },
];

const faqs = [
  {
    q: 'Make.com은 무료인가요?',
    a: '네, 무료 플랜이 있습니다. 무료 플랜에서는 월 1,000개의 작업(Operation)을 사용할 수 있어 충분히 자동화를 시작할 수 있습니다. 더 많은 작업이 필요하면 유료 플랜으로 업그레이드할 수 있습니다.',
  },
  {
    q: 'API 키는 어디서 발급받고, 어디에 넣나요?',
    a: 'Google AI Studio(aistudio.google.com/apikey)에서 발급받습니다. 발급받은 API 키를 Make.com HTTP 모듈의 Headers에 "X-API-Key"라는 이름으로 추가하세요. API 키 없이 호출하면 401 인증 오류가 발생합니다.',
  },
  {
    q: '프로그래밍 지식이 필요한가요?',
    a: '아니요, 전혀 필요하지 않습니다. Make.com은 드래그 앤 드롭 방식으로 자동화를 설정할 수 있는 노코드(No-Code) 도구입니다. 아래 블루프린트를 가져오면 설정이 더욱 쉬워집니다.',
  },
  {
    q: '도움이 필요하면 어디로 문의하나요?',
    a: '질문/후기 게시판에 글을 남겨주시면 빠르게 답변드립니다.',
  },
];

export default function MakeIntegrationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showTesterModal, setShowTesterModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-8 mb-10">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <circle cx="50" cy="50" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="350" cy="100" r="120" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <img src="/images/logo-geoaio.png" alt="GEOAIO" className="h-16 rounded-lg shadow-lg hidden sm:block" />
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-xs font-medium mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                No-Code 자동화
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Make.com 연동 가이드</h1>
              <p className="text-sm sm:text-base text-white/80">
                자동화로 콘텐츠 마케팅을 10배 빠르게
              </p>
            </div>
          </div>
        </section>

        {/* Make.com 대시보드 미리보기 */}
        <div className="mb-10 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img
            src="/images/make-dashboard.jpg"
            alt="Make.com 대시보드 화면"
            className="w-full h-auto"
          />
        </div>

        {/* Make.com이란? */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Make.com이란?</h2>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
                  <strong>Make.com</strong>은 프로그래밍 없이 다양한 앱과 서비스를 연결해주는 <strong>노코드 자동화 도구</strong>입니다.
                  마치 레고 블록을 조립하듯, 원하는 작업을 드래그 앤 드롭으로 연결하면 자동으로 실행됩니다.
                </p>
                <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
                  GEOAIO와 Make.com을 연동하면, 콘텐츠 생성부터 분석, 최적화, SNS 배포까지
                  <strong> 모든 과정을 자동화</strong>할 수 있습니다.
                </p>
                <p className="text-[13px] text-gray-500">
                  전 세계 50만+ 기업이 사용하는 검증된 자동화 플랫폼입니다.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-72">
                <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      M
                    </div>
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-center text-indigo-600 font-medium">GEOAIO + Make.com = 자동화</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 연동하면 무엇이 가능한가요? */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">연동하면 무엇이 가능한가요?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className={`rounded-xl border border-gray-200 bg-white shadow-sm p-5 transition-colors ${uc.borderHover} hover:shadow-md`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${uc.color} flex items-center justify-center mb-3`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={uc.icon} />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">{uc.title}</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{uc.description}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {uc.flow.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="text-xs bg-gray-100 text-gray-700 rounded-md px-2 py-0.5">{f}</span>
                      {i < uc.flow.length - 1 && (
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 연동 방법 (5단계) */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">연동 방법 (5단계)</h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.step} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-1">{s.title}</h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-2">{s.description}</p>

                    {s.link && (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[13px] text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {s.linkLabel}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}

                    {s.code && (
                      <div className="mt-2 rounded-lg bg-gray-900 text-gray-100 px-4 py-2.5 text-xs font-mono break-all select-all">
                        {s.code}
                      </div>
                    )}

                    {s.httpConfig && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-semibold text-gray-500 w-20">URL</span>
                          <code className="text-xs font-mono bg-white text-indigo-700 rounded px-2 py-1 border border-gray-200 flex-1 break-all">https://aio-geo-optimizer.vercel.app/api/webhook</code>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-semibold text-gray-500 w-20">Method</span>
                          <code className="text-xs font-mono bg-white text-emerald-700 rounded px-2 py-1 border border-gray-200">POST</code>
                        </div>
                      </div>
                    )}

                    {s.apiKeyConfig && (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                          <p className="text-[13px] font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            API 키가 없으면 인증 오류(401)가 발생합니다
                          </p>
                          <p className="text-[13px] text-amber-700">HTTP 모듈의 <strong>Headers</strong> 섹션에서 <strong>&quot;Add a header&quot;</strong>를 클릭하고 아래와 같이 입력하세요.</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                          <p className="text-[13px] font-semibold text-gray-700 mb-2">방법 1: X-API-Key 헤더 (권장)</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold text-gray-500 w-20">Name</span>
                            <code className="text-xs font-mono bg-white text-gray-800 rounded px-2 py-1 border border-gray-200">X-API-Key</code>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold text-gray-500 w-20">Value</span>
                            <code className="text-xs font-mono bg-white text-indigo-700 rounded px-2 py-1 border border-gray-200 flex-1">여기에 Gemini API 키 붙여넣기</code>
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                          <p className="text-[13px] font-semibold text-gray-700 mb-2">방법 2: Authorization 헤더</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold text-gray-500 w-20">Name</span>
                            <code className="text-xs font-mono bg-white text-gray-800 rounded px-2 py-1 border border-gray-200">Authorization</code>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold text-gray-500 w-20">Value</span>
                            <code className="text-xs font-mono bg-white text-indigo-700 rounded px-2 py-1 border border-gray-200 flex-1">Bearer 여기에_Gemini_API_키</code>
                          </div>
                        </div>
                        <div className="rounded-lg bg-gray-900 text-gray-100 p-4">
                          <p className="text-[11px] text-gray-400 mb-2">Headers 설정 예시:</p>
                          <pre className="text-xs font-mono whitespace-pre-wrap">{`X-API-Key: AIzaSy_______________your_key_______________`}</pre>
                        </div>
                      </div>
                    )}

                    {s.actions && (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {s.actions.map((a) => (
                            <code key={a} className="text-xs bg-indigo-50 text-indigo-700 rounded-md px-2 py-0.5 font-mono">
                              {a}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    {s.bodyExample && (
                      <div className="mt-3 space-y-2">
                        <div className="rounded-lg bg-gray-900 text-gray-100 p-4">
                          <p className="text-[11px] text-gray-400 mb-2">Body 설정 예시 (콘텐츠 생성):</p>
                          <pre className="text-xs font-mono whitespace-pre-wrap">{`{
  "action": "generate",
  "topic": "AI 마케팅 전략",
  "keyword": "AI 마케팅",
  "contentType": "blog"
}`}</pre>
                        </div>
                        <div className="rounded-lg bg-gray-900 text-gray-100 p-4">
                          <p className="text-[11px] text-gray-400 mb-2">Body 설정 예시 (콘텐츠 분석):</p>
                          <pre className="text-xs font-mono whitespace-pre-wrap">{`{
  "action": "analyze",
  "content": "분석할 콘텐츠 내용...",
  "keyword": "타겟 키워드"
}`}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 블루프린트 다운로드 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">블루프린트 다운로드</h2>
          <p className="text-[13px] text-gray-500 mb-4">
            아래 블루프린트 파일을 다운로드하여 Make.com에 가져오기(Import)하면 바로 사용할 수 있습니다.
          </p>

          {/* Import 절차 안내 */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 mb-6">
            <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              블루프린트 가져오기(Import) 방법
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">블루프린트 JSON 파일 다운로드</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">아래 3종 블루프린트 중 원하는 파일의 &quot;JSON 다운로드&quot; 버튼을 클릭하여 PC에 저장합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Make.com에서 새 시나리오 생성</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">Make.com에 로그인한 후 좌측 메뉴에서 <strong>&quot;Scenarios&quot;</strong>를 클릭하고, 우측 상단의 <strong>&quot;Create a new scenario&quot;</strong> 버튼을 클릭합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">블루프린트 가져오기 메뉴 열기</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">시나리오 편집 화면 하단의 <strong>&quot;...&quot; (More)</strong> 버튼을 클릭한 후, <strong>&quot;Import Blueprint&quot;</strong>를 선택합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">JSON 파일 업로드</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">팝업 창에서 다운로드한 JSON 파일을 선택하거나, 파일 내용을 복사하여 붙여넣기 한 뒤 <strong>&quot;Save&quot;</strong> 버튼을 클릭합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">5</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">API 키 및 웹훅 URL 설정</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">가져오기가 완료되면 HTTP 모듈을 클릭하여 설정합니다. <strong>URL</strong>에 <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px]">https://aio-geo-optimizer.vercel.app/api/webhook</code>을 입력하고, <strong>Headers</strong>에 <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px]">X-API-Key: 발급받은_Gemini_API_키</code>를 추가합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">테스트 실행 및 활성화</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">하단의 <strong>&quot;Run once&quot;</strong> 버튼으로 테스트한 후, 정상 동작이 확인되면 좌측 하단 토글을 켜서 <strong>스케줄링을 활성화</strong>합니다.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blueprints.map((bp) => (
              <div key={bp.title} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bp.color} flex items-center justify-center mb-3`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{bp.title}</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-4 flex-1">{bp.description}</p>
                <a
                  href={bp.file}
                  download
                  className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-2 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  JSON 다운로드
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* 지원 가능한 기능 목록 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">지원 가능한 기능 목록</h2>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">설명</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">주요 파라미터</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {webhookActions.map((wa) => (
                    <tr key={wa.action} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <code className="text-xs font-mono bg-indigo-50 text-indigo-700 rounded-md px-2 py-0.5">{wa.action}</code>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-gray-700">{wa.description}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-500 font-mono">{wa.params}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">Q</span>
                    {faq.q}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="pl-7 text-[13px] text-gray-600 leading-relaxed">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-6 sm:px-10 py-10 text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">지금 자동화를 시작하세요</h2>
          <p className="text-sm text-white max-w-lg mx-auto mb-6">
            Make.com과 GEOAIO를 연동하면 콘텐츠 마케팅의 반복 작업을 모두 자동화할 수 있습니다.
            무료로 시작해보세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://www.make.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-medium text-sm rounded-lg px-5 py-2.5 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Make.com 시작하기
            </a>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 bg-white/15 text-white font-medium text-sm rounded-lg px-5 py-2.5 hover:bg-white/25 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              질문하기
            </Link>
          </div>
        </section>

      </main>

      <Footer />

      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />
    </div>
  );
}
