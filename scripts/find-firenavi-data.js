// 화이어내비 / 02-1234-5678 / contact@firenavi.com 저장 위치 탐색
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
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const NEEDLES = ['firenavi', '화이어내비', '02-1234-5678', '021234'];

(async () => {
  // 1. user_projects 모든 컬럼·needle
  const { data: ups } = await supa.from('user_projects').select('*');
  console.log(`\n[user_projects] ${ups?.length ?? 0}개 row 스캔`);
  (ups || []).forEach(r => {
    Object.entries(r).forEach(([k, v]) => {
      if (typeof v === 'string') {
        const lower = v.toLowerCase();
        for (const n of NEEDLES) {
          if (lower.includes(n.toLowerCase())) {
            console.log(`  ✔ id=${r.id} name="${r.name}" 컬럼=${k}: ${v.slice(0, 200).replace(/\n/g, ' / ')}`);
            return;
          }
        }
      }
    });
  });

  // 1-b. user_projects 전체 name 리스트 (확인용)
  console.log(`\n[user_projects] 전체 프로젝트명:`);
  (ups || []).forEach(r => console.log(`  - id=${r.id} name="${r.name}"`));

  // 2. blog_category_projects
  const { data: bcps } = await supa.from('blog_category_projects').select('*');
  console.log(`\n[blog_category_projects] ${bcps?.length ?? 0}개 row 전체 표시:`);
  (bcps || []).forEach(r => console.log(`  - ${JSON.stringify(r)}`));
})();
