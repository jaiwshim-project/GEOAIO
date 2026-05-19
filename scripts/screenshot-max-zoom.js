const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('https://www.geo-aio.com/pricing?nocache=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  // 두 카드 영역만 정확히 추출
  const cards = await page.evaluate(() => {
    const grid = Array.from(document.querySelectorAll('.grid')).find(g => g.className.includes('md:grid-cols-2') && g.textContent?.includes('맥스 (Max)'));
    if (!grid) return null;
    const r = grid.getBoundingClientRect();
    return { x: r.x - 30, y: r.y - 30, width: r.width + 60, height: r.height + 60 };
  });
  if (cards) {
    await page.screenshot({ path: 'tmp_two_cards.png', clip: cards });
  }
  await browser.close();
  console.log('saved: tmp_two_cards.png');
})();
