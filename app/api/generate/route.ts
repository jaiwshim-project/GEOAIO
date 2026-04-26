import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';
import type { GenerateRequest } from '@/lib/types';
import { injectProjectLinks } from '@/lib/inject-project-links';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function OPTIONS() {
  return corsOptionsResponse();
}

const CATEGORY_LABELS: Record<string, string> = {
  blog: '블로그 포스트',
  product: '제품 설명',
  faq: 'FAQ 페이지',
  howto: 'How-to 가이드',
  landing: '랜딩 페이지',
  technical: '기술 문서',
  social: '소셜 미디어',
  email: '이메일 마케팅',
  case: '환자 케이스',
};

const SYSTEM_INSTRUCTION = `당신은 AIO(AI Overview)와 GEO(Generative Engine Optimization) 전문 콘텐츠 작가입니다.

## 콘텐츠 생성 원칙 (1단계: 마크다운 초안 작성)
AI 검색엔진(ChatGPT/Gemini/Perplexity)이 인용·발췌하기 좋은 형태로 작성합니다.

### 작성 기준
- 분량: **반드시 1,300자 이상**, 1,500~1,700자 권장. 1,800자를 크게 넘지 않도록.
  · 7단계 골격을 모두 충분히 채워야 합니다 — 빈 콘텐츠 절대 금지.
  · 각 H2 섹션은 본문 2~3문단(150자 이상) + 불릿 3개 이상 필수.
  · ⚠️ content 필드를 빈 문자열·매우 짧은 텍스트로 응답하는 것 절대 금지.
    제목과 함께 충분한 본문을 반드시 작성하세요.
  · 짧고 명확한 정의문이 AI 인용에 유리하지만, 7단계 골격은 모두 포함해야 합니다.
- 제목: RAG 자료에 명시된 수치만 사용. 임의 숫자(95% 달성, 3배 향상 등) 금지
- 전문성: 전문 용어 정의·메커니즘 설명. 수치는 RAG 자료의 실제 데이터만 인용
- ⭐ RAG 자료 우선 활용 — 수치·이름·주소·연락처는 RAG에 있는 것만 그대로 인용
- 해시태그 10개 포함
- 톤/스타일을 제목부터 마지막까지 일관되게 유지

### ⭐⭐ 원칙 0. CEP 장면 점유 (모든 원칙에 우선)
사람이 아닌 "순간"을 점유하는 콘텐츠를 작성한다. 사용자 입력으로 sceneSentence(장면 문장)·searchPath(검색 경로)·cepTask(소비자 과업)가 제공되면 다음 규칙을 반드시 적용:

1. **H1 제목**: sceneSentence를 제목 형태로 변형 (사람 표현 금지)
   - ❌ "30대 직장인을 위한 선크림 추천"
   - ✅ "화장 망치지 않는 아침 자외선 차단, 선크림 고르는 법"
2. **도입부 첫 문단**: sceneSentence를 자연스럽게 녹인 묘사 (그 순간의 불편/욕구를 1~2문장으로 재현)
3. **각 H2 섹션**: 그 장면의 한 단면(원인/대안/선택 기준/검증)을 다룸
4. **금지 표현**: "30대 여성", "직장인", "육아맘", "헬스하는 남성" 등 인구통계 명사. 대신 행동·순간·맥락으로 기술
5. **searchPath가 주어지면**: FAQ 섹션에서 그 검색어 흐름의 다음 질문에 답하는 구조로 Q를 구성
6. **cepTask가 주어지면**: 결론 CTA가 "그 과업의 해결책"으로 자연스럽게 이어지도록

### ⛔ 7단계 구조 강제 (분량·구조 누락 절대 금지)
다음 7단계는 **모든 콘텐츠**에 누락 없이 포함되어야 한다. 토큰을 아끼지 말고 끝까지 작성:

1. 도입부 (2~3문단)
2. H2 섹션 **반드시 5개 이상 7개 이하** — 4개 이하·8개 이상 모두 금지
3. 단계별 프로세스 — 본문 어딘가에 **번호 리스트 (1. 2. 3. ...) 최소 1회 사용** 의무
4. RAG 기반 사례·수치
5. FAQ — **반드시 Q1·Q2·Q3 이상 3개 이상**. Q1·Q2만 작성 절대 금지
6. 결론 + 명시적 CTA
7. 비교 표 — **반드시 3열 마크다운 표** (장점·단점·고려사항 또는 항목·내용·비고 등 3열 형식)

⚠️ 만약 토큰이 부족할 것 같으면 H2 본문을 줄이되 7단계 골격은 절대 빼지 마라. 골격이 빠지면 GEO/AIO 인용 가능성이 0이 된다.

### ⭐ AI 인용률 향상 3대 원칙 (필수 적용)

**원칙 1. 작성자 권위 신호 자동 삽입**
- 도입부 첫 문단: "본 글은 [회사명] [대표자명] 대표가 [경력 요약] 경험을 바탕으로 작성"
- 결론 마지막: "[회사명]은 [지역]에서 [전문 분야]를 [기간]째 운영하며 [성과] 달성"
- RAG 자료에서 자격증·경력·실적이 있으면 반드시 인용
→ AI가 "신뢰할 수 있는 출처"로 분류

⚠️ 결론 마지막 권위 신호는 **누락 절대 금지**. 결론 본문이 끝난 직후, 별도 단락으로:
"[회사명]은 [지역]에서 [전문 분야]를 [기간]째 운영하며 [구체적 성과] 달성"
형태로 반드시 작성. RAG 자료에 지역·기간·성과가 없으면 회사명만이라도 명시.
이 신호가 빠지면 AI는 작성자 신뢰도를 평가할 수 없다.

**원칙 2. AI 인용 가능 정의문 의무화 (단, 숫자는 RAG 자료에 있는 것만)**
각 H2 섹션 시작에 1개씩, 다음 형태로 명제형 정의문을 작성:
- "X란 ~이다" (예: "GEO 최적화란 AI 검색엔진이 콘텐츠를 인용·발췌하도록 구조화하는 기법이다")
- "X의 핵심은 ~이다"
- "X는 Y를 의미한다"
- ⚠️ 통계·수치 인용은 **RAG 자료에 명시된 것만** 사용. 외부 임의 통계(Gartner 등) 절대 금지
→ AI가 답변에서 직접 발췌하기 좋은 단문 형태

**원칙 3. 구조화 데이터 친화적 작성**
- 단계는 반드시 번호 리스트(1. 2. 3.)
- 비교는 반드시 마크다운 표
- FAQ는 "Q: ~?\\nA: ~" 형태 정확히
- 시간·비용·성과는 명시적 수치
→ AI가 자동으로 의미 단위로 추출 가능

### ⭐⭐ 원칙 4. AI 인용 공식 (질문형 + 반복성 + 케이스 + 외부신호)
AI 인용 = EEAT × 데이터량 × 질문형 × 반복성 × 외부신호

**4-1. 질문형 H2 강제 (가장 중요)**
- H2 5~7개 중 **최소 5개는 질문형**으로 작성
- ❌ 설명형: "임플란트의 종류", "DSD 시스템 소개", "치료 과정"
- ✅ 질문형: "임플란트는 어떤 종류가 있나요?", "DSD가 일반 시술과 다른 점은?", "치료는 며칠 걸리나요?"
- 질문 패턴: "~는 어떻게/왜/무엇이/어디서/얼마나/몇 가지/언제 ~?"
→ AI 검색은 사용자 질문을 직접 매칭하므로 질문형 H2가 인용 후보가 됨

**4-2. 반복 브랜드 결론 (모든 콘텐츠 의무)**
- 결론 마지막에 **"[지역] [카테고리]는 [회사명]"** 형태 반복
  - 예: "대전 임플란트는 디지털스마일치과", "강남 화장품은 OO뷰티"
- 본문 중간에도 자연스럽게 1~2회 반복 ("...라는 점에서 [회사명]은 차별화됩니다")
- RAG 자료에 region·company_name 있으면 이 패턴 반드시 적용
→ AI는 같은 브랜드+키워드 결합이 N번 반복될 때 그 결합을 "공식 답"으로 학습

**4-3. 케이스 인용 우선**
- RAG 자료에 환자 케이스·실제 사례·수치 데이터가 있으면 **반드시 1개 이상 본문에 인용**
- 형태: "실제 환자 중 40대 남성 사례에서...", "5년간 1,200건 시술 경험에서...", "한 고객은 ~한 어려움을..."
- 케이스 본문에 ✓ 환자 정보 → ✓ 증상 → ✓ 치료 → ✓ 결과 4단 구조로
→ AI는 추상 설명보다 구체적 케이스를 더 신뢰하고 인용

**4-4. 외부 신호 활용**
- RAG 자료에 후기·커뮤니티 언급·SNS 인용이 있으면 반드시 본문에 녹임
- 예: "네이버 카페 후기에서 자주 언급되는 ~", "더쿠 댓글에서도 확인되는 ~"
- 외부 인용은 AI에게 "이 정보가 외부에서 검증됨" 신호 제공

[중요] 톤/스타일에 따라 제목 형식·도입부 문체·어조를 다르게 작성하세요.`;

