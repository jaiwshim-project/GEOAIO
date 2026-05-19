// axbiz.tistory.com 카테고리 확인
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLOG_ID = 'axbiz';
const EMAIL = 'jaiwshim@paran.com';
const PASSWORD = 'ro9633ke14!!';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    // 관리 페이지 접속
    await page.goto(`https://${BLOG_ID}.tistory.com/manage`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // 로그인 필요 시
    if (page.url().includes('login') || page.url().includes('auth')) {
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
      for (let i = 0; i < 3; i++) {
        if (page.url().includes('consent') || page.url().includes('agreement')) {
          const btn = await page.evaluateHandle(() =>
            [...document.querySelectorAll('button,a')].find(el => el.textContent.includes('동의') || el.textContent.includes('확인'))
          );
          const el = btn.asElement();
          if (el) { await el.click(); await sleep(3000); } else break;
        } else break;
      }
    }
    console.log('✅ 로그인, URL:', page.url());

    // 새 포스트 작성 페이지로 이동 (카테고리 드롭다운 확인)
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/newpost/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(6000);
    console.log('편집 URL:', page.url());

    // 카테고리 버튼 확인
    const catInfo = await page.evaluate(() => {
      // 카테고리 버튼 클릭
      const catBtn = document.querySelector('#category-btn, [id*="category"]');
      if (catBtn) catBtn.click();
      return {
        catBtn: catBtn ? catBtn.textContent.trim() : '없음',
      };
    });
    console.log('카테고리 버튼:', catInfo.catBtn);
    await sleep(1500);

    // 카테고리 목록 추출
    const categories = await page.evaluate(() => {
      const items = [...document.querySelectorAll('[class*="category"] li, [class*="category"] option, ul li')];
      const catItems = items.filter(el => {
        const text = el.textContent.trim();
        return text && text.length < 50 && text !== '' && !el.closest('header') && !el.closest('nav');
      });
      return catItems.map(el => ({
        text: el.textContent.trim(),
        id: el.dataset.id || el.value || '',
        class: el.className.slice(0, 50),
      })).slice(0, 20);
    });
    console.log('\n카테고리 목록:', JSON.stringify(categories, null, 2));

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-categories.png' });

    // 카테고리 관리 페이지도 확인
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/category`, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    const catManage = await page.evaluate(() => {
      const items = [...document.querySelectorAll('[class*="category"], li')];
      return items
        .filter(el => el.textContent.trim() && el.textContent.trim().length < 40)
        .map(el => el.textContent.trim())
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 20);
    });
    console.log('\n카테고리 관리 목록:', JSON.stringify(catManage, null, 2));
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-cat-manage.png' });

  } catch (e) {
    console.error('오류:', e.message);
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
