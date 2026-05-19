// 비공개 포스트를 공개로 전환 + 기존 포스트 백링크 확인
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BLOG_ID = 'metabiz101';
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
    // 로그인
    await page.goto('https://www.tistory.com/auth/login', { waitUntil: 'networkidle0' });
    await sleep(1500);
    const kakaoEl = await page.evaluateHandle(() =>
      [...document.querySelectorAll('a,button')].find(el => el.textContent.includes('카카오'))
    );
    if (kakaoEl.asElement()) { await kakaoEl.asElement().click(); await sleep(3000); }

    if (page.url().includes('kakao') || page.url().includes('accounts')) {
      const em = await page.$('input#loginId--1,input[name="loginId"],input[type="email"]');
      if (em) { await em.click({ clickCount: 3 }); await em.type(EMAIL, { delay: 50 }); }
      const pw = await page.$('input#password--2,input[name="password"],input[type="password"]');
      if (pw) { await pw.click({ clickCount: 3 }); await pw.type(PASSWORD, { delay: 50 }); }
      const sub = await page.$('button[type="submit"]');
      if (sub) { await sub.click(); await sleep(4000); }
    }
    console.log('로그인 URL:', page.url());

    // 포스트 목록에서 최근 비공개 글 찾기
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/posts`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // 최근 비공개 글의 편집 링크 찾기
    const draftLink = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('tr, .post-item, li')];
      for (const row of rows) {
        if (row.textContent.includes('GEO-AIO.com') && row.textContent.includes('비공개')) {
          const link = row.querySelector('a[href*="newpost"], a[href*="edit"]');
          return link ? link.href : null;
        }
      }
      // 목록에서 모든 링크 확인
      const allLinks = [...document.querySelectorAll('a')];
      for (const a of allLinks) {
        if (a.textContent.includes('GEO-AIO.com')) return a.href;
      }
      return null;
    });
    console.log('비공개 포스트 링크:', draftLink);

    // 관리 목록 스크린샷
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/manage-posts.png' });

    // 비공개 글 편집 페이지로 이동
    if (draftLink) {
      await page.goto(draftLink, { waitUntil: 'networkidle0' });
    } else {
      // 직접 URL 시도 (숫자 ID 최신 글 찾기)
      await page.goto(`https://${BLOG_ID}.tistory.com/manage/posts?type=private`, { waitUntil: 'networkidle0' });
      await sleep(2000);
      await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/private-posts.png' });

      const editLink = await page.evaluate(() => {
        const links = [...document.querySelectorAll('a[href*="newpost"]')];
        return links[0]?.href;
      });
      if (editLink) {
        console.log('편집 링크:', editLink);
        await page.goto(editLink, { waitUntil: 'networkidle0' });
      }
    }
    await sleep(3000);
    console.log('편집 URL:', page.url());

    // 발행 버튼 클릭
    const pubBtn = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('발행') || b.id === 'publish-layer-btn')
    );
    const pub = pubBtn.asElement();
    if (pub) {
      await pub.click();
      await sleep(2000);
      console.log('발행 패널 열림');

      // "공개" 라디오 버튼 클릭
      const publicRadio = await page.$('input[type="radio"][value="0"], input[type="radio"][id*="public"]');
      if (publicRadio) {
        await publicRadio.click();
        console.log('공개 선택');
      } else {
        // 텍스트로 찾기
        await page.evaluate(() => {
          const labels = [...document.querySelectorAll('label, span, div')];
          const publicLabel = labels.find(l => l.textContent.trim() === '공개' && !l.textContent.includes('보호'));
          if (publicLabel) publicLabel.click();
        });
        console.log('공개 라벨 클릭');
      }
      await sleep(1000);

      // 발행 저장 버튼
      const saveBtn = await page.evaluateHandle(() => {
        const btns = [...document.querySelectorAll('button')];
        return btns.find(b => b.textContent.includes('발행') || b.textContent.includes('공개 저장') || b.textContent.includes('완료'));
      });
      const save = saveBtn.asElement();
      if (save) {
        await save.click();
        console.log('✅ 공개 발행 완료');
        await sleep(3000);
      }
    }

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/publish-done.png' });
    console.log('최종 URL:', page.url());

    // 기존 포스트 백링크 확인
    console.log('\n▶ 포스트 6990892 백링크 확인...');
    await page.goto(`https://${BLOG_ID}.tistory.com/6990892`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    const hasBacklink = await page.evaluate(() =>
      document.body.innerHTML.includes('geo-aio.com')
    );
    console.log('백링크 포함 여부:', hasBacklink ? '✅ 확인' : '❌ 없음');
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/post-6990892-check.png' });

    console.log('\n🎉 작업 완료!');
  } catch (e) {
    console.error('오류:', e.message);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/publish-error.png' });
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
