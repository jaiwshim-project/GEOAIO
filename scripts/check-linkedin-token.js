const https = require('https');
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
function getEnv(key) {
  const line = raw.split(/\r?\n/).find(l => l.startsWith(key + '='));
  if (!line) return '';
  let val = line.slice(key.length + 1).replace(/^["']|["']$/g, '').trim();
  while (val.endsWith('\\n') || val.endsWith('\n')) val = val.replace(/\\n$/, '').replace(/\n$/, '').trim();
  return val;
}

const BASE = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY').replace(/\s/g, '');

function supaGet(table) {
  return new Promise((resolve) => {
    const u = new URL(`/rest/v1/${table}?select=*`, BASE);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve(b); } });
    });
    req.on('error', resolve);
    req.end();
  });
}

(async () => {
  console.log('=== linkedin_tokens ===');
  const tokens = await supaGet('linkedin_tokens');
  console.log(JSON.stringify(tokens, null, 2));

  console.log('\n=== linkedin_publish_queue (최근 5) ===');
  const queue = await supaGet('linkedin_publish_queue?order=created_at.desc&limit=5');
  console.log(JSON.stringify(queue, null, 2));
})();
