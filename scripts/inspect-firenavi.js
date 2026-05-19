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

(async () => {
  const { data, error } = await supa
    .from('user_projects')
    .select('*')
    .eq('id', '05f27b06-d367-4cbc-b3b6-22cb608ab44a')
    .single();
  if (error) { console.error(error); return; }
  console.log('화이어내비 row 전체:');
  Object.entries(data).forEach(([k, v]) => {
    const repr = typeof v === 'string' ? `"${v.slice(0, 200)}"` : JSON.stringify(v);
    console.log(`  ${k} = ${repr}`);
  });
})();
