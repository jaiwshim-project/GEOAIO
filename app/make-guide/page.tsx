'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

const apiEndpoints = [
  {
    name: '콘텐츠 생성',
    method: 'POST',
    url: '/api/generate',
    webhookAction: 'generate',
    description: 'GEO/AIO 최적화된 블로그, 제품 설명, FAQ, 가이드 등 콘텐츠 생성',
    params: [
      { name: 'topic', type: 'string', required: true, desc: '콘텐츠 주제' },
      { name: 'category', type: 'string', required: true, desc: '콘텐츠 유형 (blog, product, faq, how-to, comparison, case-study)' },
      { name: 'targetKeyword', type: 'string', required: false, desc: '타겟 키워드' },
      { name: 'industry', type: 'string', required: false, desc: '산업 분야' },
      { name: 'tone', type: 'string', required: false, desc: '톤 (professional, friendly, academic)' },
    ],
    response: '{ title, content, meta, keywords[], summary }',
    example: {
      request: '{ "topic": "AI 마케팅 자동화", "category": "blog", "targetKeyword": "AI 마케팅" }',
      response: '{ "title": "AI 마케팅 자동화 완벽 가이드", "content": "...", "keywords": ["AI 마케팅", ...] }',
    },
  },
  {
    name: '콘텐츠 분석',
    method: 'POST',
    url: '/api/analyze',
    webhookAction: 'analyze',
    description: '기존 콘텐츠의 GEO/AIO 점수, E-E-A-T 평가, 키워드 밀도 분석',
    params: [
      { name: 'content', type: 'string', required: true, desc: '분석할 콘텐츠 텍스트' },
      { name: 'targetKeyword', type: 'string', required: false, desc: '타겟 키워드' },
    ],
    response: '{ aioScore, geoScore, eatScore, keywordDensity, suggestions[], improvements[] }',
    example: {
      request: '{ "content": "분석할 텍스트...", "targetKeyword": "AI 최적화" }',
      response: '{ "aioScore": 72, "geoScore": 68, "suggestions": ["구조화된 데이터 추가", ...] }',
    },
  },
  {
    name: '콘텐츠 최적화',
    method: 'POST',
    url: '/api/optimize',
    webhookAction: 'optimize',
    description: '기존 콘텐츠를 GEO/AIO에 최적화된 형태로 자동 변환',
    params: [
      { name: 'originalContent', type: 'string', required: true, desc: '원본 콘텐츠' },
      { name: 'targetKeyword', type: 'string', required: false, desc: '타겟 키워드' },
    ],
    response: '{ optimizedContent, changes[], beforeScore, afterScore }',
    example: {
      request: '{ "originalContent": "원본 텍스트..." }',
      response: '{ "optimizedContent": "최적화된 텍스트...", "beforeScore": 45, "afterScore": 82 }',
    },
  },
  {
    name: 'SNS 채널 변환',
    method: 'POST',
    url: '/api/convert-content',
    webhookAction: 'convert',
    description: '블로그 콘텐츠를 인스타그램, 링크드인, 네이버 블로그, 카드뉴스, 요약본으로 자동 변환',
    params: [
      { name: 'content', type: 'string', required: true, desc: '원본 콘텐츠' },
      { name: 'channel', type: 'string', required: true, desc: '변환 채널 (instagram, linkedin, naver_blog, card_news, summary)' },
      { name: 'title', type: 'string', required: false, desc: '콘텐츠 제목' },
    ],
    response: '{ result, channel }',
    example: {
      request: '{ "content": "블로그 글...", "channel": "instagram", "title": "AI 마케팅" }',
      response: '{ "result": "🚀 AI 마케팅의 새로운 시대!\\n\\n...", "channel": "instagram" }',
    },
  },
  {
    name: '키워드 경쟁 분석',
    method: 'POST',
    url: '/api/keyword-analysis',
    webhookAction: 'keyword-analysis',
    description: 'AI 검색엔진에서 인용되기 위한 키워드 경쟁도, 검색 의도, 차별화 전략 분석',
    params: [
      { name: 'keyword', type: 'string', required: true, desc: '분석할 키워드' },
      { name: 'industry', type: 'string', required: false, desc: '산업 분야' },
    ],
    response: '{ keyword, difficulty, difficultyScore, searchIntent, aiCitationFactors[], mustCoverTopics[], differentiationStrategies[], contentRecommendations, relatedKeywords[], competitorInsights }',
    example: {
      request: '{ "keyword": "AI 콘텐츠 마케팅", "industry": "마케팅" }',
      response: '{ "keyword": "AI 콘텐츠 마케팅", "difficulty": "중", "difficultyScore": 65, ... }',
    },
  },
  {
    name: '시리즈 기획',
    method: 'POST',
    url: '/api/generate-series',
    webhookAction: 'generate-series',
    description: '주제에 맞는 연재 시리즈 기획안 생성 (3~12편)',
    params: [
      { name: 'topic', type: 'string', required: true, desc: '시리즈 주제' },
      { name: 'industry', type: 'string', required: false, desc: '산업 분야' },
      { name: 'count', type: 'number', required: false, desc: '편수 (3~12, 기본 7)' },
      { name: 'additionalNotes', type: 'string', required: false, desc: '추가 요구사항' },
    ],
    response: '{ seriesTitle, seriesDescription, targetAudience, episodes[], linkingStrategy, publishingSchedule, expectedOutcome }',
    example: {
      request: '{ "topic": "중소기업 AI 도입", "count": 5 }',
      response: '{ "seriesTitle": "중소기업 AI 도입 로드맵", "episodes": [...], ... }',
    },
  },
  {
    name: 'AI 인포그래픽 생성',
    method: 'POST',
    url: '/api/generate-images',
    webhookAction: null,
    description: 'Gemini AI를 활용한 콘텐츠 맞춤 인포그래픽 이미지 생성',
    params: [
      { name: 'content', type: 'string', required: true, desc: '콘텐츠 내용' },
      { name: 'title', type: 'string', required: true, desc: '이미지 제목' },
    ],
    response: '{ images: [{ url, alt }] }',
    example: {
      request: '{ "content": "AI 마케팅 트렌드...", "title": "2026 AI 마케팅 트렌드" }',
      response: '{ "images": [{ "url": "data:image/png;base64,...", "alt": "..." }] }',
    },
    note: 'Gemini API Key 필요 (X-Gemini-Key 헤더)',
  },
  {
    name: '파일 파싱',
    method: 'POST',
    url: '/api/parse-file',
    webhookAction: null,
    description: 'PDF, DOCX, PPTX, 이미지 등 파일 업로드 후 텍스트 추출',
    params: [
      { name: 'file', type: 'FormData', required: true, desc: '업로드 파일 (최대 20MB)' },
    ],
    response: '{ text, fileName }',
    example: {
      request: 'FormData: file=report.pdf',
      response: '{ "text": "추출된 텍스트...", "fileName": "report.pdf" }',
    },
    note: '지원 형식: PDF, DOCX, PPTX, TXT, MD, CSV, JSON, HTML, XML, JPG, PNG, GIF, WEBP',
  },
  {
    name: '통합 웹훅',
    method: 'POST',
    url: '/api/webhook',
    webhookAction: null,
    description: 'Make.com 등 외부 자동화 도구용 단일 엔드포인트. action 파라미터로 기능 선택',
    params: [
      { name: 'action', type: 'string', required: true, desc: 'generate, analyze, optimize, convert, keyword-analysis, generate-series' },
      { name: '...', type: '각 액션별', required: true, desc: '선택한 액션에 해당하는 파라미터 (위 개별 API 참조)' },
    ],
    response: '{ success: true, action, result: { ... } }',
    example: {
      request: '{ "action": "generate", "topic": "AI 마케팅", "category": "blog" }',
      response: '{ "success": true, "action": "generate", "result": { "title": "...", "content": "..." } }',
    },
    note: 'Make.com HTTP 모듈에서 이 하나의 URL만 사용하면 됩니다',
  },
];

