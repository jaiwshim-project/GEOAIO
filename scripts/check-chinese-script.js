// 허태정 카테고리 중국어 글의 간체/번체 판별
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const envText = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envText.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) return;
  let v = m[2].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
  v = v.replace(/\\n$/,'').trim();
  env[m[1]] = v;
});
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 간체-번체 페어 (왼쪽=간체, 오른쪽=번체) — 가장 빈도 높은 글자 위주
const PAIRS = [
  ['许','許'], ['泰','泰'], // 泰는 공통
  ['广','廣'], ['战','戰'], ['国','國'], ['学','學'], ['会','會'],
  ['现','現'], ['实','實'], ['义','義'], ['发','發'], ['经','經'],
  ['济','濟'], ['团','團'], ['长','長'], ['过','過'], ['说','說'],
  ['让','讓'], ['认','認'], ['为','為'], ['对','對'], ['这','這'],
  ['专','專'], ['门','門'], ['问','問'], ['题','題'], ['关','關'],
  ['时','時'], ['间','間'], ['场','場'], ['总','總'], ['统','統'],
  ['区','區'], ['县','縣'], ['议','議'], ['选','選'], ['举','舉'],
  ['党','黨'], ['领','領'], ['导','導'], ['职','職'], ['责','責'],
  ['务','務'], ['权','權'], ['极','極'], ['执','執'], ['军','軍'],
  ['类','類'], ['传','傳'], ['报','報'], ['纸','紙'], ['书','書'],
  ['读','讀'], ['听','聽'], ['声','聲'], ['门','門'], ['图','圖'],
  ['号','號'], ['车','車'], ['马','馬'], ['鸟','鳥'], ['鱼','魚'],
  ['爱','愛'], ['儿','兒'], ['计','計'], ['议','議'], ['标','標'],
  ['准','準'], ['价','價'], ['货','貨'], ['资','資'], ['银','銀'],
  ['钱','錢'], ['买','買'], ['卖','賣'], ['费','費'], ['贵','貴'],
  ['赢','贏'], ['输','輸'], ['运','運'], ['动','動'], ['静','靜'],
  ['节','節'], ['约','約'], ['绿','綠'], ['红','紅'], ['黄','黃'],
  ['蓝','藍'], ['紫','紫'], ['脑','腦'], ['头','頭'], ['脸','臉'],
  ['体','體'], ['医','醫'], ['药','藥'], ['险','險'], ['护','護'],
];

function tally(text) {
  let simp = 0, trad = 0;
  for (const [s, t] of PAIRS) {
    if (s === t) continue; // 공통 글자 스킵
    const sCount = (text.match(new RegExp(s, 'g')) || []).length;
    const tCount = (text.match(new RegExp(t, 'g')) || []).length;
    simp += sCount;
    trad += tCount;
  }
  return { simp, trad };
}

(async () => {
  const { data, error } = await supa
    .from('blog_articles')
    .select('id, title, content')
    .eq('category', '허태정-대전시장-후보자')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) { console.error(error); return; }

  // 일본어(가나 포함) 제외 — 한자만 있는 글 = 중국어
  const chinese = data.filter(r => {
    const t = `${r.title || ''}\n${(r.content || '').slice(0,1000)}`;
    const hasKana = /[぀-ゟ゠-ヿ]/.test(t);
    const hasHan = /[一-鿿]/.test(t);
    const hasHangul = /[가-힣]/.test(t);
    const enRatio = (t.match(/[a-zA-Z]/g) || []).length / Math.max(1, t.length);
    return !hasKana && !hasHangul && hasHan && enRatio < 0.3;
  });
  console.log(`중국어로 추정되는 글: ${chinese.length}건\n`);

  let totalSimp = 0, totalTrad = 0;
  chinese.slice(0, 15).forEach((r, i) => {
    const { simp, trad } = tally(`${r.title}\n${(r.content||'').slice(0, 3000)}`);
    totalSimp += simp;
    totalTrad += trad;
    const verdict = simp > trad * 2 ? '간체(简体)' : trad > simp * 2 ? '번체(繁體)' : '혼재/판정불가';
    console.log(`[${i+1}] simp=${simp.toString().padStart(3)} trad=${trad.toString().padStart(3)}  → ${verdict}`);
    console.log(`     ${(r.title || '').slice(0, 70)}`);
  });

  console.log(`\n=== 종합 ===`);
  console.log(`전체 간체 글자 수: ${totalSimp}`);
  console.log(`전체 번체 글자 수: ${totalTrad}`);
  if (totalSimp > totalTrad * 5) console.log(`최종 판정: 간체자(简体字, Simplified Chinese) — 중국 본토·싱가포르 표기`);
  else if (totalTrad > totalSimp * 5) console.log(`최종 판정: 번체자(繁體字, Traditional Chinese) — 대만·홍콩 표기`);
  else console.log(`최종 판정: 혼재 또는 판정 어려움`);

  // 본문 첫 300자 샘플
  if (chinese[0]) {
    console.log(`\n[본문 샘플 1건]`);
    console.log(chinese[0].title);
    console.log('---');
    console.log((chinese[0].content || '').slice(0, 400));
  }
})();
