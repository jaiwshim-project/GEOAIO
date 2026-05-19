// axbiz 포스트 5번 카테고리 수정 (AX 비즈)
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLOG_ID = 'axbiz';
const EMAIL = 'jaiwshim@paran.com';
const PASSWORD = 'ro9633ke14!!';
const POST_ID = 5;

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
    // 로그인
    await page.goto(`https://${BLOG_ID}.tistory.com/manage`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
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
    console.log('✅ 로그인 완료');

    // 편집 페이지
    const editUrl = `https://${BLOG_ID}.tistory.com/manage/newpost/${POST_ID}`;
    console.log(`\n▶ 포스트 ${POST_ID} 편집: ${editUrl}`);
    await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(6000);

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-edit-loaded.png' });

    // 카테고리 버튼 클릭
    console.log('\n▶ 카테고리 드롭다운 열기...');
    const catBtn = await page.$('#category-btn');
    if (catBtn) {
      const currentCat = await page.evaluate(el => el.textContent.trim(), catBtn);
      console.log('  현재 카테고리:', currentCat);
      await catBtn.click();
      await sleep(2000); // 드롭다운 로딩 대기
      await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-cat-open.png' });

      // 드롭다운 항목 확인
      const dropdownItems = await page.evaluate(() => {
        // 열린 드롭다운 찾기
        const openMenu = document.querySelector('[class*="open"], [class*="show"], [class*="active"], .mce-open, .mce-menu');
        const allDropdowns = [...document.querySelectorAll('li[data-id], li[data-value], ul[role="listbox"] li, .mce-menu-item')];
        return {
          openMenuClass: openMenu ? openMenu.className.slice(0, 80) : 'none',
          items: allDropdowns.map(el => ({ text: el.textContent.trim(), dataId: el.dataset.id || el.dataset.value, cls: el.className.slice(0, 50) })).slice(0, 15),
          allLists: [...document.querySelectorAll('ul')].filter(ul => ul.children.length > 0 && ul.children.length < 20).map(ul => ({
            cls: ul.className.slice(0, 50),
            items: [...ul.children].map(li => li.textContent.trim()).slice(0, 10),
          })).slice(0, 5),
        };
      });
      console.log('  드롭다운 항목:', JSON.stringify(dropdownItems, null, 2));

      // AX 비즈 클릭 (mce-menu-item 정확한 셀렉터 사용)
      const catResult = await page.evaluate(() => {
        const menuItems = [...document.querySelectorAll('.mce-menu-item')];
        const axBiz = menuItems.find(el => {
          const t = el.textContent.trim();
          return t === '1. AX 비즈' || t === 'AX 비즈';
        });
        if (axBiz) {
          axBiz.click();
          return 'clicked:' + axBiz.textContent.trim();
        }
        return 'not-found:' + menuItems.map(el => el.textContent.trim().slice(0, 20)).join('|');
      });
      console.log('  선택 결과:', catResult);

      if (catResult.includes('not-found')) {
        console.log('\n⚠ 카테고리 자동 선택 실패 — 스크린샷 확인 후 수동 선택이 필요합니다');
        await sleep(10000);
      } else {
        await sleep(500);
        const catBtnText = await page.evaluate(el => el.textContent.trim(), catBtn);
        console.log('  카테고리 버튼 텍스트 갱신:', catBtnText);
      }
    }

    // 발행 패널 열기
    console.log('\n▶ 발행 패널...');
    const pubHandle = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '완료' || b.id === 'publish-layer-btn')
    );
    const pubEl = pubHandle.asElement();
    if (pubEl) {
      await pubEl.click();
      await sleep(2000);
      // 공개 선택 (이미 공개일 수 있음)
      await page.evaluate(() => {
        const radios = [...document.querySelectorAll('input[type="radio"]')];
        for (const r of radios) {
          const label = document.querySelector(`label[for="${r.id}"]`);
          if (label?.textContent.trim() === '공개') { r.click(); return; }
        }
      });
      await sleep(500);
      const publishBtn = await page.$('#publish-btn');
      if (publishBtn) {
        const t = await page.evaluate(el => el.textContent.trim(), publishBtn);
        await publishBtn.click();
        console.log(`  ✅ "${t}" 클릭`);
        await sleep(4000);
      }
    }

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-cat-fixed.png' });
    console.log('최종 URL:', page.url());
    console.log('\n🎉 완료!');

  } catch (e) {
    console.error('오류:', e.message);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-cat-error.png' }).catch(() => {});
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