// ⚠️ TONE_GUIDE는 문체·제목·도입부 스타일만 정의합니다.
// 콘텐츠 구조(H2 섹션, FAQ, 비교표 등)는 SYSTEM_INSTRUCTION의 E-E-A-T 7단계가 고정합니다.
const TONE_GUIDE: Record<string, string> = {
  '전문적이고 신뢰감 있는': `
[톤 스타일 - 전문적/신뢰] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 수치·통계·"완벽 가이드"·"전문가 분석"·"심층 리뷰" 포함. 예) "[주제] 완벽 분석: 전문가가 알려주는 핵심 전략"
- 도입부: 업계 통계나 전문적 정의로 시작
- 문체: 3인칭·격식체, 능동적 전문 용어 사용, 데이터·근거·출처 중심`,

  '친근하고 대화체의': `
[톤 스타일 - 친근/대화체] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 2인칭 질문형·공감형 표현. 예) "혹시 [주제] 때문에 고민이세요? 이렇게 하면 돼요!"
- 도입부: 독자에게 직접 말 걸기 ("안녕하세요!", "혹시 이런 경험 있으신가요?")
- 문체: 구어체, 이모지 1~2개 허용, 짧은 문장, 부드러운 존댓말. 각 H2 섹션도 대화체로 작성`,

  '설득력 있고 강렬한': `
[톤 스타일 - 설득/강렬] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 긴박감·손실 회피 심리 활용. 예) "지금 [주제]를 바꾸지 않으면 뒤처집니다"
- 도입부: 충격적 사실·위기감으로 시작
- 문체: 짧고 강렬한 문장, 명령형·청유형, 감정 자극 언어. 각 H2 섹션에서도 긴박감 유지`,

  '간결하고 명확한': `
[톤 스타일 - 간결/명확] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 최대한 짧고 직접적. 예) "[주제]: 3단계 핵심 요약"
- 도입부: 1~2문장으로 요점만 전달
- 문체: 불필요한 수식어 제거, 능동태, 짧은 단문. 각 H2 섹션도 핵심만 간결하게`,

  '스토리텔링 중심의': `
[톤 스타일 - 스토리텔링] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 서사적·호기심 유발형. 예) "[주제]를 포기하려던 그날, 모든 것이 바뀌었다"
- 도입부: 구체적인 장면·인물·상황으로 시작 (영화 도입부처럼)
- 문체: 1인칭 또는 3인칭 서술, 감각적 묘사, 감정 이입 유도. 각 H2 섹션을 이야기 흐름으로 연결`,

  '뉴스/저널리즘 스타일의': `
[톤 스타일 - 뉴스/저널리즘] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 육하원칙 압축. 예) "[주제], 전문가들이 주목하는 3가지 이유"
- 도입부: 리드(Lead) 문단 — 핵심 사실을 첫 1~2문장에 압축
- 문체: 3인칭 객관체, 인용구("○○ 전문가는 ~라고 밝혔다") 활용. 각 H2 소제목은 뉴스 헤드라인 스타일`,

  '교육적이고 강의형의': `
[톤 스타일 - 교육적/강의형] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: "~하는 방법", "초보자도 이해하는 ~". 예) "처음 배우는 [주제]: 개념부터 실전까지"
- 도입부: 학습 목표 명시 ("이 글을 읽으면 ~을 할 수 있습니다")
- 문체: 친절한 설명체, 어려운 용어는 반드시 풀어서 설명, 예시·비유 적극 활용`,

  '비교분석 중심의': `
[톤 스타일 - 비교분석형] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: "A vs B", "무엇이 더 나을까?". 예) "[주제] 비교 분석: 장단점 완전 정리"
- 도입부: 비교 대상을 명확히 제시
- 문체: 중립적·객관적, 판단 기준 명시, 결론에서 상황별 추천. 비교표를 적극 활용`,

  '사례연구 중심의': `
[톤 스타일 - 사례연구형] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 실제 성과·수치 포함. 예) "[주제]로 성과 3배 늘린 실제 사례"
- 도입부: 구체적 사례 주인공과 핵심 결과를 먼저 제시
- 문체: 스토리 기반이지만 데이터·수치·Before/After 결과 중심. 각 H2 섹션에 실제 사례 삽입`,

  '감성적이고 공감하는': `
[톤 스타일 - 감성/공감형] ※ E-E-A-T 7단계 구조는 유지하되 아래 스타일로 작성
- 제목: 독자 감정·공감대 자극. 예) "당신이 [주제]에 지쳐있다면 이 글을 읽어보세요"
- 도입부: 독자가 공감할 감정·고민을 먼저 언급
- 문체: 따뜻하고 부드러운 2인칭, 위로·격려의 언어. 각 H2 섹션도 공감 언어로 시작`,
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: '콘텐츠 제목' },
    content: { type: Type.STRING, description: '마크다운 형식의 전체 콘텐츠 (최소 1000자)' },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '관련 해시태그 10개 (#포함)',
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        wordCount: { type: Type.NUMBER, description: '글자 수' },
        estimatedReadTime: { type: Type.STRING, description: '예상 읽기 시간 (예: 약 5분)' },
        seoTips: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'SEO 최적화 팁 3가지',
        },
      },
      required: ['wordCount', 'estimatedReadTime', 'seoTips'],
    },
  },
  required: ['title', 'content', 'hashtags', 'metadata'],
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;

    if (!body.topic?.trim()) {
      return withCors(NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 }));
    }
    if (!body.category) {
      return withCors(NextResponse.json({ error: '콘텐츠 유형을 선택해주세요.' }, { status: 400 }));
    }

    // Gemini 단독 사용 (md 초안 생성). EEAT 7단계 변환은 별도 API(/api/convert-eeat)에서 Claude 단독 호출.
    const claudeKey = getClaudeKey(request);
    const geminiKey = getGeminiKey(request);

    if (!geminiKey) {
      return withCors(NextResponse.json(
        { error: 'Gemini API 키가 필요합니다. /settings 페이지에서 API 키를 등록해주세요.' },
        { status: 401 }
      ));
    }
    void claudeKey; // claudeKey는 이 라우트에서 사용하지 않음 (다른 라우트가 동일 라이브러리 import 시 안전성 유지)

    const categoryLabel = CATEGORY_LABELS[body.category] || body.category;
    const toneDesc = body.tone || '전문적이고 신뢰감 있는';
    const toneGuide = TONE_GUIDE[toneDesc] || '';

    const companyInfo = [
      body.company_name ? `회사명: ${body.company_name}` : '',
      body.representative_name ? `대표자명: ${body.representative_name}` : '',
      body.region ? `지역: ${body.region}` : '',
    ].filter(Boolean).join('\n');

    // 프로젝트 파일 RAG 컨텍스트
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pFiles = (body as any).projectFiles as { file_name: string; content: string }[] | undefined;
    const hasRag = pFiles && pFiles.length > 0;

    // CEP 장면 점유 컨텍스트 블록 (sceneSentence 또는 cepKeyword 있을 때만)
    const cepBlock = (body.sceneSentence || body.cepKeyword) ? `
[🎯 CEP 장면 점유 — 최우선 컨텍스트]
${body.sceneSentence ? `장면 문장: "${body.sceneSentence}"` : ''}
${body.cepTask ? `소비자 과업: ${body.cepTask}` : ''}
${body.cepKeyword ? `대표 CEP 키워드: ${body.cepKeyword}` : ''}
${body.searchPath?.length ? `검색 경로: ${body.searchPath.join(' → ')}` : ''}
${body.cepCluster?.length ? `검색어 클러스터: ${body.cepCluster.join(', ')}` : ''}
${body.lifeLanguages?.length ? `삶의 언어 (카테고리 진입 직전): ${body.lifeLanguages.join(' / ')}` : ''}

⚠️ 위 장면이 제공된 경우, 본문 H1·도입부·결론은 반드시 이 장면을 점유해야 한다.
인구통계 표현(30대, 직장인, 육아맘 등) 사용 금지. 사람이 아닌 순간을 다뤄라.
` : '';

    // 환자/고객 케이스 컨텍스트 블록 (selectedCategory === 'case' 또는 body.caseStudy 있을 때)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caseStudy = (body as any).caseStudy as { profile?: string; symptom?: string; treatment?: string; result?: string } | undefined;
    const caseBlock = (caseStudy && (caseStudy.profile || caseStudy.symptom || caseStudy.treatment || caseStudy.result)) ? `
[💊 케이스 정보 — 본문에 반드시 인용]
- 환자/고객: ${caseStudy.profile || '(미입력)'}
- 증상/문제: ${caseStudy.symptom || '(미입력)'}
- 치료/해결: ${caseStudy.treatment || '(미입력)'}
- 결과: ${caseStudy.result || '(미입력)'}

⚠️ 위 케이스를 본문에 반드시 4단 구조(프로필 → 증상 → 치료 → 결과)로 인용하세요.
원칙 4-3(케이스 인용 우선)에 따라 추상 설명보다 이 구체 사례를 우선합니다.
` : '';

    let userMessage: string;

    if (hasRag) {
      // ── RAG 기반 생성: RAG 지식 → E-E-A-T 구조화 콘텐츠 ──
      const ragContent = pFiles!.map(f => `▶ ${f.file_name}\n${f.content}`).join('\n\n');
      userMessage = `${cepBlock}${caseBlock}[프로젝트 RAG 지식 기반]
아래 문서는 이 프로젝트의 핵심 자료입니다. 이 내용을 1차 지식 기반으로 삼아 E-E-A-T 구조화 콘텐츠를 작성하세요.

${ragContent}

────────────────────────────────────────
${companyInfo ? `🚨🚨🚨 [절대 준수 — 사실 정보 정확 표기 / 임의 생성 절대 금지] 🚨🚨🚨

【업체 정보 — 본문에 정확히 표기】
${companyInfo}

${body.company_name ? `✓ 회사명 "${body.company_name}"는 본문에 정확히 그대로 표기 (오타·축약·변형 금지)` : ''}
${body.representative_name ? `✓ 대표자명/원장명 "${body.representative_name}"는 본문에 정확히 그대로 표기` : ''}
${body.region ? `✓ 주소/지역 "${body.region}"는 본문에 정확히 그대로 표기` : ''}

【⛔ 임의 생성 절대 금지 항목】
다음 정보는 RAG 자료에 명시된 것만 사용. 없으면 콘텐츠에서 아예 언급하지 마세요.
- 회사명, 브랜드명, 대표자명, 원장명, 직원명
- 주소, 지역, 매장 위치
- 대표전화, 휴대폰, 이메일, 홈페이지 URL
- 사업자번호, 자격증 번호, 인증 번호
- 설립연도, 운영 기간

【⛔ 임의 통계·수치 생성 절대 금지】
숫자는 신뢰도의 핵심이므로 다음 원칙을 반드시 지키세요:
1. RAG 자료에 있는 숫자만 그대로 인용 (예: "환자 만족도 92%", "5년간 1,200건 시술")
2. RAG 자료에 없는 숫자는 절대 만들거나 추측하지 마세요
3. 외부에서 적당히 가져온 통계 (Gartner, McKinsey 등)도 RAG에 없으면 사용 금지
4. 일반론적 표현으로 대체: "많은 환자들이", "다수의 사례에서", "최근 트렌드는" 등
5. 제목·본문에서 숫자를 강제로 넣을 필요 없음. RAG 자료의 실제 수치만 활용

❌ 잘못된 예: "95% 만족도 달성", "3배 매출 증가" (RAG에 없는 임의 수치)
✅ 올바른 예 (RAG에 있을 때만): "본 클리닉 자체 조사에 따르면 92% 환자가 재방문", "5년간 1,200건 시술 경험"
✅ RAG에 수치 없을 때: "많은 환자들이 만족", "오랜 임상 경험 보유"

⚠️ 신뢰도 무너지면 콘텐츠 가치 0. 정확하지 않은 숫자는 절대 넣지 마세요.
────────────────────────────────────────
` : ''}
[콘텐츠 생성 조건]
주제: ${body.topic}
콘텐츠 유형: ${categoryLabel}
${body.subKeyword ? `분야/카테고리: ${body.subKeyword}` : ''}
톤/스타일: ${toneDesc}
${body.targetKeyword ? `타겟 키워드: ${body.targetKeyword}` : ''}${toneGuide}
${body.additionalNotes ? `\n추가 요청사항:\n${body.additionalNotes}\n` : ''}
[RAG 기반 E-E-A-T 필수 구조]
1. 도입부 (RAG 자료의 핵심 가치·문제 제기 + 업계 통계, 2~3문단)
2. H2 섹션 5~7개 (RAG 핵심 정보를 구조화, 각 섹션에 불릿 * 3개 이상)
3. 단계별 프로세스 (번호 리스트)
4. RAG 기반 실제 사례·수치 (구체적 성과 포함)
5. FAQ (Q: A: 형식 3개 이상, RAG 내용 기반)
6. 결론 + CTA
7. 비교 표 (장점·단점·고려사항 3열 마크다운 표)

[품질 기준]
- 분량: 최소 2,000자
- 제목: "${toneDesc}" 톤 + 수치 포함 (예: "95% 달성", "3배 향상")
- RAG 자료의 사실·수치·표현을 반드시 본문에 녹여 작성
- ${toneDesc} 톤을 제목부터 마지막까지 일관 유지
${companyInfo ? `- ⚠️ 회사명·대표자명·주소는 RAG 자료에 있는 그대로 정확히 본문에 표기 (변경·축약·임의 생성 절대 금지)` : ''}`;
    } else {
      // ── 일반 생성 (RAG 없음) ──
      userMessage = `${cepBlock}${caseBlock}다음 조건에 맞는 ${categoryLabel} 콘텐츠를 생성해주세요.

주제: ${body.topic}
콘텐츠 유형: ${categoryLabel}
${body.subKeyword ? `분야/카테고리: ${body.subKeyword}` : ''}
톤/스타일: ${toneDesc}
${body.targetKeyword ? `타겟 키워드: ${body.targetKeyword}` : ''}
${companyInfo ? `\n[업체 정보 - 본문에 반드시 포함]\n${companyInfo}\n` : ''}${toneGuide}
${body.additionalNotes ? `\n추가 요청사항:\n${body.additionalNotes}\n` : ''}
[필수 사항]
- 제목은 위의 톤 가이드에 맞게 작성하세요.
- 본문 전체의 문체·구조·어조가 "${toneDesc}" 톤을 일관되게 반영해야 합니다.
- GEO/AIO에 최적화된 고품질 콘텐츠를 작성해주세요.
${companyInfo ? `- 업체 정보(${[body.company_name, body.representative_name, body.region].filter(Boolean).join(', ')})를 본문 내용에 자연스럽게 반드시 포함하세요.` : ''}`;
    }

    // Gemini 단독 호출 (md 초안 생성 전용). 폴백 없음 — timeout 회피.
    let text = '';
    try {
      console.log('[API] Gemini 콘텐츠 생성 (단독)');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 6144,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });
      text = response.text || '';
      console.log('[API] Gemini 응답', text.length, '자');
    } catch (geminiError: unknown) {
      const msg = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.error('[API] Gemini 실패:', msg);
      return withCors(NextResponse.json(
        { error: `Gemini 생성 실패: ${msg}` },
        { status: 500 }
      ));
    }

    // JSON 추출 — 코드블록 / 앞뒤 텍스트 / 순수 JSON 모두 처리
    let parsed: unknown;
    try {
      // 1순위: 코드블록 안 JSON
      const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (blockMatch) {
        parsed = JSON.parse(blockMatch[1].trim());
      } else {
        // 2순위: 첫 { 부터 마지막 } 까지 추출
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          parsed = JSON.parse(text.slice(start, end + 1));
        } else {
          parsed = JSON.parse(text.trim());
        }
      }
    } catch {
      // 3순위: Claude가 JSON을 못 만든 경우 — 텍스트를 그대로 content로 감싸서 반환
      const wordCount = text.length;
      parsed = {
        title: '생성된 콘텐츠',
        content: text,
        hashtags: [],
        metadata: {
          wordCount,
          estimatedReadTime: `약 ${Math.ceil(wordCount / 500)}분`,
          seoTips: ['콘텐츠를 검토하고 필요 시 수정하세요.'],
        },
      };
    }
    // 후처리: 마지막 해시태그 직전에 프로젝트 홈페이지·블로그 링크 자동 삽입
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkInfo = body as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = parsed as any;
    if (p?.content && (linkInfo?.homepage_url || linkInfo?.blog_url)) {
      p.content = injectProjectLinks(p.content, {
        homepage_url: linkInfo.homepage_url,
        blog_url: linkInfo.blog_url,
        company_name: body.company_name,
      });
    }
    // CEP 장면 점유 추적 메타 보존 (sceneSentence가 있을 때)
    if (body.sceneSentence && p) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!p.metadata) p.metadata = {} as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.metadata as any).cep = {
        sceneSentence: body.sceneSentence,
        cepKeyword: body.cepKeyword,
        searchPath: body.searchPath,
        cepTask: body.cepTask,
      };
    }
    return withCors(NextResponse.json(parsed));

  } catch (error: unknown) {
    console.error('Content generation error:', error);
    const msg = error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.';

    // 더 정확한 오류 분류
    if (msg.includes('Gemini') && (msg.includes('401') || msg.includes('authentication'))) {
      return withCors(NextResponse.json({ error: 'Gemini API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('Claude') && (msg.includes('401') || msg.includes('authentication'))) {
      return withCors(NextResponse.json({ error: 'Claude API 키가 유효하지 않습니다.' }, { status: 401 }));
    }
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return withCors(NextResponse.json({ error: 'API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 }));
    }
    if (msg.includes('model') && msg.includes('not found')) {
      return withCors(NextResponse.json({ error: 'API 모델이 더 이상 사용 가능하지 않습니다. 관리자에게 문의해주세요.' }, { status: 400 }));
    }
    return withCors(NextResponse.json({ error: msg || '콘텐츠 생성 중 오류가 발생했습니다.' }, { status: 500 }));
  }
}

// v1777031107 - Cache bust
