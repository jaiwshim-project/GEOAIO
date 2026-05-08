#!/usr/bin/env node
/**
 * axbiz.tistory.com 자동 발행 스크립트
 *
 * 사용법:
 *   node scripts/axbiz-auto-publisher.js          # 오늘 대기중인 포스트 발행
 *   node scripts/axbiz-auto-publisher.js --all    # 모든 pending 포스트 발행
 *   node scripts/axbiz-auto-publisher.js --dry    # 발행 없이 큐 목록만 출력
 *
 * 자동 실행 (Windows 작업 스케줄러):
 *   트리거: 매일 오전 9:00
 *   동작: node "C:\...\scripts\axbiz-auto-publisher.js"
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const puppeteer = require('puppeteer-core');
const https = require('https');

const BLOG_ID = 'axbiz';
const EMAIL = 'jaiwshim@paran.com';
const PASSWORD = 'ro9633ke14!!';
const TISTORY_CATEGORY = '1. AX 비즈';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.geo-aio.com';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const isAllMode = process.argv.includes('--all');
const isDryRun = process.argv.includes('--dry');

// ── Markdown → HTML 변환 ──────────────────────────────────────────────────────
function mdToHtml(md) {
  let html = md
    // 코드블록 보호 (임시)
    .replace(/```[\s\S]*?```/g, match => `<pre><code>${match.slice(3, -3).trim()}</code></pre>`)
    // h2, h3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold/italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 링크
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // 수평선
    .replace(/^---$/gm, '<hr/>');

  // 리스트 처리 (연속 - 항목을 ul로 묶기)
  html = html.replace(/((?:^[-*] .+\n?)+)/gm, match => {
    const items = match.trim().split('\n')
      .map(line => line.replace(/^[-*] /, '').trim())
      .filter(Boolean)
      .map(item => `<li>${item}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // 빈 줄로 구분된 텍스트를 <p>로 변환 (이미 태그가 있는 줄은 제외)
  html = html
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|li|pre|hr|blockquote)/.test(block)) return block;
      // 인라인 줄바꿈 처리
      block = block.replace(/\n/g, '<br/>');
      return `<p>${block}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

// ── Supabase REST API 헬퍼 ──────────────────────────────────────────────────
function supabaseRequest(method, path, body) {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL + path);
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── 오늘 날짜 ──────────────────────────────────────────────────────────────
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── 발행 대기 포스트 조회 ────────────────────────────────────────────────────
async function fetchPendingPosts() {
  const today = todayISO();
  let query = `/rest/v1/tistory_publish_queue?status=eq.pending&order=scheduled_date.asc`;
  if (!isAllMode) {
    query += `&scheduled_date=lte.${today}`;
  }
  const items = await supabaseRequest('GET', query, null);
  if (!Array.isArray(items)) {
    console.error('큐 조회 오류:', items);
    return [];
  }
  return items;
}

// ── 큐 상태 업데이트 ────────────────────────────────────────────────────────
async function updateStatus(id, status, extra = {}) {
  const update = {
    status,
    ...extra,
    ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
  };
  await supabaseRequest('PATCH', `/rest/v1/tistory_publish_queue?id=eq.${id}`, update);
}

// ── Tistory 로그인 ──────────────────────────────────────────────────────────
async function loginTistory(page) {
  await page.goto(`https://${BLOG_ID}.tistory.com/manage`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2000);

  if (!page.url().includes('login') && !page.url().includes('auth')) {
    console.log('  ✅ 이미 로그인됨');
    return true;
  }

  console.log('  카카오 로그인...');
  await page.goto('https://www.tistory.com/auth/login', { waitUntil: 'networkidle0' });
  await sleep(1500);

  const kakaoBtn = await page.evaluateHandle(() =>
    [...document.querySelectorAll('a,button')].find(el => el.textContent.includes('카카오'))
  );
  const kakaoEl = kakaoBtn.asElement();
  if (kakaoEl) { await kakaoEl.click(); await sleep(3000); }

  if (page.url().includes('kakao') || page.url().includes('accounts')) {
    const em = await page.$('input#loginId--1,input[name="loginId"],input[type="email"]');
    if (em) { await em.click({ clickCount: 3 }); await em.type(EMAIL, { delay: 60 }); }
    const pw = await page.$('input#password--2,input[name="password"],input[type="password"]');
    if (pw) { await pw.click({ clickCount: 3 }); await pw.type(PASSWORD, { delay: 60 }); }
    const sub = await page.$('button[type="submit"]');
    if (sub) { await sub.click(); await sleep(4000); }
  }

  // 동의 페이지
  for (let i = 0; i < 3; i++) {
    if (page.url().includes('consent') || page.url().includes('agreement')) {
      const btn = await page.evaluateHandle(() =>
        [...document.querySelectorAll('button,a')].find(el => el.textContent.includes('동의') || el.textContent.includes('확인'))
      );
      const el = btn.asElement();
      if (el) { await el.click(); await sleep(3000); } else break;
    } else break;
  }

  const ok = !page.url().includes('login') && !page.url().includes('auth');
  console.log(ok ? '  ✅ 로그인 성공' : '  ❌ 로그인 실패: ' + page.url());
  return ok;
}

// ── 단일 포스트 발행 ────────────────────────────────────────────────────────
async function publishPost(page, post) {
  console.log(`\n  📝 발행 중: [${post.category_slug}] P${post.post_no} "${post.title}"`);

  // 새 포스트 편집기
  await page.goto(`https://${BLOG_ID}.tistory.com/manage/newpost/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(7000);

  // 카테고리 선택
  const catBtn = await page.$('#category-btn');
  if (catBtn) {
    await catBtn.click();
    await sleep(2000);
    const catResult = await page.evaluate((targetCat) => {
      const items = [...document.querySelectorAll('.mce-menu-item')];
      const match = items.find(el => el.textContent.trim() === targetCat);
      if (match) { match.click(); return 'ok:' + targetCat; }
      return 'not-found:' + items.map(el => el.textContent.trim()).join('|');
    }, TISTORY_CATEGORY);
    console.log('    카테고리:', catResult);
    await sleep(500);
  }

  // 제목 입력
  const titleSel = '[placeholder*="제목"], .editor-title, input#title';
  await page.waitForSelector(titleSel, { timeout: 10000 }).catch(() => {});
  const titleEl = await page.$(titleSel);
  if (titleEl) {
    await titleEl.click({ clickCount: 3 });
    await titleEl.type(post.title, { delay: 30 });
    console.log('    제목 ✅');
  }
  await sleep(1000);

  // 본문 삽입 (Markdown→HTML, TinyMCE API)
  const bodyHtml = mdToHtml(post.body);
  const insertResult = await page.evaluate((html) => {
    const editor = window.tinyMCE?.activeEditor || window.tinymce?.activeEditor;
    if (editor) { editor.setContent(html); editor.save(); return 'tinymce'; }
    return 'no-editor';
  }, bodyHtml);
  console.log('    본문:', insertResult);

  await sleep(2000);

  // 발행 패널 → 공개 선택 → 공개 발행
  const pubHandle = await page.evaluateHandle(() =>
    [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '완료' || b.id === 'publish-layer-btn')
  );
  const pubEl = pubHandle.asElement();
  if (!pubEl) { console.log('    ❌ 발행 버튼 없음'); return null; }
  await pubEl.click();
  await sleep(2000);

  // 라디오에서 '공개' 선택
  await page.evaluate(() => {
    const radios = [...document.querySelectorAll('input[type="radio"]')];
    for (const r of radios) {
      const label = document.querySelector(`label[for="${r.id}"]`);
      if (label?.textContent.trim() === '공개') { r.click(); return; }
    }
  });
  await sleep(800);

  // publish-btn 클릭
  const publishBtn = await page.$('#publish-btn');
  if (publishBtn) {
    await publishBtn.click();
    console.log('    공개 발행 클릭');
  }

  // 발행 완료 대기 (URL 변경 감지)
  let finalUrl = null;
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    const url = page.url();
    if (url.includes('manage/posts') || url.match(/\d{7}$/)) {
      finalUrl = url;
      break;
    }
  }

  if (!finalUrl) {
    // URL이 manage/newpost/로 남아있어도 실제 발행됐을 수 있음
    finalUrl = page.url();
  }

  // 최신 포스트 URL 찾기
  if (finalUrl.includes('manage/posts') || finalUrl.includes('manage/newpost')) {
    await sleep(1000);
    const postUrl = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href*="axbiz.tistory.com"]')]
        .filter(a => /axbiz\.tistory\.com\/\d+$/.test(a.href));
      return links[0]?.href || null;
    });
    if (postUrl) finalUrl = postUrl;
  }

  console.log(`    ✅ 발행 완료: ${finalUrl}`);
  return finalUrl;
}

// ── 메인 ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🚀 axbiz.tistory.com 자동 발행 시작 (${todayISO()})`);
  console.log(`   모드: ${isAllMode ? '전체(--all)' : '오늘 이하'} | ${isDryRun ? '드라이런(--dry)' : '실제 발행'}\n`);

  // 환경변수 확인
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ 환경변수 없음: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY');
    console.error('   .env.local 파일 확인 필요');
    process.exit(1);
  }

  // 대기중인 포스트 조회
  const posts = await fetchPendingPosts();
  console.log(`📋 발행 대기 포스트: ${posts.length}개`);

  if (posts.length === 0) {
    console.log('✅ 발행할 포스트 없음');
    return;
  }

  posts.forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.category_slug}] P${p.post_no} "${p.title}" (${p.scheduled_date})`);
  });

  if (isDryRun) {
    console.log('\n⚠ --dry 모드: 실제 발행 안 함');
    return;
  }

  // Puppeteer 실행
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,  // CAPTCHA가 없는 axbiz이므로 headless: true도 가능
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(90000);

  let successCount = 0;
  let failCount = 0;

  try {
    // 로그인
    const loggedIn = await loginTistory(page);
    if (!loggedIn) {
      console.error('❌ 로그인 실패 — 중단');
      return;
    }

    // 각 포스트 발행
    for (const post of posts) {
      // 발행 중 상태로 업데이트
      await updateStatus(post.id, 'publishing');

      try {
        const postUrl = await publishPost(page, post);
        await updateStatus(post.id, 'published', { post_url: postUrl || '' });
        successCount++;
        console.log(`  ✅ 성공 (${successCount}/${posts.length})`);
      } catch (e) {
        const msg = e.message || String(e);
        console.error(`  ❌ 실패: ${msg}`);
        await updateStatus(post.id, 'failed', { error_msg: msg });
        failCount++;
      }

      // 포스트 간 딜레이 (Tistory 스팸 방지)
      if (posts.indexOf(post) < posts.length - 1) {
        console.log('  ⏳ 다음 포스트까지 15초 대기...');
        await sleep(15000);
      }
    }

  } finally {
    await sleep(3000);
    await browser.close();
  }

  console.log(`\n🎉 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
  if (failCount > 0) {
    console.log('  ⚠ 실패한 포스트는 대시보드에서 ❌재시도 버튼으로 재발행하세요');
  }
})().catch(e => {
  console.error('치명적 오류:', e.message);
  process.exit(1);
});