const scenarios = [
  {
    id: 1,
    title: '키워드 → 콘텐츠 생성 → Google Sheets 저장',
    difficulty: '초급',
    time: '15분',
    icon: '📝',
    description: 'Google Sheets에 키워드를 입력하면 자동으로 AIO 최적화 콘텐츠를 생성하여 같은 시트에 저장합니다.',
    modules: ['Google Sheets (Watch Rows)', 'HTTP (Make a request)', 'Google Sheets (Update Row)'],
    steps: [
      {
        step: 1,
        title: 'Google Sheets 트리거 설정',
        detail: '새 행이 추가되면 시나리오가 시작됩니다.',
        config: [
          'Module: Google Sheets > Watch Rows',
          'Spreadsheet: 콘텐츠 관리 시트 선택',
          'Sheet: "키워드 목록" 시트',
          'Watch column: A열 (키워드)',
        ],
      },
      {
        step: 2,
        title: 'HTTP 모듈로 콘텐츠 생성 API 호출',
        detail: '우리 플랫폼의 generate API를 호출합니다.',
        config: [
          'Module: HTTP > Make a request',
          'URL: https://aio-geo-optimizer.vercel.app/api/webhook',
          'Method: POST',
          'Headers: Content-Type = application/json',
          'Headers: X-API-Key = sk-ant-xxxxx (본인 키)',
          'Body type: Raw (application/json)',
          `Body: { "action": "generate", "topic": "{{1.A}}", "category": "blog" }`,
          '※ {{1.A}}는 Google Sheets에서 가져온 키워드 값',
        ],
      },
      {
        step: 3,
        title: '생성 결과를 Google Sheets에 저장',
        detail: '생성된 콘텐츠를 같은 행에 업데이트합니다.',
        config: [
          'Module: Google Sheets > Update a Row',
          'Row number: {{1.rowNumber}}',
          'B열: {{2.body.result.title}} (제목)',
          'C열: {{2.body.result.content}} (본문)',
          'D열: {{2.body.result.keywords}} (키워드)',
          'E열: {{now}} (생성 일시)',
        ],
      },
    ],
  },
  {
    id: 2,
    title: '콘텐츠 생성 → 멀티채널 자동 변환 → SNS 게시',
    difficulty: '중급',
    time: '30분',
    icon: '📱',
    description: '블로그 콘텐츠를 생성한 후 인스타그램, 링크드인, 네이버 블로그용으로 자동 변환하여 각 채널에 게시합니다.',
    modules: ['Trigger (Schedule/Webhook)', 'HTTP x4 (generate + convert x3)', 'Instagram/LinkedIn/WordPress'],
    steps: [
      {
        step: 1,
        title: '트리거 설정',
        detail: '매주 월/수/금 오전 9시에 자동 실행되도록 스케줄을 설정합니다.',
        config: [
          'Module: Schedule (또는 Webhook으로 수동 트리거)',
          'Schedule: 매주 월, 수, 금 09:00 KST',
          '또는 Google Sheets Watch Rows로 키워드 입력 시 트리거',
        ],
      },
      {
        step: 2,
        title: '원본 콘텐츠 생성',
        detail: '블로그 형태의 원본 콘텐츠를 먼저 생성합니다.',
        config: [
          'Module: HTTP > Make a request',
          'URL: https://aio-geo-optimizer.vercel.app/api/webhook',
          'Method: POST',
          'Headers: X-API-Key = sk-ant-xxxxx',
          `Body: { "action": "generate", "topic": "이번 주 키워드", "category": "blog" }`,
        ],
      },
      {
        step: 3,
        title: '인스타그램용 변환',
        detail: '생성된 콘텐츠를 인스타그램 형식으로 변환합니다.',
        config: [
          'Module: HTTP > Make a request',
          'URL: https://aio-geo-optimizer.vercel.app/api/webhook',
          `Body: { "action": "convert", "content": "{{2.body.result.content}}", "channel": "instagram", "title": "{{2.body.result.title}}" }`,
        ],
      },
      {
        step: 4,
        title: '링크드인용 변환 (병렬 실행)',
        detail: '동시에 링크드인 형식으로도 변환합니다. Make.com의 Router를 사용하면 3, 4, 5단계를 병렬로 실행할 수 있습니다.',
        config: [
          `Body: { "action": "convert", "content": "{{2.body.result.content}}", "channel": "linkedin" }`,
        ],
      },
      {
        step: 5,
        title: '각 채널에 게시',
        detail: '변환된 콘텐츠를 각 SNS에 게시합니다.',
        config: [
          'Instagram: Instagram for Business 모듈로 게시',
          'LinkedIn: LinkedIn 모듈로 게시',
          'WordPress/네이버: HTTP 모듈로 API 호출하여 게시',
          '※ 각 SNS의 API 연동이 필요합니다',
        ],
      },
    ],
  },
  {
    id: 3,
    title: '정기 시리즈 자동 기획 → 매일 1편 발행',
    difficulty: '중급',
    time: '30분',
    icon: '📚',
    description: '매주 월요일에 시리즈를 기획하고, 화~금 매일 1편씩 자동으로 콘텐츠를 생성하여 발행합니다.',
    modules: ['Schedule', 'HTTP (generate-series)', 'Iterator', 'HTTP (generate)', 'WordPress/Blog'],
    steps: [
      {
        step: 1,
        title: '매주 월요일 시리즈 기획',
        detail: '월요일 09:00에 시리즈 기획안을 생성합니다.',
        config: [
          'Module: Schedule > 매주 월요일 09:00',
          'Module: HTTP > Make a request',
          `Body: { "action": "generate-series", "topic": "이번 주 주제", "count": 4 }`,
          '※ 주제는 Google Sheets의 "주간 주제" 시트에서 가져올 수 있음',
        ],
      },
      {
        step: 2,
        title: '에피소드 목록 반복 처리',
        detail: '시리즈 기획안의 각 에피소드를 하나씩 처리합니다.',
        config: [
          'Module: Iterator',
          'Array: {{1.body.result.episodes}}',
          '각 에피소드의 title, targetKeywords, keyPoints를 다음 모듈에 전달',
        ],
      },
      {
        step: 3,
        title: '각 에피소드 콘텐츠 생성',
        detail: '에피소드별로 상세 콘텐츠를 생성합니다.',
        config: [
          'Module: HTTP > Make a request',
          `Body: { "action": "generate", "topic": "{{2.title}}", "category": "blog" }`,
          '※ 에피소드의 키포인트를 additionalContext로 추가 가능',
        ],
      },
      {
        step: 4,
        title: '발행 스케줄 설정',
        detail: '생성된 콘텐츠를 화~금에 걸쳐 예약 발행합니다.',
        config: [
          'WordPress: Schedule post로 예약 발행',
          '또는 Google Sheets에 저장 후 별도 시나리오로 매일 발행',
          'Slack/Email로 발행 알림 전송',
        ],
      },
    ],
  },
  {
    id: 4,
    title: '경쟁사 모니터링 → 대응 콘텐츠 생성',
    difficulty: '고급',
    time: '45분',
    icon: '🔍',
    description: 'RSS 피드나 Google Alerts로 경쟁사 새 글을 감지하고, 키워드를 분석한 후 더 나은 AIO 최적화 콘텐츠를 생성합니다.',
    modules: ['RSS/Google Alerts', 'HTTP (keyword-analysis)', 'HTTP (generate)', 'Filter', 'WordPress/Slack'],
    steps: [
      {
        step: 1,
        title: 'RSS 피드 모니터링',
        detail: '경쟁사 블로그의 RSS 피드를 감시합니다.',
        config: [
          'Module: RSS > Watch RSS feed items',
          'URL: 경쟁사 블로그 RSS URL',
          '또는 Google Alerts > Watch alerts',
          'Schedule: 매시간 체크',
        ],
      },
      {
        step: 2,
        title: '키워드 경쟁 분석',
        detail: '감지된 콘텐츠의 핵심 키워드를 분석합니다.',
        config: [
          'Module: HTTP > Make a request',
          `Body: { "action": "keyword-analysis", "keyword": "{{1.title}}", "industry": "우리 산업" }`,
          '응답에서 difficultyScore, mustCoverTopics, differentiationStrategies 활용',
        ],
      },
      {
        step: 3,
        title: '필터: 대응 가치 판단',
        detail: '경쟁도가 높은 키워드만 필터링합니다.',
        config: [
          'Module: Filter',
          'Condition: {{2.body.difficultyScore}} < 80',
          '※ 너무 경쟁이 치열한 키워드는 건너뜀',
        ],
      },
      {
        step: 4,
        title: '대응 콘텐츠 생성',
        detail: '분석 결과를 바탕으로 더 나은 콘텐츠를 생성합니다.',
        config: [
          'Module: HTTP > Make a request',
          `Body: { "action": "generate", "topic": "{{1.title}}", "category": "blog", "targetKeyword": "{{2.body.keyword}}" }`,
        ],
      },
      {
        step: 5,
        title: '발행 및 알림',
        detail: '생성된 콘텐츠를 발행하고 팀에 알립니다.',
        config: [
          'WordPress/Blog: 자동 발행 (또는 임시저장)',
          'Slack: "경쟁사 대응 콘텐츠가 생성되었습니다" 알림',
          'Google Sheets: 모니터링 로그 기록',
        ],
      },
    ],
  },
  {
    id: 5,
    title: '고객 문의 → 맞춤 콘텐츠 자동 응답',
    difficulty: '고급',
    time: '45분',
    icon: '💬',
    description: '웹사이트 폼이나 이메일로 들어온 고객 문의에서 키워드를 추출하고, 맞춤 콘텐츠를 생성하여 이메일로 자동 발송합니다.',
    modules: ['Webhook/Gmail', 'HTTP (generate)', 'Gmail/Mailchimp', 'HubSpot/CRM'],
    steps: [
      {
        step: 1,
        title: '고객 문의 수신',
        detail: '폼 제출이나 이메일 수신을 감지합니다.',
        config: [
          'Module: Webhooks > Custom webhook (폼 제출용)',
          '또는 Gmail > Watch emails (특정 라벨/필터)',
          '또는 Typeform/Google Forms > Watch responses',
        ],
      },
      {
        step: 2,
        title: '맞춤 콘텐츠 생성',
        detail: '문의 내용을 기반으로 맞춤 콘텐츠를 생성합니다.',
        config: [
          'Module: HTTP > Make a request',
          `Body: { "action": "generate", "topic": "{{1.question}}", "category": "faq" }`,
          '※ category를 faq로 설정하여 질문-답변 형식으로 생성',
        ],
      },
      {
        step: 3,
        title: '이메일 자동 발송',
        detail: '생성된 콘텐츠를 고객에게 이메일로 보냅니다.',
        config: [
          'Module: Gmail > Send an email',
          'To: {{1.email}}',
          'Subject: "문의하신 {{1.question}}에 대한 답변입니다"',
          'Body: {{2.body.result.content}}',
        ],
      },
      {
        step: 4,
        title: 'CRM 기록',
        detail: '상담 이력을 CRM에 자동 기록합니다.',
        config: [
          'Module: HubSpot > Create a contact/deal',
          '또는 Google Sheets에 상담 로그 기록',
          '문의 내용, 응답 내용, 일시 등 기록',
        ],
      },
    ],
  },
];

