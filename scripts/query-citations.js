// 자체 측정한 AI 인용 결과 (cep_ab_results) 집계 조회
// 사용: node scripts/query-citations.js
const fs = require('fs');
const path = require('path');
// 간단 .env.local 파서 (dotenv 의존성 없음)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('SUPABASE env 누락');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('cep_ab_results')
    .select('search_engine, cited, citation_snippet, source_url, query, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('쿼리 실패:', error.message);
    process.exit(1);
  }

  const total = data.length;
  if (total === 0) {
    console.log('지난 30일 측정 기록 없음 — cron이 실행되지 않았거나 cep_ab_targets 테이블이 비었음');
    const { count: tCount } = await supabase
      .from('cep_ab_targets')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);
    console.log(`active 측정 대상(cep_ab_targets) 수: ${tCount ?? '?'}`);
    return;
  }

  const byEngine = {};
  for (const r of data) {
    const e = r.search_engine || 'unknown';
    byEngine[e] ||= { total: 0, cited: 0, samples: [] };
    byEngine[e].total++;
    if (r.cited) {
      byEngine[e].cited++;
      if (byEngine[e].samples.length < 3) {
        byEngine[e].samples.push({
          query: r.query,
          source: r.source_url,
          snippet: (r.citation_snippet || '').slice(0, 120),
          when: r.created_at,
        });
      }
    }
  }

  console.log(`\n=== AI 인용 측정 결과 (지난 30일, 총 ${total}건) ===\n`);
  for (const [engine, s] of Object.entries(byEngine)) {
    const rate = s.total > 0 ? ((s.cited / s.total) * 100).toFixed(1) : '0.0';
    console.log(`▶ ${engine.toUpperCase()}: ${s.cited}/${s.total} 인용 (${rate}%)`);
    if (s.samples.length > 0) {
      s.samples.forEach((x, i) => {
        console.log(`   ${i + 1}. "${x.query}" → ${x.source}`);
        console.log(`      "${x.snippet}..." (${x.when.slice(0, 10)})`);
      });
    }
    console.log();
  }

  const totalCited = Object.values(byEngine).reduce((a, b) => a + b.cited, 0);
  console.log(`전체 인용률: ${totalCited}/${total} (${((totalCited / total) * 100).toFixed(1)}%)`);
})();
