const fs = require('fs'), path = require('path');
const { createClient } = require('@supabase/supabase-js');
const env = {};
fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (!m) return;
  let v = m[2].trim(); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
  env[m[1]] = v.replace(/\\n$/,'').trim();
});
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supa.from('blog_articles').select('category').ilike('category', '%정원%').limit(2000);
  console.log('error:', error?.message);
  console.log('match count:', (data || []).length);
  const counts = {};
  (data || []).forEach(r => counts[r.category] = (counts[r.category] || 0) + 1);
  console.log('카테고리별:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${v.toString().padStart(4)}  ${k}`));
})();
