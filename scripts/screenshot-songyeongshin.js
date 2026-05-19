const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('https://www.geo-aio.com/proposal/%EC%86%A1%EC%98%81%EC%8B%A0%EB%AA%A9%EC%9E%A5?nocache=' + Date.now(), {
    waitUntil: 'networkidle0', timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 1500));
  // 상단 영역 (히어로 + 액션바) 캡쳐
  await page.screenshot({ path: 'tmp_songyeong_top.png', clip: { x: 0, y: 0, width: 1440, height: 600 } });
  // PDF 버튼 노드 확인
  const btnState = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pdfBtn = buttons.find(b => b.textContent?.includes('PDF로 저장'));
    if (!pdfBtn) return { found: false };
    const rect = pdfBtn.getBoundingClientRect();
    const cs = getComputedStyle(pdfBtn);
    return {
      found: true,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      visibility: cs.visibility,
      display: cs.display,
      opacity: cs.opacity,
      hidden: pdfBtn.hidden,
      offsetParent: pdfBtn.offsetParent ? 'in flow' : 'out of flow',
    };
  });
  console.log('PDF 버튼 상태:', JSON.stringify(btnState, null, 2));
  await browser.close();
})();
