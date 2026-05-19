const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto('https://www.geo-aio.com/pricing?nocache=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'tmp_pricing_full.png', fullPage: true });
  // 맥스 카드 영역만
  const maxCard = await page.evaluateHandle(() => {
    const all = Array.from(document.querySelectorAll('div'));
    return all.find(d => d.textContent?.includes('맥스 (Max)') && d.querySelector('button'));
  });
  if (maxCard) {
    const box = await maxCard.boundingBox();
    if (box) {
      await page.screenshot({ path: 'tmp_pricing_max.png', clip: { x: box.x - 10, y: box.y - 30, width: Math.min(box.width + 20, 1440), height: Math.min(box.height + 60, 1200) } });
    }
  }
  await browser.close();
  console.log('saved: tmp_pricing_full.png, tmp_pricing_max.png');
})();