export default function MakeGuidePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'scenarios' | 'agency' | 'roadmap' | 'allinone' | 'competitive'>('overview');
  const [expandedApi, setExpandedApi] = useState<number | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  }, []);

  const showTab = (tab: string) => isPrinting || activeTab === tab;

  const handlePinSubmit = () => {
    if (pinInput === '9633') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Make 활용 매뉴얼</h2>
          <p className="text-xs text-gray-500 mb-5">접근 비밀번호를 입력해주세요.</p>
          <div className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="숫자 4자리"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              className={`w-full px-4 py-3 text-center text-lg font-bold tracking-[0.5em] border rounded-lg focus:outline-none transition-colors ${
                pinError ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-indigo-400'
              }`}
            />
            {pinError && (
              <p className="text-xs text-red-500 font-medium">비밀번호가 올바르지 않습니다.</p>
            )}
            <button
              onClick={handlePinSubmit}
              disabled={pinInput.length < 4}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              확인
            </button>
          </div>
          <Link href="/" className="inline-block mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: '개요', icon: '📋' },
    { id: 'api' as const, label: 'API 레퍼런스', icon: '🔌' },
    { id: 'scenarios' as const, label: 'Make.com 시나리오', icon: '⚡' },
    { id: 'agency' as const, label: '에이전시 활용', icon: '🏢' },
    { id: 'roadmap' as const, label: '향후 개발', icon: '🗺️' },
    { id: 'allinone' as const, label: '올인원 배포 서비스', icon: '🚀' },
    { id: 'competitive' as const, label: '경쟁력 분석', icon: '🏆' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Make.com 활용 매뉴얼</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                홈
              </Link>
              <Link href="/manual" className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                사용자 매뉴얼
              </Link>
              <button
                onClick={handlePrint}
                className="print:hidden text-xs px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                PDF 다운로드
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="h-14 sm:h-16 rounded-lg mx-auto mb-4" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm mb-4">
            <span>GEOAIO</span>
            <span className="text-purple-300">×</span>
            <span>Make.com</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            콘텐츠 자동화의 모든 것
          </h1>
          <p className="text-lg text-purple-200 max-w-2xl mx-auto">
            AI 최적화 콘텐츠 생성부터 멀티채널 배포까지,<br />
            Make.com 연동으로 완전 자동화하는 방법을 안내합니다.
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-200 shadow-sm" data-print-hide>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ===== Part 1: 개요 ===== */}
        {isPrinting && <div className="mt-8 mb-4 pb-2 border-b-2 border-indigo-600"><h2 className="text-2xl font-bold text-indigo-700">1. 개요</h2></div>}
        {showTab('overview') && (
          <div className="space-y-8">
            {/* Make.com 소개 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Make.com이란?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Make.com(구 Integromat)은 <strong>노코드 자동화 플랫폼</strong>입니다.
                    프로그래밍 없이 드래그 앤 드롭으로 다양한 앱과 서비스를 연결하여
                    업무 프로세스를 자동화할 수 있습니다.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">&#10003;</span>
                      <span><strong>시나리오</strong>: 자동화 워크플로우 (트리거 → 액션 → 결과)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">&#10003;</span>
                      <span><strong>모듈</strong>: 각 앱의 기능 단위 (Google Sheets 행 읽기, HTTP 요청 등)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">&#10003;</span>
                      <span><strong>커넥션</strong>: 앱과의 인증 연결 (API Key, OAuth 등)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">&#10003;</span>
                      <span><strong>Router</strong>: 조건에 따라 분기 처리 (병렬 실행 가능)</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">왜 Make.com인가?</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">vs Zapier</span>
                      <span className="text-gray-600">더 복잡한 시나리오, 시각적 빌더, 낮은 가격</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">vs n8n</span>
                      <span className="text-gray-600">클라우드 호스팅, 쉬운 UI, 기술 부담 없음</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">vs 코딩</span>
                      <span className="text-gray-600">유지보수 불필요, 시각적 디버깅, 빠른 구축</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 연동 효과 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">연동하면 무엇이 가능한가?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: '🚀', title: '완전 자동 콘텐츠 생산', desc: '키워드 입력만으로 기획→생성→최적화→발행까지 자동 처리' },
                  { icon: '📱', title: '멀티채널 동시 배포', desc: '블로그 1편으로 인스타, 링크드인, 네이버 등 5개 채널 동시 커버' },
                  { icon: '📊', title: '데이터 기반 최적화', desc: '키워드 분석 → 콘텐츠 생성 → 성과 추적의 자동 순환' },
                  { icon: '⏰', title: '정기 발행 자동화', desc: '매일/매주 일정에 따라 빠짐없이 콘텐츠 발행' },
                  { icon: '🔍', title: '경쟁사 대응 자동화', desc: 'RSS 감지 → 분석 → 대응 콘텐츠 생성까지 자동' },
                  { icon: '💰', title: '비용 90% 절감', desc: '월 400만원 인건비 → API 비용 5~10만원으로 대체' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 아키텍처 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">전체 아키텍처</h2>
              <div className="bg-gray-900 rounded-xl p-5 text-sm font-mono text-gray-300 overflow-x-auto">
                <pre className="whitespace-pre leading-relaxed">{`┌─────────────────── Make.com ───────────────────┐
│                                                │
│  [트리거]          [API 호출]       [후속 액션] │
│                                                │
│  • Schedule        POST /api/       • WordPress│
│  • RSS Feed        webhook          • Instagram│
│  • Google Sheets   ─────────►       • LinkedIn │
│  • Email/Gmail     X-API-Key        • Slack    │
│  • Webhook         인증 헤더        • Gmail    │
│  • Google Forms                     • Sheets   │
│                                     • HubSpot  │
└────────────────────┬───────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │   GEOAIO API       │
    │                                │
    │   /api/webhook (통합)          │
    │   ├─ action: generate          │
    │   ├─ action: analyze           │
    │   ├─ action: optimize          │
    │   ├─ action: convert           │
    │   ├─ action: keyword-analysis  │
    │   └─ action: generate-series   │
    │                                │
    │   개별 엔드포인트도 사용 가능  │
    │   /api/generate                │
    │   /api/analyze                 │
    │   /api/optimize                │
    │   /api/convert-content         │
    │   /api/keyword-analysis        │
    │   /api/generate-series         │
    │   /api/generate-images         │
    └────────────────────────────────┘`}</pre>
              </div>
            </section>
          </div>
        )}

        {/* ===== Part 2: API 레퍼런스 ===== */}
        {isPrinting && <div className="mt-12 mb-4 pb-2 border-b-2 border-indigo-600" style={{ breakBefore: 'page' }}><h2 className="text-2xl font-bold text-indigo-700">2. API 레퍼런스</h2></div>}
        {showTab('api') && (
          <div className="space-y-6">
            {/* 인증 방법 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">인증 방법</h2>
              <p className="text-sm text-gray-600 mb-4">
                모든 API 요청에는 Anthropic API Key가 필요합니다. 아래 3가지 방법 중 하나로 전달하세요.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">추천</span>
                    <span className="text-sm font-semibold text-gray-800">X-API-Key 헤더</span>
                  </div>
                  <code className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded block">
                    X-API-Key: sk-ant-xxxxx
                  </code>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-sm font-semibold text-gray-800 block mb-2">Authorization 헤더</span>
                  <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded block">
                    Authorization: Bearer sk-ant-xxxxx
                  </code>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-sm font-semibold text-gray-800 block mb-2">서버 환경변수</span>
                  <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded block">
                    ANTHROPIC_API_KEY=sk-ant-xxxxx
                  </code>
                  <p className="text-xs text-gray-400 mt-1">Vercel 환경변수에 설정</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800">
                  <strong>이미지 생성 API</strong>는 별도로 Gemini API Key가 필요합니다.
                  <code className="bg-amber-100 px-1 rounded ml-1">X-Gemini-Key</code> 헤더로 전달하세요.
                </p>
              </div>
            </section>

            {/* 통합 웹훅 안내 */}
            <section className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-purple-100">
              <h2 className="text-xl font-bold text-gray-900 mb-2">통합 웹훅 엔드포인트</h2>
              <p className="text-sm text-gray-600 mb-4">
                Make.com에서는 아래 <strong>하나의 URL</strong>만 사용하면 됩니다.
                <code className="bg-white px-2 py-0.5 rounded text-purple-700 ml-1 text-xs">action</code> 파라미터로 기능을 선택합니다.
              </p>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-bold">POST</span>
                  <code className="text-sm text-gray-800 font-semibold">https://aio-geo-optimizer.vercel.app/api/webhook</code>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  지원 액션: <code className="bg-gray-100 px-1 rounded">generate</code> <code className="bg-gray-100 px-1 rounded">analyze</code> <code className="bg-gray-100 px-1 rounded">optimize</code> <code className="bg-gray-100 px-1 rounded">convert</code> <code className="bg-gray-100 px-1 rounded">keyword-analysis</code> <code className="bg-gray-100 px-1 rounded">generate-series</code>
                </div>
              </div>
            </section>

            {/* 개별 API 목록 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">API 엔드포인트 상세</h2>
              <div className="space-y-3">
                {apiEndpoints.map((api, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedApi(expandedApi === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          api.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>{api.method}</span>
                        <code className="text-sm text-gray-800">{api.url}</code>
                        <span className="text-xs text-gray-400 hidden sm:inline">— {api.name}</span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedApi === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {(isPrinting || expandedApi === index) && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                        <p className="text-sm text-gray-600">{api.description}</p>

                        {api.webhookAction && (
                          <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg inline-block">
                            웹훅 action: <code className="font-bold">{api.webhookAction}</code>
                          </div>
                        )}

                        {api.note && (
                          <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                            {api.note}
                          </div>
                        )}

                        {/* Parameters */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">파라미터</h4>
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">이름</th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">타입</th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">필수</th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">설명</th>
                                </tr>
                              </thead>
                              <tbody>
                                {api.params.map((param, pi) => (
                                  <tr key={pi} className="border-t border-gray-100">
                                    <td className="px-3 py-2 font-mono text-indigo-600">{param.name}</td>
                                    <td className="px-3 py-2 text-gray-500">{param.type}</td>
                                    <td className="px-3 py-2">
                                      {param.required ? (
                                        <span className="text-red-500 font-medium">필수</span>
                                      ) : (
                                        <span className="text-gray-400">선택</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{param.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Response */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">응답 형식</h4>
                          <code className="text-xs text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 block">
                            {api.response}
                          </code>
                        </div>

                        {/* Example */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">요청/응답 예시</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-xs text-gray-500 block mb-1">요청 Body:</span>
                              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
                                {api.example.request}
                              </pre>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block mb-1">응답:</span>
                              <pre className="text-xs bg-gray-900 text-blue-400 p-3 rounded-lg overflow-x-auto">
                                {api.example.response}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 에러 코드 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">에러 코드</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">코드</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">의미</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">해결 방법</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="border-t"><td className="px-4 py-2 font-mono text-red-600">400</td><td className="px-4 py-2">필수 파라미터 누락</td><td className="px-4 py-2 text-gray-500">요청 Body에 필수 필드 확인</td></tr>
                    <tr className="border-t"><td className="px-4 py-2 font-mono text-red-600">401</td><td className="px-4 py-2">API 키 없음 또는 유효하지 않음</td><td className="px-4 py-2 text-gray-500">X-API-Key 헤더에 유효한 키 전달</td></tr>
                    <tr className="border-t"><td className="px-4 py-2 font-mono text-red-600">500</td><td className="px-4 py-2">서버 오류 (AI 호출 실패 등)</td><td className="px-4 py-2 text-gray-500">잠시 후 재시도, API 키 잔액 확인</td></tr>
                    <tr className="border-t"><td className="px-4 py-2 font-mono text-amber-600">TIMEOUT</td><td className="px-4 py-2">60초 초과</td><td className="px-4 py-2 text-gray-500">콘텐츠 길이 줄이기, Make.com 타임아웃 늘리기</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===== Part 3: Make.com 시나리오 ===== */}
        {isPrinting && <div className="mt-12 mb-4 pb-2 border-b-2 border-indigo-600" style={{ breakBefore: 'page' }}><h2 className="text-2xl font-bold text-indigo-700">3. Make.com 시나리오</h2></div>}
        {showTab('scenarios') && (
          <div className="space-y-6">
            {/* Make.com 기본 설정 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Make.com 기본 설정</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-2xl mb-2">1️⃣</div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">Make.com 가입</h3>
                    <p className="text-xs text-gray-600">make.com에서 무료 계정 생성. Free 플랜으로 월 1,000 오퍼레이션 가능.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-2xl mb-2">2️⃣</div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">새 시나리오 생성</h3>
                    <p className="text-xs text-gray-600">Dashboard &gt; Create a new scenario 클릭. 빈 캔버스가 열립니다.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-2xl mb-2">3️⃣</div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">HTTP 모듈 추가</h3>
                    <p className="text-xs text-gray-600">+ 버튼 &gt; HTTP &gt; Make a request 선택. 이것이 우리 API를 호출하는 핵심 모듈입니다.</p>
                  </div>
                </div>

                {/* HTTP 모듈 설정 */}
                <div className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">HTTP 모듈 설정값 (모든 시나리오 공통)</h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-28 shrink-0">URL:</span>
                      <span className="text-green-400">https://aio-geo-optimizer.vercel.app/api/webhook</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-28 shrink-0">Method:</span>
                      <span className="text-yellow-400">POST</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-28 shrink-0">Headers:</span>
                      <span className="text-blue-400">Content-Type: application/json</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-28 shrink-0">Headers:</span>
                      <span className="text-purple-400">X-API-Key: sk-ant-xxxxx (본인 키)</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-28 shrink-0">Body type:</span>
                      <span className="text-orange-400">Raw (application/json)</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-400 w-28 shrink-0">Parse response:</span>
                      <span className="text-emerald-400">Yes</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 시나리오 목록 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">실전 시나리오 가이드</h2>
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedScenario(expandedScenario === scenario.id ? null : scenario.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{scenario.icon}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{scenario.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              scenario.difficulty === '초급' ? 'bg-green-100 text-green-700' :
                              scenario.difficulty === '중급' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>{scenario.difficulty}</span>
                            <span className="text-xs text-gray-400">설정 시간: {scenario.time}</span>
                          </div>
                        </div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedScenario === scenario.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {(isPrinting || expandedScenario === scenario.id) && (
                      <div className="border-t border-gray-100 p-5 space-y-5">
                        <p className="text-sm text-gray-600">{scenario.description}</p>

                        {/* 필요 모듈 */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">필요 모듈</h4>
                          <div className="flex flex-wrap gap-2">
                            {scenario.modules.map((mod, i) => (
                              <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100">
                                {mod}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 단계별 가이드 */}
                        <div className="space-y-4">
                          {scenario.steps.map((step) => (
                            <div key={step.step} className="relative pl-8">
                              <div className="absolute left-0 top-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {step.step}
                              </div>
                              <div className="bg-gray-50 rounded-xl p-4">
                                <h5 className="text-sm font-semibold text-gray-800 mb-1">{step.title}</h5>
                                <p className="text-xs text-gray-500 mb-3">{step.detail}</p>
                                <div className="space-y-1">
                                  {step.config.map((cfg, ci) => (
                                    <div key={ci} className="text-xs font-mono text-gray-700 bg-white px-3 py-1.5 rounded border border-gray-200">
                                      {cfg}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ===== Part 4: 에이전시 활용 ===== */}
        {isPrinting && <div className="mt-12 mb-4 pb-2 border-b-2 border-indigo-600" style={{ breakBefore: 'page' }}><h2 className="text-2xl font-bold text-indigo-700">4. 에이전시 활용</h2></div>}
        {showTab('agency') && (
          <div className="space-y-8">
            {/* 패키지 상품화 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">에이전시 패키지 상품화</h2>
              <p className="text-sm text-gray-600 mb-6">
                Make.com + GEOAIO를 조합하여 구독형 서비스 패키지로 판매할 수 있습니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 패키지 */}
                <div className="border-2 border-blue-100 rounded-2xl p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Basic</h3>
                    <span className="text-2xl font-bold text-blue-600">50만원<span className="text-sm text-gray-400">/월</span></span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2"><span className="text-blue-500">&#10003;</span>주 3회 AIO 최적화 블로그 자동 발행</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500">&#10003;</span>인스타그램 자동 변환 게시</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500">&#10003;</span>월간 키워드 분석 리포트 (Sheets 생성)</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500">&#10003;</span>Google Sheets 콘텐츠 관리</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500">&#10003;</span>이메일 발행 알림</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">실제 운영 비용: API ~3만원 + Make.com Free 플랜</p>
                    <p className="text-xs text-green-600 font-medium mt-1">예상 순이익: ~47만원/월</p>
                  </div>
                </div>

                {/* 프리미엄 패키지 */}
                <div className="border-2 border-purple-200 rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-indigo-50 hover:border-purple-400 transition-colors relative">
                  <div className="absolute -top-3 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Premium</h3>
                    <span className="text-2xl font-bold text-purple-600">150만원<span className="text-sm text-gray-400">/월</span></span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2"><span className="text-purple-500">&#10003;</span>매일 1편 AIO 최적화 콘텐츠 자동 발행</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">&#10003;</span>4개 채널 동시 배포 (블로그, 인스타, 링크드인, 카드뉴스)</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">&#10003;</span>경쟁사 모니터링 + 대응 콘텐츠 생성</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">&#10003;</span>주간 시리즈 기획 + 자동 발행</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">&#10003;</span>주간/월간 성과 리포트 자동 발송</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">&#10003;</span>고객 문의 자동 응답 시스템</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-purple-100">
                    <p className="text-xs text-gray-400">실제 운영 비용: API ~10만원 + Make.com Pro ~$9</p>
                    <p className="text-xs text-green-600 font-medium mt-1">예상 순이익: ~138만원/월</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ROI 시뮬레이션 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ROI 시뮬레이션</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">항목</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">기존 수작업</th>
                      <th className="text-center px-4 py-3 font-medium text-purple-600 bg-purple-50">Make.com 자동화</th>
                      <th className="text-center px-4 py-3 font-medium text-green-600">절감 효과</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="border-t">
                      <td className="px-4 py-3 text-gray-700">콘텐츠 1편 제작 시간</td>
                      <td className="px-4 py-3 text-center text-gray-500">2~4시간</td>
                      <td className="px-4 py-3 text-center text-purple-600 bg-purple-50/50 font-medium">3분 (자동)</td>
                      <td className="px-4 py-3 text-center text-green-600">97% 절감</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 text-gray-700">월 20편 기준 인건비</td>
                      <td className="px-4 py-3 text-center text-gray-500">400만원+</td>
                      <td className="px-4 py-3 text-center text-purple-600 bg-purple-50/50 font-medium">5~10만원 (API)</td>
                      <td className="px-4 py-3 text-center text-green-600">390만원+ 절감</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 text-gray-700">멀티채널 변환</td>
                      <td className="px-4 py-3 text-center text-gray-500">추가 1시간/편</td>
                      <td className="px-4 py-3 text-center text-purple-600 bg-purple-50/50 font-medium">자동 (추가 비용 없음)</td>
                      <td className="px-4 py-3 text-center text-green-600">100% 절감</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 text-gray-700">키워드 분석</td>
                      <td className="px-4 py-3 text-center text-gray-500">외주 50만원/월</td>
                      <td className="px-4 py-3 text-center text-purple-600 bg-purple-50/50 font-medium">자동 포함</td>
                      <td className="px-4 py-3 text-center text-green-600">50만원 절감</td>
                    </tr>
                    <tr className="border-t bg-green-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">월 총 절감액</td>
                      <td className="px-4 py-3 text-center text-gray-500">-</td>
                      <td className="px-4 py-3 text-center text-purple-600 font-medium">-</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold text-base">~440만원+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 고객 제안 포인트 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">고객 제안서 활용 포인트</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: '속도', point: '"블로그 1편을 3분 만에 생성합니다"', desc: '기획→생성→최적화→배포 전 과정 자동화로 기존 대비 97% 시간 절감' },
                  { title: '일관성', point: '"매일 빠짐없이 콘텐츠를 발행합니다"', desc: '사람에 의존하지 않는 정기 발행 시스템. 휴가, 퇴사에도 중단 없음' },
                  { title: '품질', point: '"AI 검색엔진이 인용하는 구조로 작성합니다"', desc: 'GEO/AIO 최적화로 ChatGPT, Gemini 등에서 인용 확률 극대화' },
                  { title: '확장성', point: '"고객 10명이든 100명이든 같은 비용입니다"', desc: '자동화 시나리오 복제로 고객 수 증가 시에도 추가 인력 불필요' },
                  { title: '데이터', point: '"모든 성과를 자동 추적하고 리포트합니다"', desc: 'Google Sheets/Notion에 자동 기록, 월간 리포트 자동 발송' },
                  { title: '멀티채널', point: '"하나의 콘텐츠로 5개 채널을 커버합니다"', desc: '블로그 → 인스타, 링크드인, 네이버, 카드뉴스, 요약본 자동 변환' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                    <span className="text-xs font-bold text-indigo-600 uppercase">{item.title}</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1 mb-1">{item.point}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ===== Part 5: 향후 개발 ===== */}
        {isPrinting && <div className="mt-12 mb-4 pb-2 border-b-2 border-indigo-600" style={{ breakBefore: 'page' }}><h2 className="text-2xl font-bold text-indigo-700">5. 향후 개발</h2></div>}
        {showTab('roadmap') && (
          <div className="space-y-8">
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">향후 개발 가능 기능</h2>
              <p className="text-sm text-gray-500 mb-6">
                현재 구현된 기능을 바탕으로, 추가 개발할 수 있는 기능들을 정리합니다.
                우선순위와 범위를 결정하는 데 참고하세요.
              </p>
              <div className="space-y-6">
                {/* Phase 1 */}
                <div className="border-l-4 border-green-500 pl-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Phase 1</span>
                    <span className="text-sm font-semibold text-gray-800">즉시 가능 (현재 API 기반)</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">인터랙티브 API 테스트 페이지 (/api-docs)</h4>
                      <p className="text-xs text-gray-600 mb-2">브라우저에서 직접 API를 테스트할 수 있는 Swagger 스타일 페이지. API Key를 입력하고 파라미터를 설정한 후 실행 버튼으로 결과 확인.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">프론트엔드만</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 1~2일</span>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">웹훅 테스트 페이지</h4>
                      <p className="text-xs text-gray-600 mb-2">Make.com 연동 전에 웹훅이 제대로 동작하는지 확인할 수 있는 테스트 도구. 요청/응답을 시각적으로 보여줌.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">프론트엔드만</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 1일</span>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">콘텐츠 히스토리 API</h4>
                      <p className="text-xs text-gray-600 mb-2">생성/분석/최적화한 콘텐츠를 Supabase에 자동 저장하고, Make.com에서 조회 가능한 API 제공.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">백엔드 + DB</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 2~3일</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="border-l-4 border-blue-500 pl-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Phase 2</span>
                    <span className="text-sm font-semibold text-gray-800">Make.com 깊은 통합</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">Make.com 커스텀 앱 개발</h4>
                      <p className="text-xs text-gray-600 mb-2">Make.com 마켓플레이스에 등록 가능한 커스텀 앱/모듈 개발. 사용자가 HTTP 모듈 대신 &quot;GEOAIO&quot; 모듈을 직접 검색하여 사용 가능.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Make.com SDK</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 1~2주</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">템플릿 시나리오 공유</h4>
                      <p className="text-xs text-gray-600 mb-2">미리 구성된 Make.com 시나리오 템플릿을 제공. 사용자가 Import하여 API Key만 입력하면 바로 사용 가능.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Make.com Blueprint</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 3~5일</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">실시간 웹훅 로그 대시보드</h4>
                      <p className="text-xs text-gray-600 mb-2">Make.com에서 호출한 API 요청/응답을 실시간으로 모니터링. 에러 알림, 사용량 통계 제공.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">풀스택</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 3~5일</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="border-l-4 border-purple-500 pl-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">Phase 3</span>
                    <span className="text-sm font-semibold text-gray-800">멀티 플랫폼 확장</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">n8n 연동 지원</h4>
                      <p className="text-xs text-gray-600 mb-2">셀프 호스팅 가능한 오픈소스 자동화 도구 n8n용 커스텀 노드 개발. 기업 고객 대응.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Node.js</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 1~2주</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">Zapier 통합</h4>
                      <p className="text-xs text-gray-600 mb-2">Zapier 마켓플레이스 등록. 미국/글로벌 시장 진출용.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Zapier CLI</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 1~2주</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">WordPress 플러그인</h4>
                      <p className="text-xs text-gray-600 mb-2">WordPress에서 직접 GEO/AIO 최적화 콘텐츠를 생성하고 발행하는 플러그인. Make.com 없이도 자동화 가능.</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">PHP</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 2~3주</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 우선순위 추천 */}
            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-indigo-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">추천 개발 우선순위</h2>
              <div className="space-y-3">
                {[
                  { priority: 1, item: 'API 테스트 페이지 (/api-docs)', reason: '고객/에이전시가 API를 직접 확인하고 신뢰할 수 있음', impact: '높음' },
                  { priority: 2, item: '웹훅 테스트 페이지', reason: 'Make.com 연동 전 디버깅 필수 도구', impact: '높음' },
                  { priority: 3, item: 'Make.com 템플릿 시나리오', reason: '사용자의 시작 장벽을 크게 낮춤', impact: '매우 높음' },
                  { priority: 4, item: '콘텐츠 히스토리 API', reason: '재사용, 성과 추적의 기반', impact: '중간' },
                  { priority: 5, item: 'Make.com 커스텀 앱', reason: '브랜드 인지도 + 마켓플레이스 노출', impact: '장기적 높음' },
                ].map((item) => (
                  <div key={item.priority} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {item.priority}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">{item.item}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.impact === '매우 높음' ? 'bg-red-100 text-red-700' :
                          item.impact === '높음' ? 'bg-orange-100 text-orange-700' :
                          item.impact === '장기적 높음' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>영향도: {item.impact}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {/* ===== Part 6: 올인원 배포 서비스 ===== */}
        {isPrinting && <div className="mt-12 mb-4 pb-2 border-b-2 border-indigo-600" style={{ breakBefore: 'page' }}><h2 className="text-2xl font-bold text-indigo-700">6. 올인원 배포 서비스</h2></div>}
        {showTab('allinone') && (
          <div className="space-y-8">
            {/* 핵심 컨셉 */}
            <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 sm:p-8 text-white">
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-3">핵심 컨셉</span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">콘텐츠 한 번 생성 → 원클릭 멀티채널 배포</h2>
                <p className="text-purple-100 max-w-2xl mx-auto">
                  사용자가 콘텐츠를 생성하면 결과 화면에서 바로 원하는 채널에 배포할 수 있습니다.
                  Make.com이 백그라운드에서 처리하므로 사용자는 버튼 하나만 누르면 됩니다.
                </p>
              </div>
            </section>

            {/* 배포 UI 미리보기 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">플랫폼 내 배포 화면 (구현 예시)</h2>
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-4">
                    <span className="text-2xl">📤</span>
                    <h3 className="text-lg font-bold text-gray-800 mt-1">자동 배포 채널 선택</h3>
                  </div>
                  <div className="space-y-2 mb-4">
                    {[
                      { name: '워드프레스 블로그', checked: true, icon: '🌐' },
                      { name: '네이버 블로그', checked: true, icon: '📗' },
                      { name: '인스타그램', checked: true, icon: '📷' },
                      { name: '링크드인', checked: false, icon: '💼' },
                      { name: '카드뉴스 (이미지)', checked: false, icon: '🖼️' },
                      { name: '이메일 뉴스레터', checked: false, icon: '📧' },
                      { name: '노션 페이지', checked: false, icon: '📝' },
                      { name: '티스토리', checked: false, icon: '📘' },
                    ].map((ch, i) => (
                      <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                        <input type="checkbox" defaultChecked={ch.checked} className="w-4 h-4 text-indigo-600 rounded" readOnly />
                        <span className="text-lg">{ch.icon}</span>
                        <span className="text-sm text-gray-700">{ch.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">⏰</span>
                    <select className="text-sm text-gray-700 bg-transparent flex-1" defaultValue="now">
                      <option value="now">즉시 발행</option>
                      <option value="schedule">예약 발행</option>
                    </select>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-shadow cursor-default">
                    🚀 선택 채널에 배포하기
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                * 실제 구현 시 콘텐츠 생성 결과 화면 하단에 이 배포 패널이 표시됩니다
              </p>
            </section>

            {/* 작동 방식 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">작동 방식</h2>
              <p className="text-sm text-gray-600 mb-4">
                사용자는 Make.com의 존재를 알 필요 없습니다. 플랫폼 내에서 버튼 하나로 배포됩니다.
              </p>
              <div className="bg-gray-900 rounded-xl p-5 text-sm font-mono text-gray-300 overflow-x-auto">
                <pre className="whitespace-pre leading-relaxed">{`플랫폼 UI (배포 버튼 클릭)
    │
    ▼
우리 API (/api/distribute)
    │  채널별 콘텐츠 자동 변환
    │  Make.com 웹훅 호출
    ▼
Make.com (백그라운드 처리)
    │
    ├──► 워드프레스 API → 블로그 게시
    ├──► Instagram API → 인스타 게시
    ├──► LinkedIn API  → 링크드인 게시
    ├──► 네이버 API    → 네이버 블로그 게시
    ├──► Notion API    → 노션 페이지 생성
    └──► Gmail API     → 뉴스레터 발송

    ▼
플랫폼 대시보드 (결과 확인)
    • 배포 상태: 성공/실패
    • 각 채널 게시물 링크
    • 발행 이력 로그`}</pre>
              </div>
            </section>

            {/* 3가지 서비스 패키지 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">제공 가능한 서비스</h2>
              <p className="text-sm text-gray-500 mb-6">플랫폼 × Make.com 연동으로 3가지 핵심 서비스를 제공할 수 있습니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 서비스 A */}
                <div className="border-2 border-blue-100 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-3">📤</div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">원클릭 멀티채널 배포</h3>
                  <p className="text-xs text-gray-500 mb-4">콘텐츠 생성 → 채널 체크 → 배포 버튼 1번</p>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-start gap-1.5"><span className="text-blue-500">&#10003;</span>채널별 포맷 자동 변환</li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500">&#10003;</span>해시태그 생성</li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500">&#10003;</span>이미지 리사이징</li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500">&#10003;</span>즉시/예약 발행</li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500">&#10003;</span>발행 이력 관리</li>
                  </ul>
                </div>
                {/* 서비스 B */}
                <div className="border-2 border-purple-100 rounded-2xl p-5 hover:border-purple-300 hover:shadow-lg transition-colors">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-3">🔄</div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">정기 콘텐츠 구독 자동화</h3>
                  <p className="text-xs text-gray-500 mb-4">주제/키워드 + 발행 주기만 설정</p>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-start gap-1.5"><span className="text-purple-500">&#10003;</span>매주/매일 생성 + 배포</li>
                    <li className="flex items-start gap-1.5"><span className="text-purple-500">&#10003;</span>시리즈 기획 자동화</li>
                    <li className="flex items-start gap-1.5"><span className="text-purple-500">&#10003;</span>키워드 자동 로테이션</li>
                    <li className="flex items-start gap-1.5"><span className="text-purple-500">&#10003;</span>성과 리포트 자동 발송</li>
                    <li className="flex items-start gap-1.5"><span className="text-purple-500">&#10003;</span>발행 알림 (이메일/슬랙)</li>
                  </ul>
                </div>
                {/* 서비스 C */}
                <div className="border-2 border-emerald-100 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-lg transition-colors">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-3">♻️</div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">콘텐츠 리사이클링</h3>
                  <p className="text-xs text-gray-500 mb-4">기존 콘텐츠 업로드 → 5개 채널 변환 배포</p>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500">&#10003;</span>PDF, DOCX, URL 파싱</li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500">&#10003;</span>AIO 점수 분석 + 최적화</li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500">&#10003;</span>5개 채널 자동 변환</li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500">&#10003;</span>보도자료 → 멀티콘텐츠</li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500">&#10003;</span>기존 콘텐츠 개선 제안</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 사용자 여정 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">사용자 여정 (User Journey)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    step: 1,
                    title: '콘텐츠 생성',
                    desc: '주제 입력 → GEO/AIO 최적화 콘텐츠 생성',
                    icon: '✍️',
                    bgClass: 'bg-blue-50 border-blue-100',
                    details: undefined as string[] | undefined,
                  },
                  {
                    step: 2,
                    title: '채널 연결 (최초 1회)',
                    desc: '설정 페이지에서 배포할 채널 계정 연결',
                    icon: '🔗',
                    bgClass: 'bg-indigo-50 border-indigo-100',
                    details: ['워드프레스: URL + 앱 비밀번호', '인스타그램: Facebook Business 연동', '네이버: 블로그 API 키', '링크드인: OAuth 로그인'],
                  },
                  {
                    step: 3,
                    title: '배포',
                    desc: '결과 화면에서 채널 선택 → 배포 버튼 클릭',
                    icon: '🚀',
                    bgClass: 'bg-purple-50 border-purple-100',
                    details: undefined as string[] | undefined,
                  },
                  {
                    step: 4,
                    title: '결과 확인',
                    desc: '대시보드에서 배포 이력, 상태, 채널별 링크 확인',
                    icon: '📊',
                    bgClass: 'bg-emerald-50 border-emerald-100',
                    details: undefined as string[] | undefined,
                  },
                ].map((item) => (
                  <div key={item.step} className="relative">
                    <div className={`${item.bgClass} rounded-xl p-5 h-full border`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{item.step}</span>
                        <span className="text-xl">{item.icon}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-800 mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                      {item.details && (
                        <ul className="mt-2 space-y-1">
                          {item.details.map((d, i) => (
                            <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                              <span className="text-indigo-400">-</span>{d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 기술 구현 방안 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기술 구현 방안 비교</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border-2 border-green-200 rounded-2xl p-5 bg-green-50 relative">
                  <div className="absolute -top-3 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">추천</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 mt-1">방법 A: Make.com을 백엔드로 활용</h3>
                  <div className="bg-white rounded-lg p-3 mb-3 text-xs font-mono text-gray-700">
                    플랫폼 UI → 우리 API → Make.com 웹훅 → 각 채널 API
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-start gap-1.5"><span className="text-green-500">&#10003;</span>채널 연동 로직을 Make.com이 처리</li>
                    <li className="flex items-start gap-1.5"><span className="text-green-500">&#10003;</span>개발 부담 최소 (배포 버튼 + API 1개)</li>
                    <li className="flex items-start gap-1.5"><span className="text-green-500">&#10003;</span>Make.com Pro 월 $9 (10,000 오퍼레이션)</li>
                    <li className="flex items-start gap-1.5"><span className="text-green-500">&#10003;</span>새 채널 추가 시 Make.com에서만 설정</li>
                  </ul>
                </div>
                <div className="border-2 border-gray-200 rounded-2xl p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-2">방법 B: 자체 배포 엔진 개발</h3>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs font-mono text-gray-700">
                    플랫폼 UI → 우리 API → 직접 각 채널 API 호출
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-start gap-1.5"><span className="text-gray-400">&#10003;</span>Make.com 의존 없음, 완전 제어</li>
                    <li className="flex items-start gap-1.5"><span className="text-red-400">✕</span>각 채널 API 직접 구현 필요</li>
                    <li className="flex items-start gap-1.5"><span className="text-red-400">✕</span>OAuth 관리, 토큰 갱신 등 복잡</li>
                    <li className="flex items-start gap-1.5"><span className="text-red-400">✕</span>개발 기간 3~5배 증가</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 차별화 포인트 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기존 서비스 대비 차별화</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">비교 항목</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-400">기존 서비스</th>
                      <th className="text-left px-4 py-3 font-medium text-indigo-600 bg-indigo-50">우리 서비스</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-700">콘텐츠 생성</td>
                      <td className="px-4 py-3 text-gray-500">ChatGPT, Jasper — 생성만 제공</td>
                      <td className="px-4 py-3 text-indigo-700 bg-indigo-50/50 font-medium">생성 + AIO 최적화 + 멀티채널 배포</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-700">배포 도구</td>
                      <td className="px-4 py-3 text-gray-500">Buffer, Hootsuite — 배포만 제공</td>
                      <td className="px-4 py-3 text-indigo-700 bg-indigo-50/50 font-medium">콘텐츠 생성 + AI 검색 최적화 + 배포</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-700">작업 방식</td>
                      <td className="px-4 py-3 text-gray-500">채널별 따로 작성, 수동 반복</td>
                      <td className="px-4 py-3 text-indigo-700 bg-indigo-50/50 font-medium">원본 1개 → 자동 변환 → 동시 배포</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-700">AI 검색 최적화</td>
                      <td className="px-4 py-3 text-gray-500">지원 안 함</td>
                      <td className="px-4 py-3 text-indigo-700 bg-indigo-50/50 font-medium">GEO/AIO 전용 최적화 엔진 탑재</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-700">사용자 경험</td>
                      <td className="px-4 py-3 text-gray-500">여러 도구 오가며 작업</td>
                      <td className="px-4 py-3 text-indigo-700 bg-indigo-50/50 font-medium">키워드 입력 → 버튼 1번 → 끝</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 수익 모델 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">수익 모델 (구독형)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Free', price: '0원', desc: '체험용', features: ['월 5편 생성', '1채널 배포', 'AIO 점수 분석'], color: 'gray' },
                  { name: 'Basic', price: '29,000원', desc: '개인 사업자', features: ['월 30편 생성', '3채널 배포', '키워드 분석', '예약 발행'], color: 'blue' },
                  { name: 'Pro', price: '99,000원', desc: '전문 마케터', features: ['무제한 생성', '전 채널 배포', '시리즈 기획', '성과 리포트', '경쟁사 모니터링'], color: 'purple', popular: true },
                  { name: 'Agency', price: '290,000원', desc: '에이전시', features: ['고객 10명 관리', '화이트라벨', '팀 계정', '전용 대시보드', 'API 접근'], color: 'indigo' },
                ].map((plan) => (
                  <div key={plan.name} className={`border-2 rounded-2xl p-5 relative ${
                    plan.popular ? 'border-purple-300 bg-purple-50' : 'border-gray-100'
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-3 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">BEST</div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{plan.desc}</p>
                    <div className="text-xl font-bold text-gray-900 mb-3">
                      {plan.price}<span className="text-xs text-gray-400 font-normal">/월</span>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className={`${plan.popular ? 'text-purple-500' : 'text-indigo-500'}`}>&#10003;</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 구현 우선순위 */}
            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-indigo-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">구현 우선순위</h2>
              <div className="space-y-3">
                {[
                  { priority: 1, item: '채널 연결 설정 페이지', desc: '사용자가 배포 채널 계정 정보를 입력/관리하는 페이지', effort: '2~3일' },
                  { priority: 2, item: '콘텐츠 결과 화면에 배포 버튼 추가', desc: '생성 결과 하단에 채널 선택 + 즉시/예약 발행 UI', effort: '1~2일' },
                  { priority: 3, item: '배포 API 엔드포인트 (/api/distribute)', desc: 'Make.com 웹훅을 호출하는 서버 API', effort: '1일' },
                  { priority: 4, item: 'Make.com 시나리오 구성', desc: '채널별 배포 로직 (워드프레스, 인스타, 네이버 등)', effort: '2~3일' },
                  { priority: 5, item: '배포 이력 대시보드', desc: '발행 상태, 채널별 링크, 에러 로그 조회', effort: '2~3일' },
                ].map((item) => (
                  <div key={item.priority} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {item.priority}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">{item.item}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">예상 {item.effort}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {/* ===== Part 7: 경쟁력 분석 ===== */}
        {isPrinting && <div className="mt-12 mb-4 pb-2 border-b-2 border-indigo-600" style={{ breakBefore: 'page' }}><h2 className="text-2xl font-bold text-indigo-700">7. 경쟁력 분석</h2></div>}
        {showTab('competitive') && (
          <div className="space-y-8">
            {/* 히어로 */}
            <section className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-2xl p-6 sm:p-8 text-white">
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm mb-3">Competitive Analysis</span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">경쟁력 분석 및 시장 영향 예측</h2>
                <p className="text-indigo-200 max-w-2xl mx-auto text-sm">
                  GEOAIO의 경쟁 환경, 차별적 가치, 시장 영향력, 고객 세그먼트별 반응을 분석합니다.
                </p>
              </div>
            </section>

            {/* 직접 경쟁자 비교 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">직접 경쟁자 비교</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-gray-600">경쟁사</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-gray-600">핵심 기능</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-gray-600">한계점</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-indigo-600 bg-indigo-50">우리의 차별점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'ChatGPT / Claude', feature: '범용 AI 콘텐츠 생성', limit: 'GEO/AIO 최적화 전무, 매번 프롬프트 작성', diff: 'GEO/AIO 전용 엔진 내장, 원클릭 생성' },
                      { name: 'Jasper AI', feature: '마케팅 콘텐츠 생성', limit: 'SEO 중심, AI 검색 최적화 없음, 영어 중심', diff: '한국어 GEO/AIO 최적화, E-E-A-T 자동 적용' },
                      { name: 'SurferSEO', feature: 'SEO 콘텐츠 분석/최적화', limit: '구글 SEO만 대응, AI 검색엔진 미대응', diff: 'AI 검색엔진 인용 최적화 (ChatGPT, Gemini, Perplexity)' },
                      { name: 'Frase.io', feature: 'SEO 리서치 + 콘텐츠', limit: 'SERP 기반 분석만, AIO 점수 없음', diff: 'GEO/AIO 점수 측정 + 개선 가이드 제공' },
                      { name: '뤼튼 (Wrtn)', feature: '한국어 AI 콘텐츠', limit: '범용 생성, 마케팅 최적화 약함', diff: 'GEO/AIO 특화, 산업별 맞춤, 멀티채널 변환' },
                      { name: 'Buffer / Hootsuite', feature: 'SNS 예약 발행', limit: '콘텐츠 생성 불가, 배포만', diff: '생성 + 최적화 + 변환 + 배포 올인원' },
                      { name: '블로그 마케팅 업체', feature: '수작업 블로그 대행', limit: '월 수백만원, AIO 개념 없음', diff: '자동화로 90% 비용 절감, AI 검색 최적화' },
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{row.name}</td>
                        <td className="px-3 py-2.5 text-gray-600">{row.feature}</td>
                        <td className="px-3 py-2.5 text-red-500">{row.limit}</td>
                        <td className="px-3 py-2.5 text-indigo-700 bg-indigo-50/50 font-medium">{row.diff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 간접 경쟁자 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">간접 경쟁자</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { category: '마케팅 에이전시', name: '블로그 마케팅 대행사', relation: '잠재 고객이자 경쟁자', color: 'bg-amber-50 border-amber-100' },
                  { category: 'SEO 도구', name: 'Ahrefs, SEMrush', relation: '전통 SEO 분석, AI 대응 부족', color: 'bg-blue-50 border-blue-100' },
                  { category: '자동화 도구', name: 'Make.com, Zapier', relation: '경쟁 아닌 통합 파트너', color: 'bg-green-50 border-green-100' },
                  { category: 'CMS 플러그인', name: 'Yoast SEO, RankMath', relation: 'WordPress SEO만, AIO 없음', color: 'bg-purple-50 border-purple-100' },
                ].map((item, i) => (
                  <div key={i} className={`${item.color} rounded-xl p-4 border`}>
                    <span className="text-xs font-bold text-gray-500 uppercase">{item.category}</span>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.relation}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 5대 차별성 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">5대 핵심 차별성</h2>
              <div className="space-y-4">
                {[
                  {
                    num: 1,
                    title: '유일한 GEO/AIO 전용 플랫폼',
                    desc: '현재 시장에 GEO/AIO 전용 최적화 플랫폼은 존재하지 않습니다. SEO 도구는 많지만, ChatGPT/Gemini/Perplexity 등 AI 검색엔진이 콘텐츠를 인용하도록 최적화하는 전용 도구는 우리가 최초입니다.',
                    badge: '카테고리 최초',
                    badgeColor: 'bg-red-100 text-red-700',
                  },
                  {
                    num: 2,
                    title: '분석 → 생성 → 최적화 → 배포 올인원',
                    desc: '기존에는 분석(SurferSEO) + 생성(Jasper) + 배포(Buffer) = 3개 도구에 월 $200+ 비용이 필요했습니다. 우리는 하나의 플랫폼에서 전 과정을 처리합니다.',
                    badge: '비용 80% 절감',
                    badgeColor: 'bg-green-100 text-green-700',
                  },
                  {
                    num: 3,
                    title: '한국 시장 특화',
                    desc: '네이버 블로그 SEO, 한국어 E-E-A-T 구조, 한국 산업별 맞춤 최적화 (의료, 법률, 교육, 부동산 등), 카드뉴스 형식 변환 등 한국 시장 고유 기능을 지원합니다.',
                    badge: '로컬 최적화',
                    badgeColor: 'bg-blue-100 text-blue-700',
                  },
                  {
                    num: 4,
                    title: '특허 기술 보호',
                    desc: '특허 및 저작권 등록으로 법적 보호를 받고 있습니다. 경쟁사의 단순 모방을 차단하고 기술적 해자(moat)를 확보했습니다.',
                    badge: '법적 보호',
                    badgeColor: 'bg-amber-100 text-amber-700',
                  },
                  {
                    num: 5,
                    title: '자동화 연동 설계',
                    desc: 'Make.com/Zapier/n8n 연동을 처음부터 고려한 API 설계로, 에이전시가 구독형 서비스로 재판매 가능한 구조를 갖추고 있습니다.',
                    badge: '생태계 구축',
                    badgeColor: 'bg-purple-100 text-purple-700',
                  },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                    <span className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">{item.num}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>{item.badge}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 패러다임 전환 */}
            <section className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white">
              <h2 className="text-xl font-bold mb-4">시장 패러다임 전환</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-5 text-center">
                  <span className="text-xs text-indigo-300 uppercase font-semibold">현재</span>
                  <p className="text-lg font-bold mt-2">&ldquo;SEO 잘 되는 글&rdquo;</p>
                  <p className="text-xs text-indigo-200 mt-1">= 좋은 콘텐츠의 기준</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-5 text-center border-2 border-purple-400/50">
                  <span className="text-xs text-purple-300 uppercase font-semibold">미래 (우리가 선도)</span>
                  <p className="text-lg font-bold mt-2">&ldquo;AI가 인용하는 글&rdquo;</p>
                  <p className="text-xs text-purple-200 mt-1">= 좋은 콘텐츠의 새 기준</p>
                </div>
              </div>
            </section>

            {/* 시장 영향 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">시장 영향 예측</h2>
              <div className="space-y-4">
                {/* 비용 구조 변화 */}
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">💰</span> 콘텐츠 마케팅 비용 구조 변화
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-emerald-200">
                          <th className="text-left px-3 py-2 font-medium text-gray-600">항목</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-400">현재</th>
                          <th className="text-center px-3 py-2 font-medium text-emerald-600">도입 후</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-emerald-100"><td className="px-3 py-2 text-gray-700">콘텐츠 1편 비용</td><td className="px-3 py-2 text-center text-gray-500">5~20만원</td><td className="px-3 py-2 text-center text-emerald-700 font-medium">500~1,000원</td></tr>
                        <tr className="border-b border-emerald-100"><td className="px-3 py-2 text-gray-700">월 20편 운영비</td><td className="px-3 py-2 text-center text-gray-500">100~400만원</td><td className="px-3 py-2 text-center text-emerald-700 font-medium">1~2만원</td></tr>
                        <tr className="border-b border-emerald-100"><td className="px-3 py-2 text-gray-700">멀티채널 추가 비용</td><td className="px-3 py-2 text-center text-gray-500">채널당 추가</td><td className="px-3 py-2 text-center text-emerald-700 font-medium">무료 (자동 변환)</td></tr>
                        <tr><td className="px-3 py-2 text-gray-700">진입 장벽</td><td className="px-3 py-2 text-center text-gray-500">전문 인력 필요</td><td className="px-3 py-2 text-center text-emerald-700 font-medium">키워드만 입력</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium mt-3 text-center">
                    → 소상공인, 1인 기업도 대기업 수준의 콘텐츠 마케팅이 가능해집니다
                  </p>
                </div>

                {/* 에이전시 산업 재편 */}
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">🏢</span> 마케팅 에이전시 산업 재편
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-xs font-bold text-red-500">단순 대행 에이전시</span>
                      <p className="text-xs text-gray-600 mt-1">가격 경쟁력 상실 → 서비스 고도화 필요</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-xs font-bold text-blue-600">전략형 에이전시</span>
                      <p className="text-xs text-gray-600 mt-1">우리 플랫폼을 도구로 활용 → 생산성 극대화</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-xs font-bold text-emerald-600">신규 유형 등장</span>
                      <p className="text-xs text-gray-600 mt-1">&ldquo;AIO 마케팅 전문 에이전시&rdquo; 새 카테고리</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 고객 세그먼트별 반응 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">고객 세그먼트별 예상 반응</h2>
              <div className="space-y-4">
                {[
                  {
                    segment: '소상공인 / 자영업자',
                    reaction: '"드디어 나도 블로그 마케팅을 할 수 있겠다"',
                    positive: ['비용 부담 제거', '전문 지식 불필요', '즉시 사용 가능'],
                    concern: '"AI가 만든 글이 진짜 효과가 있나?"',
                    persuasion: '무료 체험 → AIO 점수 비교 → AI 검색 인용 사례',
                    conversion: '15~25%',
                    emoji: '🏪',
                    bgColor: 'bg-orange-50 border-orange-100',
                  },
                  {
                    segment: '마케팅 담당자 (중소기업)',
                    reaction: '"SEO도 아직 어려운데 AIO가 뭐지? ... 이거 필요하겠다"',
                    positive: ['분석 리포트 생성', '멀티채널 한 번에 해결', '상사 보고에 활용'],
                    concern: '"기존 SEO 전략과 충돌하지 않나?"',
                    persuasion: 'AIO가 SEO를 보완한다는 점 + 톤 커스터마이징',
                    conversion: '20~35%',
                    emoji: '👔',
                    bgColor: 'bg-blue-50 border-blue-100',
                  },
                  {
                    segment: '마케팅 에이전시',
                    reaction: '"인건비 80% 절감 vs 고객이 직접 하겠다고 하면?"',
                    positive: ['인건비 절감', '고객당 수익률 증가', '새 서비스 상품화'],
                    concern: '"고객 이탈 가능성, 블로그 대행 가치 하락"',
                    persuasion: 'Agency 화이트라벨 + 전략 컨설팅은 여전히 사람 필요',
                    conversion: '얼리어답터 빠른 도입 → 나머지 추종',
                    emoji: '🏢',
                    bgColor: 'bg-purple-50 border-purple-100',
                  },
                  {
                    segment: '대기업 마케팅팀',
                    reaction: '"검증이 필요하다. 보안은? 커스터마이징은?"',
                    positive: ['AI 검색 대응 필요성 인식', '대규모 콘텐츠 자동화'],
                    concern: '"데이터 보안, 브랜드 가이드라인 준수"',
                    persuasion: 'API 기반 통합 + 온프레미스 옵션 (향후) + 커스텀 프롬프트',
                    conversion: '검토 3~6개월 → 파일럿 → 전사 도입',
                    emoji: '🏛️',
                    bgColor: 'bg-slate-50 border-slate-100',
                  },
                  {
                    segment: '콘텐츠 크리에이터 / 블로거',
                    reaction: '"AI 글이 내 글보다 AIO 점수가 높다고? 같이 쓰자"',
                    positive: ['초안 생성 → 자기 스타일로 수정', '생산성 극대화'],
                    concern: '"AI 글 감지, 고유한 목소리 상실"',
                    persuasion: 'AI 초안 + 사람의 경험/관점 = 최적 조합',
                    conversion: '자연스러운 채택',
                    emoji: '✍️',
                    bgColor: 'bg-emerald-50 border-emerald-100',
                  },
                ].map((seg, i) => (
                  <div key={i} className={`${seg.bgColor} rounded-xl p-5 border`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{seg.emoji}</span>
                      <h3 className="text-sm font-bold text-gray-900">{seg.segment}</h3>
                    </div>
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-sm text-indigo-700 font-medium italic">{seg.reaction}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-green-700 block mb-1">긍정 요인</span>
                        <ul className="space-y-0.5 text-gray-600">
                          {seg.positive.map((p, pi) => <li key={pi} className="flex items-start gap-1"><span className="text-green-500">+</span>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-red-600 block mb-1">우려 사항</span>
                        <p className="text-gray-600">{seg.concern}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-600 block mb-1">설득 포인트</span>
                        <p className="text-gray-600">{seg.persuasion}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-600 block mb-1">예상 전환</span>
                        <p className="text-gray-700 font-medium">{seg.conversion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 경쟁사 예상 대응 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">경쟁사 예상 대응 및 방어 전략</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {/* 단기 */}
                <div className="border border-amber-200 rounded-xl p-5 bg-amber-50">
                  <h3 className="text-sm font-bold text-amber-800 mb-3">단기 (6개월 이내)</h3>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-start gap-2"><span className="text-amber-500 font-bold shrink-0">SEO 도구</span><span>&ldquo;AI 검색 최적화&rdquo; 기능 추가 시도, 기존 SEO 프레임에 얹는 수준</span></li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 font-bold shrink-0">AI 글쓰기</span><span>&ldquo;AIO 최적화&rdquo; 마케팅 문구 추가, 실질 기능 제한적</span></li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 font-bold shrink-0">대행사</span><span>가격 인하, &ldquo;사람이 쓴 글이 더 좋다&rdquo; 포지셔닝</span></li>
                  </ul>
                </div>
                {/* 중기 */}
                <div className="border border-red-200 rounded-xl p-5 bg-red-50">
                  <h3 className="text-sm font-bold text-red-800 mb-3">중기 (6~18개월)</h3>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold shrink-0">대형 플랫폼</span><span>AIO 기능 부분 도입, 범용 도구의 한계로 깊이 부족</span></li>
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold shrink-0">SEO 도구</span><span>AIO 전용 모듈 개발, 직접 경쟁 시작</span></li>
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold shrink-0">신규 진입자</span><span>GEO/AIO 카테고리 보고 유사 서비스 출시 시도</span></li>
                  </ul>
                </div>
              </div>

              {/* 방어 전략 */}
              <h3 className="text-sm font-bold text-gray-800 mb-3">우리의 5대 방어 전략</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { icon: '🛡️', title: '특허 보호', desc: '핵심 알고리즘 법적 보호' },
                  { icon: '🥇', title: '선점 효과', desc: '카테고리 최초 브랜드 인지' },
                  { icon: '📊', title: '데이터 해자', desc: '분석 데이터 축적 → 품질 향상' },
                  { icon: '🔗', title: '생태계 구축', desc: 'API + 파트너 → 전환 비용' },
                  { icon: '🇰🇷', title: '로컬 최적화', desc: '글로벌 경쟁사 추격 어려움' },
                ].map((s, i) => (
                  <div key={i} className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                    <span className="text-2xl">{s.icon}</span>
                    <h4 className="text-xs font-bold text-gray-800 mt-2">{s.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 시장 기회 규모 */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">시장 기회 규모</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-xs font-bold text-blue-600 uppercase mb-2">한국 콘텐츠 마케팅 시장</h3>
                  <p className="text-2xl font-bold text-gray-900">약 2조원</p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-600">
                    <li>블로그 마케팅: ~5,000억원</li>
                    <li>SNS 마케팅: ~8,000억원</li>
                    <li>SEO/SEM: ~3,000억원</li>
                  </ul>
                </div>
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="text-xs font-bold text-purple-600 uppercase mb-2">GEO/AIO 신규 시장</h3>
                  <p className="text-2xl font-bold text-gray-900">1,000~3,000억원</p>
                  <p className="text-xs text-gray-500 mt-2">AI 검색 전환에 따른 신규 카테고리</p>
                  <p className="text-xs text-purple-600 font-medium mt-1">우리가 최초로 정의하는 시장</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase mb-2">초기 타겟</h3>
                  <p className="text-2xl font-bold text-gray-900">500만+ 사업체</p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-600">
                    <li>소상공인 + 중소기업: ~500만개</li>
                    <li>마케팅 에이전시: ~5,000개</li>
                  </ul>
                  <p className="text-xs text-emerald-700 font-medium mt-2">3년 목표 1~3% 점유 → 100~300억원</p>
                </div>
              </div>
            </section>

            {/* 핵심 요약 */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
              <h2 className="text-xl font-bold mb-5 text-center">핵심 요약</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: '최대 강점', value: 'GEO/AIO 전용 "최초" 플랫폼' },
                  { label: '차별적 가치', value: '분석→생성→최적화→변환→배포 올인원' },
                  { label: '시장 타이밍', value: 'AI 검색 전환기, 카테고리 선점 기회' },
                  { label: '기대 반응', value: '소상공인 환영, 에이전시 양면적, 대기업 관망' },
                  { label: '경쟁 방어', value: '특허 + 선점 + 데이터 + 생태계' },
                  { label: '최대 리스크', value: '시장 교육 비용 (GEO/AIO 인지도)' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4">
                    <span className="text-xs text-indigo-200 uppercase font-semibold">{item.label}</span>
                    <p className="text-sm font-bold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 text-center">
                <p className="text-sm text-indigo-200">
                  <strong className="text-white">핵심 전략:</strong> 무료 체험으로 진입 장벽을 낮추고, 에이전시 파트너십으로 확산
                </p>
              </div>
            </section>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
