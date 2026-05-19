// election-2026 페이지의 양자 대결 섹션 캡쳐 — 디자인 검토용
const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // site-password 통과
  await page.goto('https://www.geo-aio.com/site-password?next=/proposal/election-2026', {
    waitUntil: 'networkidle0', timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 1000));
  const pw = await page.$('input[type="password"]');
  if (pw) {
    await pw.click({ clickCount: 3 });
    await pw.type('963314', { delay: 30 });
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3500));
  }
  console.log('current URL:', page.url());

  // 직접 election-2026 이동 (cache busting)
  await page.goto('https://www.geo-aio.com/proposal/election-2026?_=' + Date.now(), {
    waitUntil: 'networkidle0', timeout: 45000,
  });
  await new Promise(r => setTimeout(r, 2500));
  console.log('final URL:', page.url());

  // 양자 대결 섹션(Section 2)으로 스크롤 이동 + 위치 측정
  const pos = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2'));
    const target = headings.find(h => h.textContent && h.textContent.includes('후보자별 맞춤'));
    if (!target) {
      // 영문 폴백
      const enTarget = headings.find(h => h.textContent && h.textContent.includes('Head-to-Head'));
      if (enTarget) {
        const sec = enTarget.closest('section');
        const r = sec ? sec.getBoundingClientRect() : enTarget.getBoundingClientRect();
        window.scrollBy(0, r.top - 50);
        return { found: 'en', y: r.top, height: r.height };
      }
      return null;
    }
    const sec = target.closest('section');
    const r = sec ? sec.getBoundingClientRect() : target.getBoundingClientRect();
    window.scrollBy(0, r.top - 50);
    return { found: 'ko', y: r.top, height: r.height };
  });
  console.log('section pos:', pos);
  await new Promise(r => setTimeout(r, 800));

  // 스크롤 후 섹션 전체 캡쳐
  await page.screenshot({ path: 'tmp_election_pair_view1.png', fullPage: false });
  console.log('saved tmp_election_pair_view1.png');

  // 섹션 element 단독 캡쳐 — 큰 페이지를 fullPage로 받고 그 안 섹션 영역만 잘라냄
  // viewport 단일 캡쳐는 height 잘림 → page.screenshot({ fullPage: true })로 받은 후 PIL식으로
  // 여기서는 단순화: 페이지 viewport 높이를 늘려서 한 번에 보기
  await page.setViewport({ width: 1440, height: 2200, deviceScaleFactor: 1 });
  // 다시 위치 측정
  const elClip = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2'));
    const target = headings.find(h => h.textContent && (h.textContent.includes('후보자별 맞춤') || h.textContent.includes('Head-to-Head')));
    if (!target) return null;
    const sec = target.closest('section');
    if (!sec) return null;
    // 섹션 위치 다시 측정 — 스크롤 0 기준
    window.scrollTo(0, 0);
    const r = sec.getBoundingClientRect();
    return { x: Math.max(0, r.left), y: Math.max(0, r.top + window.scrollY), width: Math.min(1440, r.width), height: r.height };
  });
  if (elClip && elClip.height > 0) {
    await page.screenshot({ path: 'tmp_election_pair_section.png', clip: elClip });
    console.log('saved tmp_election_pair_section.png  (clip:', elClip, ')');
  }

  await browser.close();
})();
