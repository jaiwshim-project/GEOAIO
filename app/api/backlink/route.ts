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

// 10주 일정 — 매주 화요일 LinkedIn + 목요일 Tistory (대안: 월·금)
function generateSchedule(startDate: Date, weeks: number): { weekNum: number; channel: 'Tistory' | 'LinkedIn'; date: string; weekday: string; postNo: number }[] {
  const schedule: { weekNum: number; channel: 'Tistory' | 'LinkedIn'; date: string; weekday: string; postNo: number }[] = [];
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  let postNo = 1;
  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + w * 7);
    // 그 주의 월요일 찾기
    const monday = new Date(weekStart);
    monday.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    // 화요일 LinkedIn
    const tue = new Date(monday); tue.setDate(monday.getDate() + 1);
    schedule.push({ weekNum: w + 1, channel: 'LinkedIn', date: tue.toISOString().slice(0, 10), weekday: days[tue.getDay()], postNo: postNo++ });
    // 목요일 Tistory
    const thu = new Date(monday); thu.setDate(monday.getDate() + 3);
    schedule.push({ weekNum: w + 1, channel: 'Tistory', date: thu.toISOString().slice(0, 10), weekday: days[thu.getDay()], postNo: postNo++ });
  }
  return schedule;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const categorySlug = (body.categorySlug as string)?.trim() || '';
  const startDateStr = (body.startDate as string)?.trim() || new Date().toISOString().slice(0, 10);
  const weeks = Math.max(1, Math.min(20, (body.weeks as number) || 10));
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

  // 2. 일정 생성
  const start = new Date(startDateStr);
  const schedule = generateSchedule(start, weeks);

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

  // docx 사례 (Post 1 Tistory + Post 2 LinkedIn) 형식을 정확히 복제하는 프롬프트.
  // narrative + 소제목 섹션 + 단체 소개 + AI 인용 신호 + 다국어 + 카테고리 안내 + 푸터.
  const systemPrompt = `당신은 AI 검색·백링크 실행 카피라이터입니다. 단체 카테고리 페이지로 트래픽을 유도하는 Tistory/LinkedIn 포스트를 일정에 맞춰 작성합니다.

============== Tistory 포스트 형식 (Post 1 표준 사례) ==============

[제목] 30~45자, narrative형 ("X단체, AI 검색이 인용하는 Y을 만든 방법" 같은 형태)

[본문 구조] 반드시 다음 5~7개 섹션을 차례대로 포함, 섹션마다 빈 줄로 구분:

① 도입부 (질문 + 트렌드)
   예) "환자가 임플란트나 교정 정보를 찾을 때, 어디부터 검색하시나요?
        2026년 들어 답변의 절반이 ChatGPT, Perplexity 같은 AI 검색에서 나옵니다.
        그런데 AI는 어떤 콘텐츠를 인용할까요?
        대전 디지털스마일치과는 그 답을 찾기 위해 진료·시술 정보를
        GEO/AIO 형식으로 정리했습니다."

② 단체 소개 — 소제목 1개 ("[전문가명]의 [전문분야] — [시스템·프로젝트명]")
   2~3문장으로 단체의 운영자, 지역, 전문 분야, 차별점 소개

③ 본 콘텐츠 — 소제목 1개 ("AI 검색 인용을 위한 콘텐츠 구조" 등 포스트별 다름)
   다음 중 1~2개 형식 적극 활용:
   • 4가지 신호 (JSON-LD·E-E-A-T·FAQ·HowTo) 같은 번호 리스트
   • 비교표 ( | 항목 | 기존 | 신규 | )
   • Q1~Q5 FAQ (답변 80~150자, 첫 문장 결론)
   • 1~5단계 HowTo (각 단계 짧은 설명)
   • 5가지 체크리스트
   • 5단계 로드맵

④ (선택) 부가 가치 1개 — 소제목 ("4개 언어로 동시 발행"·"외국인 도달"·"전후 비교" 등)

⑤ 카테고리 방문 안내 — 소제목 ("카테고리 방문해 보기" 또는 "더 자세한 사례·후기")
   "[전문가명]의 [차별 가치]가 정리된 카테고리 페이지입니다:
    👉 [카테고리 URL]
    [전문가명]의 [노하우/사례]를 한눈에 보실 수 있습니다."

⑥ 푸터 ("---" 한 줄 + 📍 단체 정보 4~5줄)
   단체 정보가 제공되면 반드시 포함:
   📍 [지역] [단체명]
   [대표/전문가명] · [지역 상세]
   [전화] · [이메일]
   홈페이지: [홈페이지 URL]

[길이] 본문 700~1100자 (소제목 포함)
[태그] 5~7개 (단체명, 전문가명, 지역+시술, AI검색, GEO-AIO 같은 신호)

============== LinkedIn 포스트 형식 (Post 2 표준 사례) ==============

[제목] 호기심·통찰형 ("ChatGPT·Perplexity가 인용하는 [분야] 정보, 어떻게 만드는가 — [전문가명]의 [차별점] 사례")

[본문 구조]
① 도입 (1~2문장 — 트렌드·통계)
② 핵심 메시지 ("[단체]는 그 답을 찾기 위해 [차별점]을 GEO/AIO 형식으로 정리했습니다")
③ 소제목 1개 ("적용한 4가지 AI 인용 친화 신호") + ▶ 4~5개 핵심 포인트
④ 소제목 1개 (선택, "4개 언어 동시 발행" 같은 부가 가치) + 1~2문장
⑤ ▶ 카테고리 페이지: [URL]
⑥ 마무리 1~2문장 (CTA·통찰)
⑦ 푸터 — 📍 [지역] | [전화] | [이메일]
⑧ 해시태그 5~9개 (#단체명 #전문가명 #지역분야 #AI검색최적화 #GEO #AIO #ChatGPT #Perplexity)

[길이] 400~700자
[태그 필드] 비워둠 — 해시태그는 본문 끝에 포함

============== 공통 규칙 ==============
- 매 포스트마다 ③ 본 콘텐츠의 각도가 달라야 함 (비교표, FAQ, HowTo, 5신호, 체크리스트, 트렌드, 실수, 전후 비교 등)
- 같은 표현·주제 반복 금지
- 카테고리 글 제목은 참고만, 그대로 베끼지 말 것
- 단체 정보가 제공되면 ② 단체 소개 + ⑥ 푸터에 정확히 반영
- 단체 정보가 없으면 ②·⑥ 생략, 일반 정보형으로

============== 응답 형식 ==============
정확히 아래 마커 형식만 사용. JSON·코드 블록·다른 형식 금지.

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

카테고리 내 기존 글 제목 샘플:
${sampleTitles}${projectInfo}

작성할 포스트 ${schedule.length}개 (Tistory와 LinkedIn 채널 번갈아):
${schedule.map(s => `Post ${s.postNo}: ${s.date}(${s.weekday}) - ${s.channel}`).join('\n')}

각 포스트는 위 카테고리 페이지로 백링크가 향하는 보조 콘텐츠입니다.
- 매 포스트마다 다른 각도(비교/FAQ/단계별/사례/체크리스트/트렌드/통계/실수 등)
- Tistory는 비교표·FAQ·HowTo 등 구조 활용
- LinkedIn은 ▶ 기호로 핵심 신호 나열 + 해시태그 5~9개
- 단체 정보가 있으면 본문/푸터에 자연스럽게 1~2회 언급 (강제 X)

위 형식대로 ${schedule.length}개 포스트를 모두 작성하세요. 마지막에 === END === 마커 필수.`;

  let aiPosts: { postNo: number; title: string; body: string; tags: string[] }[] = [];
  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 12000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
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

      const titleMatch = cleanBlock.match(/^\s*TITLE:\s*(.+?)$/m);
      const tagsMatch = cleanBlock.match(/^\s*TAGS:\s*(.*?)$/m);
      const bodyMatch = cleanBlock.match(/^\s*BODY:\s*([\s\S]*?)$/m);

      const title = titleMatch ? titleMatch[1].trim() : '';
      const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';
      const tags = tagsRaw && tagsRaw !== '(비워둠)' && tagsRaw !== '(없음)'
        ? tagsRaw.split(/[,#·]+/).map(t => t.trim().replace(/^#/, '')).filter(t => t && t.length > 0 && t !== '비워둠')
        : [];
      const body = bodyMatch ? bodyMatch[1].trim() : '';

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

  // 5. 일정 + AI 결과 합성
  const merged: RoadmapPost[] = schedule.map(s => {
    const ai = aiPosts.find(p => p.postNo === s.postNo) || { title: '', body: '', tags: [] };
    return {
      postNo: s.postNo,
      weekNum: s.weekNum,
      channel: s.channel,
      date: s.date,
      weekday: s.weekday,
      title: ai.title || `[${s.channel} ${s.postNo}] 카테고리: ${categorySlug}`,
      body: ai.body || '',
      tags: Array.isArray(ai.tags) ? ai.tags : [],
      categoryLink,
    };
  });

  const result: RoadmapResponse = {
    categorySlug,
    categoryLabel: categorySlug,
    totalWeeks: weeks,
    totalPosts: merged.length,
    posts: merged,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}

// GET: 사용 가능 카테고리 목록 (DB의 distinct + 글 수)
export async function GET() {
  const supa = getSupabase();
  const { data } = await supa.from('blog_articles').select('category');
  const counts: Record<string, number> = {};
  (data || []).forEach(r => {
    if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
  });
  const categories = Object.entries(counts)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
  return NextResponse.json({ categories });
}
