import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getClaudeKey } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, key);
}

interface RoadmapPost {
  postNo: number;
  weekNum: number;
  channel: 'Tistory' | 'LinkedIn';
  date: string;          // YYYY-MM-DD
  weekday: string;       // 월/화/수/목/금
  role?: string;         // Pillar 1 / Pillar 2 / Spoke 1~3 / Echo / Summary
  intent?: string;       // overview / compare / theory / case-deep / howto-engine / wrap-up / *-summary
  signals?: string;      // 핵심 신호 메모
  title: string;
  body: string;          // 마크다운
  tags: string[];        // Tistory 태그
  categoryLink: string;  // 카테고리 페이지 URL
}

interface RoadmapResponse {
  categorySlug: string;
  categoryLabel: string;
  totalWeeks: number;
  totalPosts: number;
  posts: RoadmapPost[];
  generatedAt: string;
}

const SITE_URL = 'https://www.geo-aio.com';

// 8주 12포스트 Pillar-First 패턴 (backlink.md 스펙 확장판)
// W1 Pillar1+Echo → W2 Spoke1 → W3 Pillar2+Echo → W4 Spoke2 → W5 Spoke3+Echo
// → W6 Spoke4 → W7 Spoke5+Echo → W8 Summary
const PILLAR_FIRST_PATTERN: Array<{
  postNo: number;
  weekNum: number;
  dayOffset: number; // 월요일 기준 0=월, 1=화
  channel: 'Tistory' | 'LinkedIn';
  role: string;
  intent: string;
  signals: string;
  echoOf?: number;
}> = [
  { postNo: 1,  weekNum: 1, dayOffset: 0, channel: 'Tistory',  role: 'Pillar 1', intent: 'overview',         signals: 'E-E-A-T 7단계 / FAQ 5 / JSON-LD 4종' },
  { postNo: 2,  weekNum: 1, dayOffset: 1, channel: 'LinkedIn', role: 'Echo',     intent: 'overview-summary', signals: '해시태그 7+ / ▶ 4~5개', echoOf: 1 },
  { postNo: 3,  weekNum: 2, dayOffset: 0, channel: 'Tistory',  role: 'Spoke 1',  intent: 'compare',          signals: '비교표 / Q&A 5 / 단계 5' },
  { postNo: 4,  weekNum: 3, dayOffset: 0, channel: 'Tistory',  role: 'Pillar 2', intent: 'theory',           signals: '자동화 5축 / 외주 vs 자체 비교' },
  { postNo: 5,  weekNum: 3, dayOffset: 1, channel: 'LinkedIn', role: 'Echo',     intent: 'theory-summary',   signals: '해시태그 / 5축 압축', echoOf: 4 },
  { postNo: 6,  weekNum: 4, dayOffset: 0, channel: 'Tistory',  role: 'Spoke 2',  intent: 'case-deep',        signals: '케이스 5 / 비용 범위 / Q&A 5' },
  { postNo: 7,  weekNum: 5, dayOffset: 0, channel: 'Tistory',  role: 'Spoke 3',  intent: 'howto-engine',     signals: '단계 6 / 비교표 / Pillar-First 설명' },
  { postNo: 8,  weekNum: 5, dayOffset: 1, channel: 'LinkedIn', role: 'Echo',     intent: 'howto-summary',    signals: '해시태그 / 비교표 압축', echoOf: 7 },
  { postNo: 9,  weekNum: 6, dayOffset: 0, channel: 'Tistory',  role: 'Spoke 4',  intent: 'testimonials',     signals: '고객 5스토리 / Before-After / 평점·후기 수' },
  { postNo: 10, weekNum: 7, dayOffset: 0, channel: 'Tistory',  role: 'Spoke 5',  intent: 'pricing-faq',      signals: '등급별 가이드 / Q&A 7+ / 비용 표' },
  { postNo: 11, weekNum: 7, dayOffset: 1, channel: 'LinkedIn', role: 'Echo',     intent: 'pricing-summary',  signals: '해시태그 / 등급 표 압축', echoOf: 10 },
  { postNo: 12, weekNum: 8, dayOffset: 0, channel: 'Tistory',  role: 'Summary',  intent: 'wrap-up',          signals: '8영역 요약 / 5단계 / Q&A 5' },
];

