const https = require('https');
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');

function getEnv(key) {
  const line = raw.split(/\r?\n/).find(l => l.startsWith(key + '='));
  if (!line) return '';
  let val = line.slice(key.length + 1).replace(/^["']|["']$/g, '').trim();
  // strip trailing literal backslash-n
  while (val.endsWith('\\n') || val.endsWith('\n')) {
    val = val.replace(/\\n$/, '').replace(/\n$/, '').trim();
  }
  return val;
}

const BASE = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY').replace(/\s/g, '');

console.log('URL:', BASE);
console.log('KEY len:', KEY.length);

const u = new URL('/rest/v1/tistory_publish_queue?limit=1', BASE);
const req = https.request({
  hostname: u.hostname,
  path: u.pathname + u.search,
  method: 'GET',
  headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('HTTP', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ 테이블 접근 성공! 데이터:', body.substring(0, 200));
    } else {
      console.log('응답:', body.substring(0, 300));
    }
  });
});
req.on('error', e => console.error(e));
req.end();
