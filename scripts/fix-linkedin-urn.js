/**
 * LinkedIn /v2/me 응답 확인 + person_urn 수정
 */
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

function httpGet(url, headers) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, data: b }); }});
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

function httpPatch(url, headers, body) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'PATCH',
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
  // 1. Supabase에서 access_token 가져오기
  const tokenRes = await httpGet(BASE + '/rest/v1/linkedin_tokens?id=eq.1', {
    apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY
  });
  const token = tokenRes.data?.[0]?.access_token;
  if (!token) { console.error('토큰 없음:', tokenRes); return; }
  console.log('✅ 토큰 확인\n');

  // 2. /v2/me 호출 (여러 방식 시도)
  const endpoints = [
    { label: 'GET /v2/me (기본)', url: 'https://api.linkedin.com/v2/me', headers: { Authorization: 'Bearer ' + token } },
    { label: 'GET /v2/me (Restli)', url: 'https://api.linkedin.com/v2/me', headers: { Authorization: 'Bearer ' + token, 'X-Restli-Protocol-Version': '2.0.0' } },
    { label: 'GET /rest/me (202412)', url: 'https://api.linkedin.com/rest/me', headers: { Authorization: 'Bearer ' + token, 'LinkedIn-Version': '202412' } },
    { label: 'GET /v2/userinfo', url: 'https://api.linkedin.com/v2/userinfo', headers: { Authorization: 'Bearer ' + token } },
    { label: 'GET /v2/me?projection=(id)', url: 'https://api.linkedin.com/v2/me?projection=(id)', headers: { Authorization: 'Bearer ' + token, 'X-Restli-Protocol-Version': '2.0.0' } },
  ];

  let memberId = null;
  for (const ep of endpoints) {
    console.log(`\n=== ${ep.label} ===`);
    const res = await httpGet(ep.url, ep.headers);
    console.log('Status:', res.status, '| Data:', JSON.stringify(res.data).substring(0, 200));
    if (res.status === 200) {
      const d = res.data;
      memberId = d?.id || d?.sub || d?.memberHandle;
      if (memberId) { console.log('✅ ID 발견:', memberId); break; }
    }
  }

  // 4. ID 추출 및 URN 수정
  const ui = { data: {} }; // 미사용 placeholder
  if (!memberId || memberId === 'undefined') {
    console.log('\n⚠ ID를 자동 추출할 수 없습니다.');
    return;
  }

  // LinkedIn UGC Posts API는 urn:li:person:{id} 형식 사용
  const personUrn = `urn:li:person:${memberId}`;
  console.log('\n✅ 추출된 URN:', personUrn);

  // 5. Supabase 업데이트
  const patchRes = await httpPatch(BASE + '/rest/v1/linkedin_tokens?id=eq.1',
    { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
    { person_urn: personUrn }
  );
  console.log('Supabase 업데이트:', patchRes.status, patchRes.data || '');

  // 6. 실패한 큐 항목을 pending으로 재설정
  const resetRes = await httpPatch(BASE + '/rest/v1/linkedin_publish_queue?status=eq.failed',
    { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
    { status: 'pending', error_msg: null }
  );
  console.log('큐 재설정:', resetRes.status);
  console.log('\n✅ 완료! 대시보드에서 LinkedIn 발행 버튼을 다시 눌러보세요.');
})();
