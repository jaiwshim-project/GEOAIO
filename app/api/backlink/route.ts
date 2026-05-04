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

  // 카테고리 글 제목 5개를 컨텍스트로
  const sampleTitles = posts.slice(0, 10).map((p, i) => `${i + 1}. ${p.title}`).join('\n');

  // 마크다운 구분자 형식 — JSON escape 문제 회피로 더 견고
  const systemPrompt = `당신은 백링크 실행 로드맵 카피라이터입니다. 카테고리 페이지로 트래픽을 유도하는 Tistory/LinkedIn 포스트를 일정에 맞춰 작성합니다.

규칙:
- Tistory: 제목 30~45자, 본문 600~800자, 태그 5~7개. 자연스러운 정보형. 본문 끝에 카테고리 URL 1회 포함.
- LinkedIn: 제목 줄 + 5~8문단. 인사이트·통찰형. 본문 중간에 카테고리 URL 1회 + 마지막에 해시태그 3~5개.
- 같은 주제·표현 반복 금지. 매 포스트마다 다른 각도(가격·기간·비교·사례·장단점·FAQ·체크리스트·트렌드 등).
- 카테고리 글 제목을 참고하되 그대로 베끼지 말 것.

응답 형식: 정확히 아래 마커 형식만 사용. JSON·마크다운·다른 형식 금지.

===POST 1===
TITLE: 포스트 제목 한 줄
TAGS: 태그1, 태그2, 태그3 (Tistory만, LinkedIn은 비워둠)
BODY:
포스트 본문 시작
여러 줄 가능
본문 끝 — 다음 포스트 전까지

===POST 2===
TITLE: ...
TAGS: ...
BODY:
...

(이런 식으로 모든 포스트를 마커로 구분)
=== END ===`;

  const userPrompt = `카테고리 슬러그: ${categorySlug}
카테고리 페이지 URL: ${categoryLink}

카테고리 내 기존 글 제목 샘플:
${sampleTitles}

작성할 포스트 ${schedule.length}개:
${schedule.map(s => `Post ${s.postNo}: ${s.date}(${s.weekday}) - ${s.channel}`).join('\n')}

각 포스트는 위 카테고리 페이지로 백링크가 향하는 보조 콘텐츠입니다. 위 형식대로 ${schedule.length}개 포스트를 모두 작성하세요. 마지막에 === END === 마커 필수.`;

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
