const https = require('https');
const fs = require('fs'), path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
function getEnv(key) {
  const line = raw.split(/\r?\n/).find(l => l.startsWith(key + '='));
  if (!line) return '';
  let val = line.slice(key.length+1).replace(/^["']|["']$/g,'').trim();
  while(val.endsWith('\\n')||val.endsWith('\n')) val=val.replace(/\\n$/,'').replace(/\n$/,'').trim();
  return val;
}
const BASE = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPA_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY').replace(/\s/g,'');
console.log('KEY len:', SUPA_KEY.length);

function httpPatch(url, headers, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, data: b }));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(data); req.end();
  });
}

(async () => {
  const r = await httpPatch(
    BASE + '/rest/v1/linkedin_publish_queue?status=eq.failed',
    { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, Prefer: 'return=minimal' },
    { status: 'pending', error_msg: null }
  );
  console.log('큐 재설정:', r.status, r.data || '(ok)');
  console.log('✅ 완료 — 재인증 후 대시보드에서 발행 버튼 누르면 됩니다.');
})();
