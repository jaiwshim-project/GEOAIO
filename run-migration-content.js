// pg로 Supabase 직접 연결 — 여러 연결 방식 시도
const PROJECT_REF = 'whmiinsaxthenpwjtuar';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzA1NCwiZXhwIjoyMDkwNzk5MDU0fQ.kYyF8jBMpugfmyqo1w0BO1sQFUpYhAuU0Jw8YZwJ848';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWlpbnNheHRoZW5wd2p0dWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjMwNTQsImV4cCI6MjA5MDc5OTA1NH0.s15kkaYvSPWyteT86N0KfLcOh2PeIrK43k2M8Ns-Dnw';

const SQL = `ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS forbidden_words TEXT DEFAULT NULL;`;

const { Client } = require('pg');

const connectionConfigs = [
  // Supabase Transaction Pooler (port 6543)
  {
    label: 'Transaction Pooler 6543 (service_role as password)',
    host: `aws-0-ap-northeast-2.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${PROJECT_REF}`,
    password: SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
  },
  // Supabase Session Pooler (port 5432 pooler)
  {
    label: 'Session Pooler 5432 (service_role as password)',
    host: `aws-0-ap-northeast-2.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: `postgres.${PROJECT_REF}`,
    password: SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
  },
  // Direct connection
  {
    label: 'Direct DB 5432 (service_role as password)',
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
  },
];

async function tryConnect(config) {
  const { label, ...pgConfig } = config;
  console.log(`  시도: ${label}`);
  const client = new Client({ ...pgConfig, connectionTimeoutMillis: 6000 });
  try {
    await client.connect();
    console.log('    → 연결 성공!');
    await client.query(SQL);
    console.log('    ✅ SQL 실행 성공!');
    await client.end();
    return true;
  } catch (e) {
    console.log(`    → 실패: ${e.message.split('\n')[0]}`);
    try { await client.end(); } catch {}
    return false;
  }
}

async function run() {
  console.log('=== pg 직접 연결로 DDL 실행 시도 ===\n');
  for (const config of connectionConfigs) {
    const ok = await tryConnect(config);
    if (ok) {
      console.log('\n✅ 마이그레이션 완료!');
      return;
    }
  }
  console.log('\n⚠️  자동 실행 불가 — Supabase SQL Editor에서 직접 실행 필요');
  console.log('URL: https://supabase.com/dashboard/project/whmiinsaxthenpwjtuar/editor');
  console.log('SQL:', SQL);
}

run().catch(console.error);
