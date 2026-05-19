// geo-aio 카테고리 글들을 Claude Haiku로 분석해 적절한 기존 카테고리로 이동
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) {
    acc[m[1]] = m[2]
      .replace(/^["']|["']$/g, '')
      .replace(/\\n|\\r|\\t/g, '')
      .replace(/\s/g, '');
  }
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: env.CLAUDE_API_KEY || env.ANTHROPIC_API_KEY });

const APPLY = process.argv.includes('--apply'); // --apply 없으면 dry-run

(async () => {
  // 1. geo-aio 글 fetch
  const { data: articles } = await supa
    .from('blog_articles')
    .select('id, title, content')
    .eq('category', 'geo-aio')
    .order('created_at', { ascending: false });
  console.log(`[1] geo-aio 글 ${articles?.length ?? 0}개 fetch`);

  // 2. 사용 가능 카테고리 (geo-aio 제외, 글 수 ≥ 5)
  const { data: all } = await supa.from('blog_articles').select('category');
  const counts = {};
  (all || []).forEach(r => { if (r.category && r.category !== 'geo-aio') counts[r.category] = (counts[r.category] || 0) + 1; });
  const targetCats = Object.entries(counts).map(([c, n]) => `${c} (${n}편)`).sort();
  console.log(`[2] 분류 대상 카테고리 ${targetCats.length}개`);

  // 3. 한 번에 Claude에 분류 요청
  const articlesPayload = articles.map(a => {
    const excerpt = (a.content || '').slice(0, 500).replace(/\n+/g, ' ');
    return `ID: ${a.id}\nTITLE: ${a.title}\nEXCERPT: ${excerpt}\n---`;
  }).join('\n');

  const systemPrompt = `당신은 한국어 블로그 글 분류 전문가입니다. 주어진 글의 제목·발췌를 읽고 가장 적합한 기존 카테고리 슬러그를 정확히 1개 선택합니다.

**규칙**:
- 카테고리 슬러그는 반드시 "사용 가능한 카테고리 목록"에서 정확하게 복사할 것 (괄호 안 글 수 빼고)
- 새 카테고리는 만들지 말 것
- 글의 핵심 주제가 어느 카테고리에도 명확히 안 맞으면 "geo-aio"로 유지 (변경하지 않음)
- 정치인 후보 관련 글은 해당 후보자 카테고리로 (예: "오세훈" 키워드 → 오세훈-서울시장-후보자)
- 호텔·숙박·튤립축제·봄꽃축제는 백제호텔, 덕산온천 명시는 덕산-백제호텔
- AI 선거 솔루션·선거 워룸·에스비컨설팅은 ai선거솔루션-워룸

**응답 형식**: JSON 배열만. 코드블록 없이.
[
  {"id": "uuid", "category": "슬러그", "confidence": 0~10, "reason": "한 줄 요지"},
  ...
]

응답에 모든 글 ID를 빠짐없이 포함할 것.`;

  const userPrompt = `사용 가능한 카테고리 목록:
${targetCats.join('\n')}

분류할 글 (총 ${articles.length}개):

${articlesPayload}

위 모든 글을 JSON 배열로 분류하세요.`;

  console.log(`[3] Claude Haiku에 분류 요청 (입력 ${userPrompt.length}자)`);
  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const txt = resp.content.filter(b => b.type === 'text').map(b => b.text).join('');

  // JSON 파싱
  let classifications;
  try {
    const jsonMatch = txt.match(/\[\s*\{[\s\S]*\}\s*\]/);
    classifications = JSON.parse(jsonMatch ? jsonMatch[0] : txt);
  } catch (e) {
    console.error('JSON 파싱 실패. 응답 첫 1000자:', txt.slice(0, 1000));
    process.exit(1);
  }
  console.log(`[4] 분류 결과 ${classifications.length}개 수신`);

  // 4. 분류 결과 표시 (카테고리별 그룹)
  const grouped = {};
  classifications.forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });

  console.log('\n[분류 결과 — 카테고리별 그룹]');
  Object.entries(grouped).sort((a, b) => b[1].length - a[1].length).forEach(([cat, items]) => {
    console.log(`\n  📂 ${cat} (${items.length}개)`);
    items.forEach(c => {
      const a = articles.find(x => x.id === c.id);
      console.log(`     - "${a?.title?.slice(0, 60) ?? '?'}..." [conf:${c.confidence}]`);
    });
  });

  // 5. 적용 (--apply 플래그)
  const moves = classifications.filter(c => c.category && c.category !== 'geo-aio' && c.confidence >= 6);
  console.log(`\n[5] 이동 대상: ${moves.length}개 / 유지: ${classifications.length - moves.length}개`);

  if (!APPLY) {
    console.log('\n⚠️  --apply 플래그 없음 — DRY RUN. 실제 적용하려면:');
    console.log('    node scripts/reclassify-geo-aio.js --apply');
    return;
  }

  console.log('\n[6] DB 업데이트 시작...');
  let ok = 0, fail = 0;
  for (const m of moves) {
    const { error } = await supa.from('blog_articles').update({ category: m.category }).eq('id', m.id);
    if (error) { console.log(`  ❌ ${m.id} → ${m.category}: ${error.message}`); fail++; }
    else { ok++; }
  }
  console.log(`\n✅ 완료: ${ok}개 이동 성공 / ${fail}개 실패 / ${classifications.length - moves.length}개 geo-aio 유지`);
})();