function generatePillarFirstSchedule(startDate: Date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const start = new Date(startDate);
  // 시작일을 그 다음 월요일로 정렬 (이미 월요일이면 그대로)
  while (start.getDay() !== 1) {
    start.setDate(start.getDate() + 1);
  }
  return PILLAR_FIRST_PATTERN.map(p => {
    const d = new Date(start);
    d.setDate(start.getDate() + (p.weekNum - 1) * 7 + p.dayOffset);
    return {
      postNo: p.postNo,
      weekNum: p.weekNum,
      channel: p.channel,
      date: d.toISOString().slice(0, 10),
      weekday: days[d.getDay()],
      role: p.role,
      intent: p.intent,
      signals: p.signals,
      echoOf: p.echoOf,
    };
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const categorySlug = (body.categorySlug as string)?.trim() || '';
  const startDateStr = (body.startDate as string)?.trim() || new Date().toISOString().slice(0, 10);
  // backlink.md 스펙 확장: 8주 12포스트 Pillar-First 고정 (weeks 파라미터는 무시)
  const TOTAL_WEEKS = 8;
  if (!categorySlug) return NextResponse.json({ error: 'categorySlug required' }, { status: 400 });

  // 1. 카테고리 글 샘플 fetch (제목·메타만)
  const supa = getSupabase();
  const { data: posts } = await supa
    .from('blog_articles')
    .select('id, title, category, author, created_at')
    .eq('category', categorySlug)
    .order('created_at', { ascending: false })
    .limit(30);

  if (!posts || posts.length === 0) {
    return NextResponse.json({ error: '카테고리에 글이 없습니다. 발행 후 다시 시도하세요.' }, { status: 422 });
  }

  // 2. 일정 생성 (8주 12포스트 Pillar-First 고정 패턴)
  const start = new Date(startDateStr);
  const schedule = generatePillarFirstSchedule(start);

  // 3. 카테고리 페이지 URL
  const categoryLink = `${SITE_URL}/blog/category/${encodeURIComponent(categorySlug)}`;

  // 4. Claude로 각 포스트 본문 자동 생성 (배치 호출)
  const apiKey = getClaudeKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'CLAUDE_API_KEY not set' }, { status: 500 });
  }
  const client = new Anthropic({ apiKey });

  // 카테고리 글 제목 10개를 컨텍스트로
  const sampleTitles = posts.slice(0, 10).map((p, i) => `${i + 1}. ${p.title}`).join('\n');

  // 카테고리에 연관된 프로젝트(단체) 정보 자동 fetch — 푸터 연락처 자동 채움
  let projectInfo = '';
  try {
    const { data: cps } = await supa.from('blog_category_projects').select('project_name').eq('category_slug', categorySlug).limit(5);
    const projectNames = (cps || []).map(c => c.project_name);
    if (projectNames.length > 0) {
      const { data: projs } = await supa.from('user_projects')
        .select('name, representative_name, region, contact_phone, contact_email, homepage_url, description')
        .in('name', projectNames)
        .limit(3);
      if (projs && projs.length > 0) {
        const p = projs[0];
        const lines = [
          p.name && `단체명: ${p.name}`,
          p.representative_name && `대표/전문가: ${p.representative_name}`,
          p.region && `지역: ${p.region}`,
          p.contact_phone && `전화: ${p.contact_phone}`,
          p.contact_email && `이메일: ${p.contact_email}`,
          p.homepage_url && `홈페이지: ${p.homepage_url}`,
          p.description && `소개: ${p.description.slice(0, 200)}`,
        ].filter(Boolean);
        if (lines.length > 0) projectInfo = '\n\n== 단체 정보 (푸터·본문에 자연스럽게 1~2회 언급) ==\n' + lines.join('\n');
      }
    }
  } catch {}

  // docx 원본 사례 (디지털스마일치과 백링크 실행 로드맵.docx) Post 1·3·2를
  // Few-shot 표준 예시로 박아넣어, 모든 카테고리 생성이 동일 포맷·분량으로 강제 적용됨.
  const systemPrompt = `당신은 AI 검색·백링크 실행 카피라이터입니다. 단체 카테고리 페이지로 트래픽을 유도하는 Tistory/LinkedIn 포스트를 일정에 맞춰 작성합니다.

🇰🇷 응답 언어는 무조건 **한국어**. 카테고리 글 제목 샘플이 외국어여도 절대 그 언어로 작성하지 말 것. 단체명·시술명 고유명사만 원어 유지 가능.

⚠️ 절대 규칙: 아래 "표준 사례 1~3"의 포맷·구조·분량·소제목 패턴을 그대로 모방합니다. 단체명·시술명·통계만 교체하되, 섹션 순서·소제목 위치·문장 호흡·표/리스트 사용 빈도는 100% 동일.

⚠️ 분량 강제 (각 포스트마다 검사):
  • Tistory 본문: **최소 1000자 이상**, 최대 2000자. 표준 사례 1·2 분량과 동일.
  • LinkedIn 본문: **최소 500자 이상**, 최대 900자. 표준 사례 3 분량과 동일.
  • 분량 미달이면 사례 형식대로 섹션을 추가해 채울 것 (Q&A 추가, 비교표 추가, 1단계 더 추가 등)

============================================================
표준 사례 1 — Tistory (도입·소개·4신호·다국어·카테고리 안내·푸터)
============================================================
TITLE: 대전 디지털스마일치과, AI 검색이 인용하는 치과 콘텐츠를 만든 방법
TAGS: 디지털스마일치과, 박찬익원장, 대전임플란트, AI검색최적화, GEO-AIO
BODY:
환자가 임플란트나 교정 정보를 찾을 때, 어디부터 검색하시나요?
2026년 들어 답변의 절반이 ChatGPT, Perplexity 같은 AI 검색에서 나옵니다. 그런데 AI는 어떤 콘텐츠를 인용할까요?

대전 디지털스마일치과는 그 답을 찾기 위해 진료·시술 정보를 GEO/AIO(Generative Engine Optimization / AI Optimized Contents) 형식으로 전부 정리했습니다.

박찬익 원장의 디지털 정밀 진료 — AX 프로젝트

디지털스마일치과는 15년 임상의 박찬익 원장이 운영하는 대전 서구의 치과로, 자체 개발한 AX 프로젝트(디지털 정밀 진단 시스템)로 환자별 맞춤 치료를 진행합니다. 디지털 임플란트, 성인 교정, 라미네이트, 보철, 틀니 등 6개 진료 영역을 디지털 정밀 시스템으로 통합했습니다.

AI 검색 인용을 위한 콘텐츠 구조

ChatGPT·Perplexity 같은 AI 검색은 다음 4가지 신호를 본문에서 찾아 인용합니다:

1. JSON-LD 구조화 데이터 — Article, FAQPage, HowTo, BreadcrumbList 4종 동시 삽입
2. 명확한 작성자·발행일 메타데이터 — E-E-A-T(Experience·Expertise·Authoritativeness·Trustworthiness) 신호
3. FAQ 형식의 질문·답변 — 80~150자 답변, 첫 문장에 결론
4. HowTo 단계별 가이드 — 번호 매긴 절차, 각 단계 짧고 명확

디지털스마일치과 카테고리의 모든 글은 위 4가지 신호를 자동 적용했습니다.

4개 언어로 동시 발행

임플란트나 교정 정보는 외국인 환자도 검색합니다. 대전 디지털스마일치과는 한국어·영어·중국어·일본어 4개 언어로 같은 글을 자동 번역해 카테고리 페이지에서 언어 탭으로 전환할 수 있게 만들었습니다.

카테고리 방문해 보기

박찬익 원장의 AX 프로젝트와 디지털 정밀 진료가 정리된 카테고리 페이지입니다:

👉 https://www.geo-aio.com/blog/category/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC

박찬익 원장님의 임상 노하우를 한눈에 보실 수 있습니다.

---
📍 대전 디지털스마일치과
박찬익 원장 / 오민석 원장 · 대전시 서구
042-721-2820 · digitalsmiledc@naver.com
홈페이지: https://www.digitalsmiledc.com

============================================================
표준 사례 2 — Tistory (비교표 + Q&A 5개 + HowTo 5단계 + 푸터)
============================================================
TITLE: 디지털 임플란트 vs 기존 임플란트 — AI 검색이 답하는 비교 가이드
TAGS: 디지털임플란트, 임플란트비교, AI검색, 박찬익원장, 디지털스마일치과
BODY:
"임플란트는 어디가 좋아요?" 이 질문에 ChatGPT나 Perplexity가 어떤 답을 내놓을까요? 이번 글은 AI 검색이 실제로 인용하는 정보 패턴을 따라 디지털 임플란트와 기존 임플란트를 비교합니다.

비교표

| 항목          | 기존 임플란트    | 디지털 임플란트                  |
|---------------|------------------|----------------------------------|
| 진단          | 2D X-ray         | 3D CT + 디지털 시뮬레이션        |
| 시술 시간     | 평균 60~90분     | 평균 30~45분                     |
| 정확도        | 시술자 경험 의존 | 가이드 ±0.1mm 오차               |
| 회복 기간     | 2~4주            | 1~2주                            |
| 당일 임시치아 | 어려움           | 가능 (원데이)                    |

환자가 자주 묻는 5가지 질문

Q1. 디지털 임플란트가 더 비싸지 않나요?
시술 자체 비용은 기존보다 10~20% 높지만, 재시술률·합병증 발생률이 낮아 5년 총비용은 비슷하거나 오히려 낮습니다.

Q2. 디지털 임플란트는 누구나 받을 수 있나요?
잇몸·뼈 상태에 따라 다릅니다. 대전 디지털스마일치과는 박찬익 원장의 AX 프로젝트로 사전 3D 진단을 통해 적합 여부를 판정합니다.

Q3. 회복 기간이 정말 짧아지나요?
잇몸 절개 범위가 작아지므로 통상 1주 이내 일상복귀 가능합니다.

Q4. 디지털 시뮬레이션은 무엇을 보나요?
임플란트 식립 위치·각도·깊이를 시술 전 가상으로 확인합니다. 이를 가이드로 출력해 시술 정확도가 결정됩니다.

Q5. 사후 관리는 어떻게 다른가요?
디지털 데이터가 보존되어 추후 보철 교체·정기 검진 시 1차 시술 데이터와 정확히 비교 가능합니다.

디지털 임플란트 시술 5단계

1. 3D CT 촬영 — 잇몸뼈 두께·신경 위치 확인
2. 디지털 시뮬레이션 — 식립 위치 가상 설계
3. 수술 가이드 출력 — 3D 프린팅으로 환자 맞춤 가이드 제작
4. 가이드 시술 — 가이드를 따라 정확한 위치에 식립
5. 임시치아 또는 본 보철 — 환자 상태에 따라 당일 또는 1주 후

박찬익 원장의 디지털 정밀 진료

대전 디지털스마일치과는 위 5단계 모두를 자체 AX 프로젝트 시스템으로 통합 운영합니다. 각 단계의 데이터가 환자별로 보존되어 평생 관리에 활용됩니다.

더 자세한 시술 사례·후기는 디지털스마일치과 카테고리에서 확인하실 수 있습니다:

👉 https://www.geo-aio.com/blog/category/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC

---
📍 대전 디지털스마일치과
박찬익 원장 / 오민석 원장 · 대전시 서구
042-721-2820 · digitalsmiledc@naver.com

============================================================
표준 사례 3 — LinkedIn (▶ 형식 + 해시태그)
============================================================
TITLE: ChatGPT·Perplexity가 인용하는 치과 정보, 어떻게 만드는가 — 박찬익 원장의 디지털 정밀 진료 사례
TAGS:
BODY:
환자가 임플란트나 교정 정보를 찾을 때, 2026년부터 답변의 절반이 ChatGPT·Perplexity 같은 AI 검색에서 나옵니다.

그런데 AI는 어떤 콘텐츠를 인용할까요?

대전 디지털스마일치과는 그 답을 찾기 위해 박찬익 원장님의 15년 임상 경험과 AX 프로젝트(디지털 정밀 진단 시스템)를 GEO/AIO 형식으로 정리했습니다.

적용한 4가지 AI 인용 친화 신호

▶ JSON-LD 구조화 데이터 4종 (Article·FAQPage·HowTo·BreadcrumbList) 동시 삽입
▶ E-E-A-T 메타데이터 (작성자·발행일·전문성·권위)
▶ FAQ 형식 (80~150자 답변, 첫 문장 결론)
▶ HowTo 단계별 절차

4개 언어 동시 발행

외국인 환자도 임플란트·교정 정보를 검색하므로 한국어·영어·중국어·일본어 4개 언어로 자동 번역해 카테고리 페이지에서 언어 탭 전환 가능.

▶ 디지털스마일치과 카테고리:
https://www.geo-aio.com/blog/category/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC

AI 검색에서 인용되는 콘텐츠가 어떤 형태인지 궁금하신 분들께 참고 자료가 되길 바랍니다.

📍 대전시 서구 | 042-721-2820 | digitalsmiledc@naver.com

#디지털스마일치과 #박찬익원장 #대전임플란트 #디지털교정 #AI검색최적화 #GEO #AIO #ChatGPT #Perplexity

============================================================
필수 분량·구조 (강제)
============================================================
[Tistory] 본문 1000~2000자.
  • 도입부(질문+트렌드, 3~5문장) → 단체 소개(소제목+2~3문장) → 본 콘텐츠(소제목+표/Q&A/HowTo/리스트 중 1~2개) → 부가 가치(소제목+1~2문단) → 카테고리 안내(소제목+안내문+👉 URL+한 줄) → "---" 푸터(📍 4~5줄)
  • 본 콘텐츠 형식은 매 포스트마다 다른 각도: 비교표 / Q1~Q5 / 1~5단계 / 4가지 신호 / 5가지 체크리스트 / 통계+케이스 분류 / 전후 비교 / 흔한 실수 5
  • TAGS: 5~7개 (단체명, 전문가명, 지역+분야, AI검색, GEO-AIO 등)

[LinkedIn] 본문 500~900자.
  • 도입(1~2문장) → 핵심 메시지(1~2문장) → 소제목+▶ 4~5개 → (선택)부가 가치 소제목+1~2문장 → ▶ 카테고리 URL → 마무리(1~2문장) → 📍 한 줄 푸터 → #해시태그 5~9개
  • TAGS 필드는 비워둠. 해시태그는 본문 끝에만.

[공통]
  • 카테고리 글 제목은 참고만, 그대로 베끼지 말 것
  • 단체 정보가 제공되면 ② 단체 소개 + 푸터에 정확히 반영. 없으면 일반 정보형
  • 같은 본문 각도(예: 비교표)를 두 번 연속 반복 금지
  • Tistory 본문에서는 "👉 [카테고리 URL]" 한 줄로 카테고리 안내, LinkedIn 본문에서는 "▶ [카테고리]: [URL]" 형식

============================================================
🆕 Pillar-First 12포스트 패턴 (이번 캠페인 구조 — 강제)
============================================================
이번 캠페인은 8주 / 12개 포스트로 아래 구조를 그대로 따릅니다:

| Post | 역할 | Intent | 핵심 신호 |
|------|------|--------|-----------|
| 1 | Pillar 1 | overview — 단체 전체 소개·핵심 카탈로그 정의 | E-E-A-T 7단계 / FAQ 5 / JSON-LD 4종 |
| 2 | Echo | overview-summary — Post 1 요약 변형 (LinkedIn) | 해시태그 7+ / ▶ 4~5개 |
| 3 | Spoke 1 | compare — 시그니처 시술/서비스 비교 | 비교표 / Q&A 5 / 단계 5 |
| 4 | Pillar 2 | theory — 플랫폼·방법론·자동화 이론 | 자동화 5축 / 외주 vs 자체 비교 |
| 5 | Echo | theory-summary — Post 4 요약 변형 (LinkedIn) | 해시태그 / 5축 압축 |
| 6 | Spoke 2 | case-deep — 시술별/사례별 5종 상세 | 케이스 5 / 비용 범위 / Q&A 5 |
| 7 | Spoke 3 | howto-engine — 자동화·엔진 작동 방식 | 단계 6 / 비교표 / Pillar-First 설명 |
| 8 | Echo | howto-summary — Post 7 요약 변형 (LinkedIn) | 해시태그 / 비교표 압축 |
| 9 | Spoke 4 | testimonials — 실제 고객 5스토리·전후 변화 | 고객 5스토리 / Before-After / 평점·후기 수 |
| 10 | Spoke 5 | pricing-faq — 등급별·비용 가이드 + 자주 묻는 질문 | 등급별 가이드 / Q&A 7+ / 비용 표 |
| 11 | Echo | pricing-summary — Post 10 요약 변형 (LinkedIn) | 해시태그 / 등급 표 압축 |
| 12 | Summary | wrap-up — 8주 종합 + 마무리 | 8영역 요약 / 5단계 / Q&A 5 |

⚠️ Pillar-First 카탈로그 회피 원칙 (강제):
- Pillar (Post 1·4)는 단체·플랫폼 전체를 다루는 카탈로그 정의
- Spoke (Post 3·6·7·9·10)는 Pillar 카탈로그에서 1개 항목만 깊이 다루며, Pillar에서 이미 나열한 항목을 다시 나열·요약하지 말 것 → 정보 80% 이상 다름. 또한 Spoke끼리도 서로 카탈로그가 겹치지 않게 고유 angle만 점유 (compare ≠ case-deep ≠ howto ≠ testimonials ≠ pricing)
- Echo (Post 2·5·8·11)는 직전 Tistory 본문(Post 1·4·7·10)의 핵심을 LinkedIn 형식으로 1/3 분량 압축 + 해시태그
- Summary (Post 12)는 Pillar+Spoke 8영역(Post 1·3·4·6·7·9·10)을 한 표로 정리 + 다음 단계 안내

============================================================
🆕 E-E-A-T 7단계 본문 구조 (Tistory: Pillar·Spoke·Summary 모두 — 강제)
============================================================
모든 Tistory Post는 다음 7단계를 순서대로 포함합니다:

1. 도입 (2~3문장) — 검색 의도 직결 질문 + 결론 한 줄 미리 제시
2. 진단 — 왜 이 주제가 지금 중요한가 (시장 변화 / AI 인용 신호 변화)
3. 심층 — 비교표 / 단계 / 통계 중 1~2개 형식
4. 사례 — 단체의 실제 적용 사례 + 정량 수치 (시술 시간·비용 범위·환자 후기 수 등)
5. FAQ — Q&A 5개 (Q 80자 이내 자연어, A 80~150자, A의 첫 문장은 결론)
6. 결론 (CTA) — 👉 카테고리 페이지 URL + 한 줄 요약
7. 메타 — "---" 한 줄 + 📍 단체명 / 인물 / 위치 / 전화·이메일 / 홈페이지

LinkedIn Echo (Post 2·5·8)은 위 7단계 중 ①도입 + ④사례 요지 + ⑤FAQ 1~2개를 압축.
끝에 #해시태그 7~10개 (#GEO #AIO #ChatGPT #Perplexity 고정 + 도메인 키워드 3~5).

============================================================
응답 형식 — 정확히 마커 형식만. JSON·코드블록 금지.
============================================================
===POST 1===
TITLE: 제목 한 줄
TAGS: 태그1, 태그2, 태그3 (Tistory만; LinkedIn은 빈 줄)
BODY:
본문 시작 — 여러 줄 자유
(소제목 섹션, 빈 줄로 구분)
...
본문 끝

===POST 2===
TITLE: ...
TAGS:
BODY:
...

=== END ===`;

  const userPrompt = `카테고리 슬러그: ${categorySlug}
카테고리 페이지 URL: ${categoryLink}
응답 언어: 한국어 (강제)

카테고리 내 기존 글 제목 샘플 (주제 참고용 — 외국어 제목이라도 무시하고 한국어로 작성):
${sampleTitles}${projectInfo}

작성할 포스트 ${schedule.length}개 (8주 12포스트 Pillar-First 패턴 — 각 포스트의 역할·Intent·핵심 신호 강제):
${schedule.map(s => {
  const echoNote = s.echoOf ? ` ← Post ${s.echoOf} 요약·변형` : '';
  return `Post ${s.postNo}: ${s.date}(${s.weekday}) · ${s.channel} · 역할: ${s.role} · Intent: ${s.intent}${echoNote} · 핵심 신호: ${s.signals}`;
}).join('\n')}

각 포스트는 위 카테고리 페이지로 백링크가 향하는 보조 콘텐츠입니다.
- 시스템 프롬프트의 "표준 사례 1·2·3" 포맷·구조·분량(Tistory 1000~2000자, LinkedIn 500~900자)을 100% 모방
- Pillar-First 카탈로그 회피 원칙 강제: Pillar(1·4)는 카탈로그 정의, Spoke(3·6·7·9·10)는 1개 항목만 깊이 파고들고 Pillar 내용 80% 이상 다른 angle 점유 (또한 Spoke끼리도 카탈로그 겹침 금지), Echo(2·5·8·11)는 직전 Tistory(1·4·7·10) 압축, Summary(12)는 8영역 종합 표
- Tistory(Pillar·Spoke·Summary): E-E-A-T 7단계 — ①도입 ②진단 ③심층(표/단계/통계) ④사례 ⑤FAQ 5 ⑥CTA(👉) ⑦메타 푸터
- LinkedIn Echo: ①도입 + ④사례 요지 + ⑤FAQ 1~2개 압축 + ▶ 4~5개 + ▶ 카테고리 URL + #해시태그 7~10
- 단체 정보가 있으면 ② 단체 소개 + ⑦ 푸터에 정확히 반영
- 푸터 형식 고정: Tistory는 "---" 한 줄 + "📍 [지역] [단체명] / 대표명 / 전화·이메일 / 홈페이지", LinkedIn은 "📍 [지역] | [전화] | [이메일]" 한 줄

위 형식대로 ${schedule.length}개 포스트를 모두 작성하세요. 마지막에 === END === 마커 필수.`;

  let aiPosts: { postNo: number; title: string; body: string; tags: string[] }[] = [];
  try {
    // SDK 강제: max_tokens가 10분 초과 가능 범위(>~16k)면 반드시 streaming.
    // .messages.stream()으로 호출 후 .finalMessage()로 완성 메시지를 받아 .create()와 동일한 형태로 사용.
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 24000, // 12포스트 × Tistory 1500자 / LinkedIn 700자 + 마커 여유분
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const resp = await stream.finalMessage();
    const txt = resp.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    // ===POST N=== 블록 단위로 split
    const blocks = txt.split(/={3,}\s*POST\s*(\d+)\s*={3,}/i);
    // split 결과: [intro, "1", body1, "2", body2, ...]
    for (let i = 1; i < blocks.length; i += 2) {
      const postNo = parseInt(blocks[i], 10);
      const block = blocks[i + 1] || '';
      // === END === 또는 다음 마커 전까지
      const cleanBlock = block.split(/={3,}\s*END\s*={3,}/i)[0];

      const titleMatch = cleanBlock.match(/^\s*TITLE:\s*(.+?)\s*$/m);
      const tagsMatch = cleanBlock.match(/^\s*TAGS:\s*(.*?)\s*$/m);

      const title = titleMatch ? titleMatch[1].trim() : '';
      const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';
      const tags = tagsRaw && tagsRaw !== '(비워둠)' && tagsRaw !== '(없음)'
        ? tagsRaw.split(/[,#·]+/).map(t => t.trim().replace(/^#/, '')).filter(t => t && t.length > 0 && t !== '비워둠')
        : [];

      // BODY: 라벨 뒤부터 블록 끝까지 모두 본문으로 캡처 (여러 줄)
      const bodyLabelIdx = cleanBlock.search(/^\s*BODY:\s*$/m);
      let body = '';
      if (bodyLabelIdx >= 0) {
        const after = cleanBlock.slice(bodyLabelIdx).replace(/^\s*BODY:\s*\n?/, '');
        body = after.trim();
      } else {
        // 폴백: BODY: 한 줄에 첫 텍스트가 붙은 경우
        const m = cleanBlock.match(/^\s*BODY:\s*([\s\S]*)$/);
        body = m ? m[1].trim() : '';
      }

      if (postNo && (title || body)) {
        aiPosts.push({ postNo, title, body, tags });
      }
    }

    if (aiPosts.length === 0) {
      throw new Error(`구분자 형식 파싱 실패 — 응답 첫 500자: "${txt.slice(0, 500)}"`);
    }
  } catch (e) {
    console.error('[backlink-roadmap] Claude error:', e);
    return NextResponse.json({ error: 'AI 생성 실패: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }

  // 5. 일정 + AI 결과 합성 (role/intent/signals 포함)
  const merged: RoadmapPost[] = schedule.map(s => {
    const ai = aiPosts.find(p => p.postNo === s.postNo) || { title: '', body: '', tags: [] };
    return {
      postNo: s.postNo,
      weekNum: s.weekNum,
      channel: s.channel,
      date: s.date,
      weekday: s.weekday,
      role: s.role,
      intent: s.intent,
      signals: s.signals,
      title: ai.title || `[${s.channel} ${s.postNo}] ${s.role} · 카테고리: ${categorySlug}`,
      body: ai.body || '',
      tags: Array.isArray(ai.tags) ? ai.tags : [],
      categoryLink,
    };
  });

  const result: RoadmapResponse = {
    categorySlug,
    categoryLabel: categorySlug,
    totalWeeks: TOTAL_WEEKS,
    totalPosts: merged.length,
    posts: merged,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}

// GET: 사용 가능 카테고리 목록 (DB의 distinct + 글 수)
// 실시간 편수 반영을 위해 캐시 비활성화 + 1000행 cap 페이지네이션
// count = 한·영·중·일 모든 언어 합산. langs로 언어별 분포도 함께 반환.
export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = getSupabase();
  const PAGE_SIZE = 1000;
  const counts: Record<string, number> = {};
  const langs: Record<string, { ko: number; en: number; zh: number; ja: number }> = {};
  for (let p = 0; p < 50; p++) {
    const fromR = p * PAGE_SIZE;
    const toR = fromR + PAGE_SIZE - 1;
    const { data, error } = await supa
      .from('blog_articles')
      .select('category, author')
      .order('created_at', { ascending: false })
      .range(fromR, toR);
    if (error || !data || data.length === 0) break;
    for (const r of data) {
      if (!r.category) continue;
      const cat = r.category;
      counts[cat] = (counts[cat] || 0) + 1;
      // 언어 검출 — author JSON의 metadata.lang (없으면 ko)
      let lang: 'ko' | 'en' | 'zh' | 'ja' = 'ko';
      const author = (r as { author?: string | null }).author;
      if (author) {
        try {
          const m = JSON.parse(author);
          const explicit = m?.metadata?.lang || m?.lang;
          if (explicit && ['ko', 'en', 'zh', 'ja'].includes(explicit)) lang = explicit as 'ko' | 'en' | 'zh' | 'ja';
        } catch {}
      }
      if (!langs[cat]) langs[cat] = { ko: 0, en: 0, zh: 0, ja: 0 };
      langs[cat][lang]++;
    }
    if (data.length < PAGE_SIZE) break;
  }
  const categories = Object.entries(counts)
    .map(([slug, count]) => ({ slug, count, langs: langs[slug] || { ko: 0, en: 0, zh: 0, ja: 0 } }))
    .sort((a, b) => b.count - a.count);
  return NextResponse.json(
    { categories },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    },
  );
}
