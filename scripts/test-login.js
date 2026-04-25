// jaiwshim_tester 계정으로 로그인 시도 + user-dashboard 상태 캡쳐
const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 콘솔 에러 수집
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });
  page.on('pageerror', err => errors.push('[pageerror] ' + err.message));

  // 1. user-select 페이지
  console.log('1. /user-select 방문');
  await page.goto('https://www.geo-aio.com/user-select?nocache=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: 'tmp_select.png', fullPage: true });
  const selectHTML = await page.evaluate(() => document.body.innerText);
  console.log('user-select 텍스트 (앞 800자):\n', selectHTML.slice(0, 800));

  // 2. jaiwshim_tester 항목 찾아서 클릭
  console.log('\n2. jaiwshim_tester@gmail.com 항목 클릭');
  const clicked = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"], li, [class*="cursor-pointer"]'));
    for (const el of candidates) {
      if (el.innerText && el.innerText.includes('jaiwshim_tester')) {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log('  클릭 결과:', clicked);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'tmp_pin.png', fullPage: true });

  // 3. PIN 4자리 입력 (9633)
  console.log('\n3. PIN 9633 입력');
  const pinInputs = await page.$$('input[type="text"][maxlength="1"], input[id^="pin-"], input[type="password"][maxlength="1"]');
  console.log('  PIN input 개수:', pinInputs.length);
  if (pinInputs.length === 4) {
    const digits = ['9','6','3','3'];
    for (let i = 0; i < 4; i++) {
      await pinInputs[i].click();
      await pinInputs[i].type(digits[i], { delay: 50 });
    }
  } else {
    console.log('  PIN input 4개를 못 찾음. 화면 분석 필요.');
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'tmp_after_pin.png', fullPage: true });

  // 4. 인증 버튼 클릭 (자동 제출 안 될 경우)
  console.log('\n4. 인증/확인 버튼 시도');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => /확인|로그인|시작|인증|enter|verify/i.test(b.innerText));
    if (target) target.click();
  });

  // user-dashboard 도달 대기
  try {
    await page.waitForFunction(() => location.pathname.includes('/user-dashboard'), { timeout: 10000 });
    console.log('  ✓ user-dashboard 도달');
  } catch {
    console.log('  ✗ user-dashboard 도달 실패. 현재 URL:', page.url());
  }

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'tmp_dashboard.png', fullPage: true });

  // 5. 프로젝트 목록 추출
  const dashboardInfo = await page.evaluate(() => {
    const stored = sessionStorage.getItem('geoaio_user');
    return {
      url: location.href,
      sessionUser: stored ? JSON.parse(stored) : null,
      bodyTextSnippet: document.body.innerText.slice(0, 1500),
    };
  });
  console.log('\n5. user-dashboard 상태:');
  console.log('   URL:', dashboardInfo.url);
  console.log('   sessionStorage geoaio_user:', JSON.stringify(dashboardInfo.sessionUser));
  console.log('   화면 텍스트 (앞 1500자):\n', dashboardInfo.bodyTextSnippet);

  if (errors.length) {
    console.log('\n=== 콘솔 에러 ===');
    errors.forEach(e => console.log(' ', e));
  }

  await browser.close();
  console.log('\n완료. 스크린샷: tmp_select.png, tmp_pin.png, tmp_after_pin.png, tmp_dashboard.png');
})();
