#!/usr/bin/env node
/**
 * LinkedIn Developer App 자동 생성 스크립트
 * - 기존 Chrome 프로필(LinkedIn 세션)을 재사용
 * - App 생성 → Share on LinkedIn 추가 → Redirect URL 설정 → Client ID/Secret 저장
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_USER_DATA = 'C:/Users/USER/AppData/Local/Google/Chrome/User Data';
const CHROME_EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const REDIRECT_URI = 'https://www.geo-aio.com/api/linkedin/callback';
const APP_NAME = 'GEO-AIO Publisher';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('🚀 LinkedIn Developer App 자동 생성 시작\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_EXE,
    userDataDir: CHROME_USER_DATA,
    headless: false,
    pipe: true,
    args: [
      '--no-sandbox',
      '--window-size=1400,900',
      '--profile-directory=Default',
      '--disable-features=TranslateUI',
      '--no-first-run',
      '--no-default-browser-check',
    ],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    // 1. LinkedIn Developer Portal 접속
    console.log('1️⃣  LinkedIn Developer Portal 접속...');
    await page.goto('https://www.linkedin.com/developers/apps/new', { waitUntil: 'networkidle0' });
    await sleep(3000);

    // 로그인 여부 확인
    if (page.url().includes('login') || page.url().includes('authwall')) {
      console.log('  ⚠ 로그인 필요 — 브라우저에서 LinkedIn에 로그인 후 Enter를 누르세요...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
        process.stdin.resume();
      });
      await page.goto('https://www.linkedin.com/developers/apps/new', { waitUntil: 'networkidle0' });
      await sleep(3000);
    }

    console.log('  URL:', page.url());

    // 2. 앱 이름 입력
    console.log('\n2️⃣  앱 이름 입력...');
    const appNameSel = 'input[name="appName"], input[id*="appName"], input[placeholder*="App name"], input[placeholder*="앱 이름"]';
    await page.waitForSelector(appNameSel, { timeout: 15000 }).catch(() => {});
    const appNameEl = await page.$(appNameSel);
    if (appNameEl) {
      await appNameEl.click({ clickCount: 3 });
      await appNameEl.type(APP_NAME, { delay: 50 });
      console.log('  ✅ 앱 이름:', APP_NAME);
    } else {
      console.log('  ⚠ 앱 이름 필드 못 찾음. 현재 URL:', page.url());
    }
    await sleep(1000);

    // 3. Company Page 선택 (첫 번째 항목 또는 검색)
    console.log('\n3️⃣  Company 선택...');
    const companyInput = await page.$('input[name*="company"], input[placeholder*="company"], input[placeholder*="Company"], input[id*="company"]');
    if (companyInput) {
      await companyInput.click();
      await sleep(1500);
      // 드롭다운에서 첫 번째 항목 선택
      const firstOption = await page.$('[role="option"], .typeahead-option, li.option');
      if (firstOption) {
        await firstOption.click();
        console.log('  ✅ 첫 번째 Company 선택');
      } else {
        console.log('  ⚠ Company 드롭다운 항목 없음 — 수동 선택 필요');
      }
    }
    await sleep(1000);

    // 4. Logo URL (선택사항 — 건너뜀)
    // 5. Terms 동의 체크박스
    console.log('\n4️⃣  이용약관 동의...');
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      const checked = await checkbox.evaluate((el) => el.checked);
      if (!checked) {
        await checkbox.click();
        console.log('  ✅ 체크박스 체크');
      }
    }
    await sleep(800);

    // 6. 앱 생성 버튼 클릭
    console.log('\n5️⃣  앱 생성 버튼 클릭...');
    const createBtn = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find(b =>
        b.textContent?.includes('Create app') || b.textContent?.includes('앱 만들기') || b.type === 'submit'
      )
    );
    const createEl = createBtn?.asElement?.();
    if (createEl) {
      await createEl.click();
      console.log('  ✅ 생성 버튼 클릭');
    } else {
      console.log('  ⚠ 생성 버튼 못 찾음 — 수동으로 클릭 후 Enter...');
      await new Promise(resolve => { process.stdin.once('data', resolve); process.stdin.resume(); });
    }

    await sleep(5000);
    console.log('  현재 URL:', page.url());

    // 7. Products 탭 → Share on LinkedIn 추가
    console.log('\n6️⃣  Products 탭 → Share on LinkedIn 추가...');
    const productsTab = await page.evaluateHandle(() =>
      [...document.querySelectorAll('a, button, [role="tab"]')].find(el =>
        el.textContent?.trim() === 'Products' || el.textContent?.includes('Products')
      )
    );
    const productsEl = productsTab?.asElement?.();
    if (productsEl) {
      await productsEl.click();
      await sleep(3000);
      console.log('  ✅ Products 탭 클릭');
    }

    // "Share on LinkedIn" 항목 찾아 Request access 클릭
    const shareBtn = await page.evaluateHandle(() => {
      const items = [...document.querySelectorAll('*')];
      for (const el of items) {
        if (el.textContent?.includes('Share on LinkedIn')) {
          // 같은 섹션의 버튼 찾기
          const section = el.closest('section, .product-card, li, div[class*="product"]');
          if (section) {
            const btn = section.querySelector('button');
            if (btn) return btn;
          }
        }
      }
      return null;
    });
    const shareEl = shareBtn?.asElement?.();
    if (shareEl) {
      await shareEl.click();
      await sleep(3000);
      console.log('  ✅ Share on LinkedIn 요청 클릭');

      // 확인 팝업이 있으면 확인
      const confirmBtn = await page.evaluateHandle(() =>
        [...document.querySelectorAll('button')].find(b =>
          b.textContent?.includes('I understand') || b.textContent?.includes('Agree') || b.textContent?.includes('동의') || b.textContent?.includes('확인')
        )
      );
      const confirmEl = confirmBtn?.asElement?.();
      if (confirmEl) { await confirmEl.click(); await sleep(2000); }
    } else {
      console.log('  ⚠ Share on LinkedIn 버튼 못 찾음');
    }

    // 8. Auth 탭 → Redirect URL 설정
    console.log('\n7️⃣  Auth 탭 → Redirect URL 설정...');
    const authTab = await page.evaluateHandle(() =>
      [...document.querySelectorAll('a, button, [role="tab"]')].find(el =>
        el.textContent?.trim() === 'Auth' || el.textContent?.includes('Auth')
      )
    );
    const authEl = authTab?.asElement?.();
    if (authEl) {
      await authEl.click();
      await sleep(3000);
      console.log('  ✅ Auth 탭 클릭');
    }

    // Redirect URL 입력
    const redirectInput = await page.$('input[placeholder*="redirect"], input[name*="redirect"], input[id*="redirect"]');
    if (redirectInput) {
      await redirectInput.click({ clickCount: 3 });
      await redirectInput.type(REDIRECT_URI, { delay: 30 });
      await page.keyboard.press('Enter');
      await sleep(2000);
      console.log('  ✅ Redirect URI 추가:', REDIRECT_URI);
    } else {
      // "Add redirect URL" 버튼 클릭 후 입력
      const addBtn = await page.evaluateHandle(() =>
        [...document.querySelectorAll('button')].find(b =>
          b.textContent?.includes('Add redirect') || b.textContent?.includes('Redirect') || b.textContent?.includes('URL')
        )
      );
      const addEl = addBtn?.asElement?.();
      if (addEl) {
        await addEl.click();
        await sleep(1500);
        const input = await page.$('input[type="text"], input[placeholder*="https"]');
        if (input) {
          await input.type(REDIRECT_URI, { delay: 30 });
          await page.keyboard.press('Enter');
          await sleep(1500);
          console.log('  ✅ Redirect URI 추가:', REDIRECT_URI);
        }
      }
    }

    // Update 버튼 클릭
    const updateBtn = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find(b =>
        b.textContent?.includes('Update') || b.textContent?.includes('Save') || b.textContent?.includes('저장')
      )
    );
    const updateEl = updateBtn?.asElement?.();
    if (updateEl) { await updateEl.click(); await sleep(2000); }

    // 9. Client ID / Client Secret 추출
    console.log('\n8️⃣  Client ID / Client Secret 추출...');
    await sleep(2000);

    const credentials = await page.evaluate(() => {
      const text = document.body.innerText;
      const idMatch = text.match(/Client ID[\s\S]{0,50}?([a-zA-Z0-9]{12,32})/);
      const secretMatch = text.match(/Client Secret[\s\S]{0,50}?([a-zA-Z0-9]{12,32})/);
      return {
        clientId: idMatch?.[1] || null,
        clientSecret: secretMatch?.[1] || null,
        allText: text.substring(0, 2000),
      };
    });

    // 화면에서 직접 읽기 시도
    const clientIdEl = await page.$('[data-test-id="client-id"], input[value][readonly], code');
    if (clientIdEl) {
      const val = await clientIdEl.evaluate(el => el.textContent || el.value);
      if (val) credentials.clientId = val.trim();
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (credentials.clientId) {
      console.log('✅ Client ID:', credentials.clientId);
    } else {
      console.log('⚠ Client ID를 자동으로 읽지 못했습니다.');
      console.log('   브라우저에서 Auth 탭을 열어 수동으로 확인하세요.');
    }
    if (credentials.clientSecret) {
      console.log('✅ Client Secret:', credentials.clientSecret);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 스크린샷 저장
    const ssPath = path.join(__dirname, 'linkedin-app-created.png');
    await page.screenshot({ path: ssPath, fullPage: false });
    console.log('📸 스크린샷:', ssPath);

    if (credentials.clientId && credentials.clientSecret) {
      // .env.local에 저장
      const envPath = path.join(__dirname, '..', '.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/\nLINKEDIN_CLIENT_ID=.+/g, '');
      envContent = envContent.replace(/\nLINKEDIN_CLIENT_SECRET=.+/g, '');
      envContent += `\nLINKEDIN_CLIENT_ID="${credentials.clientId}"\n`;
      envContent += `LINKEDIN_CLIENT_SECRET="${credentials.clientSecret}"\n`;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env.local에 저장 완료');
    }

    console.log('\n⏳ 30초 후 브라우저 닫힘 (직접 닫아도 됩니다)...');
    await sleep(30000);

  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
});
