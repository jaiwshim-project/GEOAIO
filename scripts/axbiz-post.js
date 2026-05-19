// axbiz.tistory.com에 GEO-AIO 허브 포스트 발행
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLOG_ID = 'axbiz';
const EMAIL = 'jaiwshim@paran.com';
const PASSWORD = 'ro9633ke14!!';

const GEO_AIO_LINKS = [
  { title: 'GEO-AIO 키워드 경쟁 분석으로 AI Overview 노출 3배 늘린 실제 사례', url: 'https://www.geo-aio.com/blog/94cbf7bb-db6e-40c2-94e3-a51dc108d6fb' },
  { title: 'AI 검색 시대, 당신의 키워드가 Overview에 안 떠오르는 진짜 이유', url: 'https://www.geo-aio.com/blog/0f5f4bd1-4209-4d3b-a4f7-073a1d329b79' },
  { title: 'GEO-AIO 키워드 경쟁 분석 완벽 가이드: AI Overview 노출 확률 높이는 전문가 분석', url: 'https://www.geo-aio.com/blog/d848e660-aa3b-49d6-aefc-a985f8a7b8fe' },
  { title: 'GEO vs 기존 SEO: 3개 기업 ROI 비교 — 실제 성과 수치', url: 'https://www.geo-aio.com/blog/3c3e9776-3211-40ab-ad43-6ca9db3327d0' },
  { title: 'AI Overview 노출 오해 5가지: GEO 키워드 경쟁 분석으로 진짜 답을 찾다', url: 'https://www.geo-aio.com/blog/e4129908-5d2c-406d-a39c-6d23c889b656' },
  { title: 'GEO 도입 전 놓치면 안 되는 점검 15가지 — AI 검색엔진 최적화 체크리스트', url: 'https://www.geo-aio.com/blog/2785f251-80a3-461f-bcb5-22b4485bf628' },
  { title: 'GEO-AIO vs 기존 SEO 도구: AI Overview 노출률 높이는 비교분석', url: 'https://www.geo-aio.com/blog/deae82a3-2a17-4050-a078-52aaebd499b6' },
];

