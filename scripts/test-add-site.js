const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1단계: 목록 페이지
  await page.goto('https://www.geo-aio.com/dashboard/indexing', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: 'tmp_step1_list.png', fullPage: true });
  console.log('step1: list page captured');

  // 2단계: 사이트 추가 버튼 클릭
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('사이트 추가'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'tmp_step2_modal_open.png', fullPage: true });
  console.log('step2: modal opened');

  // 3단계: 폼 입력
  const inputs = await page.$$('input');
  console.log('inputs found:', inputs.length);

  // 사이트 이름 (첫 번째 input)
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type('테스트 블로그');
  // 도메인
  await inputs[1].click({ clickCount: 3 });
  await inputs[1].type('test.example.com');
  // GSC URL
  await inputs[2].click({ clickCount: 3 });
  await inputs[2].type('sc-domain:test.example.com');
  // 사이트맵 URL
  await inputs[3].click({ clickCount: 3 });
  await inputs[3].type('https://test.example.com/sitemap.xml');
  // 설명 (textarea)
  const ta = await page.$('textarea');
  if (ta) {
    await ta.click({ clickCount: 3 });
    await ta.type('테스트용 샘플 사이트입니다.');
  }

  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'tmp_step3_form_filled.png', fullPage: true });
  console.log('step3: form filled');

  // 4단계: 저장 버튼
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'tmp_step4_after_save.png', fullPage: true });
  console.log('step4: after save');

  await browser.close();
  console.log('ALL DONE');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
