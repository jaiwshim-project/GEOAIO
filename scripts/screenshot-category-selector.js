// 로그인 후 /generate 페이지 캡쳐 — 카테고리 선택 섹션 확인용
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });
  page.on('pageerror', err => errors.push('[pageerror] ' + err.message));

  // 0. /site-password 직접 통과 (브라우저 세션에 인증 쿠키 박기)
  console.log('0. /site-password 통과');
  await page.goto('https://www.geo-aio.com/site-password?next=/user-select', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  const pw0 = await page.$('input[type="password"]');
  if (pw0) {
    await pw0.click({ clickCount: 3 });
    await pw0.type('963314', { delay: 30 });
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    console.log('   비밀번호 입력 후 URL:', page.url());
  } else {
    console.log('   /site-password 인증 이미 통과한 듯');
  }

  console.log('1. /user-select 방문');
  await page.goto('https://www.geo-aio.com/user-select?nocache=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  console.log('2. jaiwshim_tester 클릭');
  await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"], li, [class*="cursor-pointer"]'));
    for (const el of candidates) {
      if (el.innerText && el.innerText.includes('jaiwshim_tester')) { el.click(); return true; }
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log('3. PIN 9633 입력');
  const pinInputs = await page.$$('input[type="text"][maxlength="1"], input[id^="pin-"], input[type="password"][maxlength="1"]');
  if (pinInputs.length === 4) {
    const digits = ['9','6','3','3'];
    for (let i = 0; i < 4; i++) {
      await pinInputs[i].click();
      await pinInputs[i].type(digits[i], { delay: 50 });
    }
  }
  await new Promise(r => setTimeout(r, 2500));

  console.log('4. /generate 진입 (캐시 우회)');
  await page.goto('https://www.geo-aio.com/generate?nocache=' + Date.now(), { waitUntil: 'networkidle0', timeout: 45000 });
  await new Promise(r => setTimeout(r, 2000));


  const url = page.url();
  console.log('   현재 URL:', url);

  // 페이지 텍스트에서 카테고리 섹션 라벨 검색
  const result = await page.evaluate(() => {
    const labelText = '블로그 카테고리 선택';
    const fullText = document.body.innerText || '';
    const found = fullText.includes(labelText);
    let pos = null;
    // CategorySelector 컴포넌트 헤딩 위치
    const headings = Array.from(document.querySelectorAll('h3, h2, label'));
    for (const h of headings) {
      if (h.textContent && h.textContent.includes('블로그 카테고리 선택')) {
        const r = h.getBoundingClientRect();
        pos = { x: r.x, y: r.y, width: r.width, height: r.height, scrollTop: window.scrollY };
        break;
      }
    }
    return {
      found,
      pos,
      pageTitle: document.title,
      bodyTextSample: fullText.slice(0, 200),
      hasAutoMatchText: fullText.includes('자동 매칭'),
      hasManualText: fullText.includes('수동 선택'),
    };
  });

  console.log('\n--- 페이지 분석 ---');
  console.log('   제목:', result.pageTitle);
  console.log('   "블로그 카테고리 선택" 발견:', result.found);
  console.log('   "자동 매칭" 발견:', result.hasAutoMatchText);
  console.log('   "수동 선택" 발견:', result.hasManualText);
  if (result.pos) {
    console.log('   섹션 위치 (viewport 기준): x=' + result.pos.x + ', y=' + result.pos.y);
    console.log('   현재 스크롤:', result.pos.scrollTop);
  } else {
    console.log('   섹션 위치: 찾지 못함');
  }
  console.log('   본문 시작:', result.bodyTextSample);

  // 전체 페이지 (위에서 1500px) 캡쳐
  await page.screenshot({ path: 'tmp_generate_full.png', fullPage: false, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  console.log('\n저장: tmp_generate_full.png (상단 viewport)');

  // fullPage 캡쳐도 추가 (긴 페이지라 따로)
  await page.screenshot({ path: 'tmp_generate_fullpage.png', fullPage: true });
  console.log('저장: tmp_generate_fullpage.png (전체)');

  // 콘솔 에러 출력
  if (errors.length > 0) {
    console.log('\n--- 콘솔 에러 ---');
    errors.slice(0, 10).forEach(e => console.log('  ' + e.slice(0, 200)));
  } else {
    console.log('\n   콘솔 에러 없음');
  }

  await browser.close();
})();