const bodyHtml = `<p>AI Overview, Perplexity, ChatGPT 등 생성형 AI 검색에서 콘텐츠가 인용되도록 최적화하는 GEO(Generative Engine Optimization) 기법을 총정리합니다.</p>
<h2>GEO-AIO 핵심 글 모음</h2>
${GEO_AIO_LINKS.map(l => `<p>→ <a href="${l.url}" target="_blank" rel="noopener"><strong>${l.title}</strong></a></p>`).join('\n')}
<h2>GEO-AIO란?</h2>
<p>GEO-AIO(Generative Engine Optimization)는 Google AI Overview, Perplexity, ChatGPT 등 생성형 AI 검색 엔진이 답변을 생성할 때 특정 콘텐츠를 출처로 인용하도록 최적화하는 기법입니다. 기존 SEO가 검색 결과 순위를 높이는 데 집중했다면, GEO는 AI가 답변 생성 시 해당 콘텐츠를 선택하는 신뢰도와 구조를 강화합니다.</p>
<h2>AI 인용률 높이는 핵심 원칙</h2>
<ul>
<li>질문형 헤딩 + 첫 단락에 직접 답변 배치 (TL;DR)</li>
<li>E-E-A-T 신호 강화 — 저자 경력, 날짜, 출처 링크 명시</li>
<li>FAQ Schema.org 구조화 데이터 삽입</li>
<li>수치·통계·명확한 정의 포함</li>
</ul>
<p>📊 GEO-AIO 대시보드: <a href="https://www.geo-aio.com" target="_blank" rel="noopener"><strong>www.geo-aio.com</strong></a></p>
<p>📝 블로그 전체 목록: <a href="https://www.geo-aio.com/blog/category/geo-aio" target="_blank" rel="noopener">www.geo-aio.com/blog/category/geo-aio</a></p>`;

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
    // 1. 로그인
    await page.goto(`https://${BLOG_ID}.tistory.com/manage`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    if (page.url().includes('login') || page.url().includes('auth')) {
      console.log('▶ 카카오 로그인...');
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

    // 2. 새 포스트 페이지
    console.log('\n▶ 새 포스트 편집기 접속...');
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/newpost/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(6000);
    console.log('  편집기 URL:', page.url());

    // 3. 카테고리 선택 (AX 비즈)
    console.log('\n▶ 카테고리 선택...');
    const catBtn = await page.$('#category-btn, [id*="category-btn"], button[class*="category"]');
    if (catBtn) {
      await catBtn.click();
      console.log('  카테고리 버튼 클릭');
      await sleep(1500);

      // 드롭다운에서 "AX 비즈" 선택 (mce-menu-item 사용)
      const catSelected = await page.evaluate(() => {
        const menuItems = [...document.querySelectorAll('.mce-menu-item')];
        const axBiz = menuItems.find(el => el.textContent.trim() === '1. AX 비즈' || el.textContent.trim() === 'AX 비즈');
        if (axBiz) {
          axBiz.click();
          return '1. AX 비즈 선택';
        }
        return 'not-found:' + menuItems.map(el => el.textContent.trim().slice(0, 20)).join('|');
      });
      console.log('  카테고리 선택 결과:', catSelected);

      if (catSelected.includes('not-found')) {
        // 카테고리 목록 더 넓게 검색
        await sleep(500);
        const allItems = await page.evaluate(() => {
          return [...document.querySelectorAll('li, option')].filter(el => {
            const t = el.textContent.trim();
            return t.includes('AX') || t.includes('비즈') || t.includes('SEO') || t.includes('AI');
          }).map(el => ({ text: el.textContent.trim(), tag: el.tagName, cls: el.className.slice(0, 50) }));
        });
        console.log('  AX/비즈 항목:', JSON.stringify(allItems));
        await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-cat-dropdown.png' });
      }
    } else {
      console.log('  ⚠ 카테고리 버튼 없음 — 화면 캡쳐');
      await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-no-cat-btn.png' });
    }
    await sleep(1000);

    // 4. 제목 입력
    console.log('\n▶ 제목 입력...');
    const titleSel = '[placeholder*="제목"], .editor-title, input#title';
    await page.waitForSelector(titleSel, { timeout: 10000 }).catch(() => {});
    const titleEl = await page.$(titleSel);
    if (titleEl) {
      await titleEl.click({ clickCount: 3 });
      await titleEl.type('GEO-AIO.com — AI 검색 인용 최적화 완전 가이드 총정리', { delay: 40 });
      console.log('  ✅ 제목 입력');
    } else {
      // 제목 영역 찾기 (텍스트 입력 가능한 div)
      const titleDiv = await page.evaluate(() => {
        const el = document.querySelector('[contenteditable][placeholder*="제목"], [data-placeholder*="제목"]');
        return el ? el.className : null;
      });
      console.log('  제목 div:', titleDiv);
    }
    await sleep(1000);

    // 5. 본문 TinyMCE API로 삽입
    console.log('\n▶ 본문 삽입...');
    await sleep(2000);

    const editorInfo = await page.evaluate(() => ({
      hasTinyMCE: !!window.tinyMCE,
      activeEditor: !!(window.tinyMCE?.activeEditor),
      editorId: window.tinyMCE?.activeEditor?.id,
    }));
    console.log('  에디터:', JSON.stringify(editorInfo));

    const insertResult = await page.evaluate((html) => {
      // TinyMCE API
      const editor = window.tinyMCE?.activeEditor || window.tinymce?.activeEditor;
      if (editor) {
        editor.setContent(html);
        editor.save();
        return 'tinymce:' + editor.id;
      }
      // contenteditable 폴백
      const editables = [...document.querySelectorAll('[contenteditable="true"]')];
      const mainEditor = editables.find(el => el.className.includes('content') || el.tagName === 'DIV');
      if (mainEditor) {
        mainEditor.innerHTML = html;
        mainEditor.dispatchEvent(new Event('input', { bubbles: true }));
        return 'contenteditable';
      }
      return 'not-inserted';
    }, bodyHtml);
    console.log('  삽입 결과:', insertResult);

    if (insertResult === 'not-inserted') {
      // iframe 폴백
      const iframes = await page.$$('iframe');
      for (const iframe of iframes) {
        try {
          const frame = await iframe.contentFrame();
          if (!frame) continue;
          const body = await frame.$('body');
          if (body) {
            await frame.evaluate((el, html) => { el.innerHTML = html; }, body, bodyHtml);
            console.log('  ✅ iframe body 삽입');
            break;
          }
        } catch(e) {}
      }
    }

    await sleep(2000);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-before-publish.png' });

    // 6. 발행 버튼 (완료/발행)
    console.log('\n▶ 발행 패널 열기...');
    const pubHandle = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.find(b =>
        b.textContent.trim() === '완료' ||
        b.textContent.includes('발행') ||
        b.id === 'publish-layer-btn'
      );
    });
    const pubEl = pubHandle.asElement();
    if (!pubEl) {
      console.log('  ⚠ 발행 버튼 없음');
      const allBtns = await page.evaluate(() =>
        [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null).map(b => ({ text: b.textContent.trim(), id: b.id }))
      );
      console.log('  보이는 버튼:', JSON.stringify(allBtns));
      return;
    }
    const pubText = await page.evaluate(el => el.textContent.trim(), pubEl);
    await pubEl.click();
    console.log(`  "${pubText}" 클릭`);
    await sleep(2000);

    // 7. 발행 패널 — 공개 선택 + 발행
    const radioInfo = await page.evaluate(() => {
      const radios = [...document.querySelectorAll('input[type="radio"]')];
      return radios.map(r => {
        const label = document.querySelector(`label[for="${r.id}"]`);
        return { id: r.id, value: r.value, label: label?.textContent.trim(), checked: r.checked };
      });
    });
    console.log('  라디오:', JSON.stringify(radioInfo));

    const pubResult = await page.evaluate(() => {
      const radios = [...document.querySelectorAll('input[type="radio"]')];
      for (const r of radios) {
        const label = document.querySelector(`label[for="${r.id}"]`);
        const t = label?.textContent.trim() || '';
        if (t === '공개' || t === '전체 공개' || t === '전체공개') {
          r.click();
          return 'clicked:' + t;
        }
      }
      return 'not-found';
    });
    console.log('  공개 선택:', pubResult);
    await sleep(800);

    // publish-btn (공개 발행)
    const publishBtn = await page.$('#publish-btn');
    if (publishBtn) {
      const btnText = await page.evaluate(el => el.textContent.trim(), publishBtn);
      await publishBtn.click();
      console.log(`  ✅ "${btnText}" 클릭`);
    } else {
      // 텍스트로 찾기
      const altHandle = await page.evaluateHandle(() =>
        [...document.querySelectorAll('button')].find(b =>
          b.offsetParent !== null &&
          (b.textContent.includes('발행') || b.textContent.includes('저장') || b.textContent.includes('공개'))
        )
      );
      const altEl = altHandle.asElement();
      if (altEl) {
        const t = await page.evaluate(el => el.textContent.trim(), altEl);
        await altEl.click();
        console.log(`  ✅ fallback "${t}" 클릭`);
      }
    }

    await sleep(5000);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-published.png' });
    console.log('  최종 URL:', page.url());

    // 8. 발행 확인
    if (page.url().includes('manage/posts') || page.url().includes('/manage/newpost/')) {
      console.log('\n✅ 발행 완료!');
      // 최신 포스트 URL 찾기
      const postLinks = await page.evaluate(() => {
        return [...document.querySelectorAll('a')].filter(a => a.href.match(/axbiz\.tistory\.com\/\d+$/)).map(a => a.href).slice(0, 3);
      });
      console.log('최신 포스트:', postLinks);
    }

    console.log('\n🎉 axbiz.tistory.com 포스팅 완료!');

  } catch (e) {
    console.error('오류:', e.message);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/axbiz-error.png' }).catch(() => {});
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
