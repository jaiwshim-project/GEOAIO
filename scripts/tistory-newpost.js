// 새 백링크 허브 포스트만 작성 (세션 재사용, CAPTCHA 수동 처리)
const puppeteer = require('puppeteer-core');

const BLOG_ID = 'metabiz101';
const EMAIL = 'jaiwshim@paran.com';
const PASSWORD = 'ro9633ke14!!';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const GEO_AIO_LINKS = [
  { title: 'GEO-AIO 키워드 경쟁 분석으로 AI Overview 노출 3배 늘린 실제 사례', url: 'https://www.geo-aio.com/blog/94cbf7bb-db6e-40c2-94e3-a51dc108d6fb' },
  { title: 'AI 검색 시대, 당신의 키워드가 Overview에 안 떠오르는 진짜 이유', url: 'https://www.geo-aio.com/blog/0f5f4bd1-4209-4d3b-a4f7-073a1d329b79' },
  { title: 'GEO-AIO 키워드 경쟁 분석 완벽 가이드: AI Overview 노출 확률 높이는 전문가 분석', url: 'https://www.geo-aio.com/blog/d848e660-aa3b-49d6-aefc-a985f8a7b8fe' },
  { title: 'GEO vs 기존 SEO: 3개 기업 ROI 비교 — 실제 성과 수치', url: 'https://www.geo-aio.com/blog/3c3e9776-3211-40ab-ad43-6ca9db3327d0' },
  { title: 'AI Overview 노출 오해 5가지: GEO 키워드 경쟁 분석으로 진짜 답을 찾다', url: 'https://www.geo-aio.com/blog/e4129908-5d2c-406d-a39c-6d23c889b656' },
  { title: 'GEO 도입 전 놓치면 안 되는 점검 15가지 — AI 검색엔진 최적화 체크리스트', url: 'https://www.geo-aio.com/blog/2785f251-80a3-461f-bcb5-22b4485bf628' },
  { title: 'GEO-AIO vs 기존 SEO 도구: AI Overview 노출률 높이는 비교분석', url: 'https://www.geo-aio.com/blog/deae82a3-2a17-4050-a078-52aaebd499b6' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(20000);

  try {
    // 1. 로그인 확인
    console.log('▶ Tistory 관리 페이지 접속...');
    await page.goto(`https://${BLOG_ID}.tistory.com/manage`, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    if (page.url().includes('login') || page.url().includes('auth')) {
      console.log('▶ 로그인 필요 → 카카오 로그인...');
      await page.goto('https://www.tistory.com/auth/login', { waitUntil: 'networkidle0' });
      await sleep(1500);

      const kakaoBtn = await page.evaluateHandle(() => {
        return [...document.querySelectorAll('a,button')].find(el => el.textContent.includes('카카오'));
      });
      const kakaoEl = kakaoBtn.asElement();
      if (kakaoEl) { await kakaoEl.click(); await sleep(3000); }

      if (page.url().includes('kakao') || page.url().includes('accounts')) {
        const emailEl = await page.$('input#loginId--1, input[name="loginId"], input[type="email"]');
        if (emailEl) { await emailEl.click({ clickCount: 3 }); await emailEl.type(EMAIL, { delay: 60 }); }
        const pwEl = await page.$('input#password--2, input[name="password"], input[type="password"]');
        if (pwEl) { await pwEl.click({ clickCount: 3 }); await pwEl.type(PASSWORD, { delay: 60 }); }
        const subBtn = await page.$('button[type="submit"]');
        if (subBtn) { await subBtn.click(); await sleep(4000); }
      }
      console.log('  로그인 후 URL:', page.url());
    } else {
      console.log('✅ 이미 로그인됨');
    }

    // 2. 새 포스트 작성 페이지
    console.log('\n▶ 새 포스트 작성 페이지...');
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/newpost/`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });
    await sleep(4000);
    console.log('  URL:', page.url());

    // CAPTCHA 감지
    const hasCaptcha = await page.evaluate(() => {
      return document.body.innerText.includes('CAPTCHA') ||
             document.body.innerText.includes('보안') ||
             document.body.innerText.includes('입력해주세요') ||
             document.querySelector('iframe[src*="captcha"]') !== null;
    });
    if (hasCaptcha) {
      console.log('⚠ CAPTCHA 감지 — 브라우저에서 직접 해결해주세요 (30초 대기)...');
      await sleep(30000);
    }

    // 3. 제목 입력
    await page.waitForSelector('input#title, .editor-title', { timeout: 15000 }).catch(() => {});
    const titleEl = await page.$('input#title') || await page.$('.editor-title input') || await page.$('[placeholder*="제목"]');
    if (titleEl) {
      await titleEl.click({ clickCount: 3 });
      await titleEl.type('GEO-AIO.com — AI 검색 인용 최적화 완전 가이드 총정리', { delay: 40 });
      console.log('✅ 제목 입력');
    } else {
      console.log('⚠ 제목 입력창 없음');
    }
    await sleep(1000);

    // 4. 본문 삽입 (iframe 에디터)
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

    const iframes = await page.$$('iframe');
    console.log(`  iframe 수: ${iframes.length}`);
    let inserted = false;

    for (const iframe of iframes) {
      try {
        const frame = await iframe.contentFrame();
        if (!frame) continue;
        const body = await frame.$('body');
        if (body) {
          const isEditable = await frame.evaluate(el => el.contentEditable === 'true' || el.isContentEditable, body);
          if (isEditable || true) {
            await frame.evaluate((el, html) => { el.innerHTML = html; }, body, bodyHtml);
            console.log('✅ 본문 삽입 완료');
            inserted = true;
            break;
          }
        }
      } catch (e) { /* skip */ }
    }

    if (!inserted) {
      const editable = await page.$('[contenteditable="true"]');
      if (editable) {
        await page.evaluate((el, html) => { el.innerHTML = html; }, editable, bodyHtml);
        console.log('✅ contenteditable 본문 삽입');
        inserted = true;
      }
    }

    await sleep(1500);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/newpost-ready.png' });

    // 5. 발행
    const pubEl = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(b =>
        b.textContent.includes('발행') || b.id === 'publish-layer-btn'
      );
    });
    const pubBtn = pubEl.asElement();
    if (pubBtn) {
      await pubBtn.click();
      console.log('  발행 버튼 클릭');
      await sleep(2000);

      // CAPTCHA 다시 확인
      const captcha2 = await page.evaluate(() => document.body.innerText.includes('입력해주세요'));
      if (captcha2) {
        console.log('⚠ CAPTCHA 재발생 — 30초 내 직접 해결해주세요...');
        await sleep(30000);
      }

      const confirmEl = await page.evaluateHandle(() => {
        return [...document.querySelectorAll('button')].find(b =>
          b.textContent.includes('발행') || b.textContent.includes('확인')
        );
      });
      const confirmBtn = confirmEl.asElement();
      if (confirmBtn) {
        await confirmBtn.click();
        console.log('✅ 발행 완료');
      }
    } else {
      console.log('⚠ 발행 버튼 없음 — 수동 발행 필요');
    }

    await sleep(4000);
    console.log('최종 URL:', page.url());
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/newpost-done.png' });
    console.log('\n🎉 완료!');

  } catch (e) {
    console.error('오류:', e.message);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/newpost-error.png' });
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
