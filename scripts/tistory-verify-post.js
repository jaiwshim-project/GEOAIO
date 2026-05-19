// 발행된 허브 포스트 URL 확인 (로그인 없이 공개 접근)
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();

  try {
    // 6990893, 6990894, 6990895 순서로 확인
    for (const id of [6990893, 6990894, 6990895]) {
      const url = `https://metabiz101.tistory.com/${id}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(2000);
      const finalUrl = page.url();
      const title = await page.evaluate(() => document.title || document.querySelector('h1,h2')?.textContent || '');
      const hasGeoLink = await page.evaluate(() => document.body.innerHTML.includes('geo-aio.com'));
      const isNotFound = finalUrl.includes('404') || await page.evaluate(() => document.body.innerText.includes('존재하지 않는') || document.body.innerText.includes('찾을 수 없'));
      console.log(`[${id}] URL: ${finalUrl}`);
      console.log(`  제목: ${title.slice(0, 60)}`);
      console.log(`  geo-aio.com 링크: ${hasGeoLink ? '✅' : '❌'}`);
      console.log(`  없는 글: ${isNotFound ? '예' : '아니오'}`);
      console.log();
    }
  } catch (e) {
    console.error('오류:', e.message);
  } finally {
    await browser.close();
  }
})();
