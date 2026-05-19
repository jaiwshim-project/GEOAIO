const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('🚀 LinkedIn Developer Portal — OpenID Connect 추가');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: 'C:/Users/USER/AppData/Local/Google/Chrome/User Data',
    headless: false,
    pipe: true,
    args: ['--no-sandbox', '--window-size=1400,900', '--profile-directory=Default', '--no-first-run'],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();

  try {
    console.log('Products 탭 접속...');
    await page.goto('https://www.linkedin.com/developers/apps/86yy8gbn2esw7e/products', {
      waitUntil: 'networkidle0', timeout: 60000
    });
    await sleep(3000);
    console.log('URL:', page.url());

    // 로그인 필요 시 대기
    if (page.url().includes('login') || page.url().includes('authwall')) {
      console.log('⚠ 로그인 필요 — 브라우저에서 로그인 후 Enter...');
      await new Promise(r => { process.stdin.once('data', r); process.stdin.resume(); });
      await page.goto('https://www.linkedin.com/developers/apps/86yy8gbn2esw7e/products', {
        waitUntil: 'networkidle0', timeout: 60000
      });
      await sleep(3000);
    }

    // 스크린샷
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/li-products.png' });
    console.log('📸 스크린샷 저장');

    // "Sign In with LinkedIn using OpenID Connect" Request access 버튼 찾기
    const clicked = await page.evaluate(() => {
      const sections = document.querySelectorAll('section, .developer-product, li, [class*="product"]');
      for (const section of sections) {
        if (section.textContent?.includes('Sign In with LinkedIn using OpenID Connect') ||
            section.textContent?.includes('OpenID Connect')) {
          const btn = section.querySelector('button');
          if (btn && (btn.textContent?.includes('Request') || btn.textContent?.includes('Add') || btn.textContent?.includes('Select'))) {
            btn.click();
            return 'clicked: ' + btn.textContent.trim();
          }
          // 이미 추가된 경우
          if (section.textContent?.includes('Added') || section.textContent?.includes('Active')) {
            return 'already_added';
          }
          return 'found_no_button: ' + section.textContent?.trim().substring(0, 100);
        }
      }
      // 모든 버튼 텍스트 출력
      const btns = [...document.querySelectorAll('button')].map(b => b.textContent?.trim()).filter(Boolean);
      return 'no_match. buttons: ' + btns.slice(0, 10).join(' | ');
    });
    console.log('결과:', clicked);
    await sleep(3000);

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/li-products-after.png' });

    // 확인 팝업 처리
    if (clicked.includes('clicked')) {
      const confirmed = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button, [role="button"]')];
        const ok = btns.find(b => b.textContent?.includes('I understand') || b.textContent?.includes('Agree') || b.textContent?.includes('동의') || b.textContent?.includes('확인') || b.textContent?.includes('OK'));
        if (ok) { ok.click(); return 'confirmed: ' + ok.textContent.trim(); }
        return 'no_confirm_btn';
      });
      console.log('확인 팝업:', confirmed);
      await sleep(3000);
    }

    // 최종 상태 확인
    const status = await page.evaluate(() => {
      const body = document.body.innerText;
      if (body.includes('Sign In with LinkedIn using OpenID Connect')) {
        const idx = body.indexOf('Sign In with LinkedIn using OpenID Connect');
        return body.substring(idx, idx + 200);
      }
      return 'OpenID 섹션 없음';
    });
    console.log('\n최종 상태:', status.substring(0, 150));
    console.log('\n✅ 완료. 브라우저를 확인하세요.');
    await sleep(10000);

  } finally {
    await browser.close();
  }
})().catch(e => { console.error('오류:', e.message); process.exit(1); });
