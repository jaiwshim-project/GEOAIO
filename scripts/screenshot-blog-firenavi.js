// 블로그 카테고리 페이지(화이어내비) 스크린샷 + 폰트 굵기 검사
const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const url = 'https://www.geo-aio.com/blog/category/%ED%99%94%EC%9D%B4%EC%96%B4%EB%82%B4%EB%B9%84?nocache=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  // 전체 + 상단 일부 캡쳐
  await page.screenshot({ path: 'tmp_blog_firenavi_top.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await page.screenshot({ path: 'tmp_blog_firenavi_full.png', fullPage: true });

  // 주요 텍스트 노드별 폰트 굵기 진단
  const fontWeights = await page.evaluate(() => {
    const targets = [
      { sel: 'h1', name: 'H1' },
      { sel: 'h2', name: 'H2' },
      { sel: 'h3', name: 'H3 (포스트 제목)' },
      { sel: 'p', name: 'p (본문/설명)' },
      { sel: 'span', name: 'span (뱃지·태그)' },
      { sel: 'a', name: 'a (링크)' },
      { sel: 'button', name: 'button' },
    ];
    const result = {};
    for (const { sel, name } of targets) {
      const els = Array.from(document.querySelectorAll(sel)).slice(0, 8);
      result[name] = els.map(el => ({
        text: (el.textContent || '').slice(0, 30).trim(),
        weight: getComputedStyle(el).fontWeight,
        cls: el.className.slice(0, 60),
      })).filter(x => x.text.length > 0);
    }
    return result;
  });
  console.log('=== 폰트 굵기 진단 ===');
  console.log(JSON.stringify(fontWeights, null, 2));

  await browser.close();
})();
