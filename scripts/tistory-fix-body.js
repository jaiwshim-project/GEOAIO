// 기존 포스트 본문 업데이트 (TinyMCE API 사용)
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLOG_ID = 'metabiz101';
const EMAIL = 'jaiwshim@paran.com';
const PASSWORD = 'ro9633ke14!!';
const POST_ID = 6990894; // 공개 발행된 최신 포스트

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
      // 동의 페이지 처리
      for (let i = 0; i < 3; i++) {
        if (page.url().includes('consent') || page.url().includes('agreement')) {
          const agreeBtn = await page.evaluateHandle(() =>
            [...document.querySelectorAll('button,a')].find(el => el.textContent.includes('동의') || el.textContent.includes('확인'))
          );
          const agreeEl = agreeBtn.asElement();
          if (agreeEl) { await agreeEl.click(); await sleep(3000); } else break;
        } else break;
      }
    }
    console.log('✅ 로그인 완료');

    // 포스트 편집 페이지
    const editUrl = `https://${BLOG_ID}.tistory.com/manage/newpost/${POST_ID}`;
    console.log(`\n▶ 포스트 ${POST_ID} 편집: ${editUrl}`);
    await page.goto(editUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(8000);
    console.log('  URL:', page.url());

    // TinyMCE 상태 확인
    const editorInfo = await page.evaluate(() => {
      return {
        hasTinyMCE: !!window.tinyMCE,
        hasTinymce: !!window.tinymce,
        activeEditor: !!(window.tinyMCE?.activeEditor || window.tinymce?.activeEditor),
        iframes: [...document.querySelectorAll('iframe')].map(f => f.id || f.src?.slice(0, 50)),
      };
    });
    console.log('  에디터 정보:', JSON.stringify(editorInfo));

    // TinyMCE로 본문 설정
    const setResult = await page.evaluate((html) => {
      const editor = window.tinyMCE?.activeEditor || window.tinymce?.activeEditor;
      if (editor) {
        editor.setContent(html);
        editor.save();
        return 'tinymce:' + editor.id;
      }
      return 'no-editor';
    }, bodyHtml);
    console.log('  본문 설정:', setResult);

    if (setResult === 'no-editor') {
      // iframe body에 직접 설정
      const iframes = await page.$$('iframe');
      for (const iframe of iframes) {
        try {
          const frame = await iframe.contentFrame();
          if (!frame) continue;
          const body = await frame.$('body');
          if (body) {
            const isEditable = await frame.evaluate(el => el.isContentEditable || el.contentEditable === 'true', body);
            if (isEditable) {
              await frame.evaluate((el, html) => { el.innerHTML = html; }, body, bodyHtml);
              console.log('  ✅ iframe body 설정 완료');
              break;
            }
          }
        } catch(e) {}
      }
    }

    await sleep(2000);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/fix-body-before.png' });

    // 발행 패널 열기
    const pubHandle = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('발행') || b.id === 'publish-layer-btn')
    );
    const pubEl = pubHandle.asElement();
    if (!pubEl) { console.log('⚠ 발행 버튼 없음'); return; }

    await pubEl.click();
    await sleep(2000);
    console.log('  발행 패널 열림');

    // 라디오 확인 및 공개 선택
    const radioResult = await page.evaluate(() => {
      const radios = [...document.querySelectorAll('input[type="radio"]')];
      const info = radios.map(r => {
        const label = document.querySelector(`label[for="${r.id}"]`);
        return { id: r.id, value: r.value, label: label?.textContent.trim(), checked: r.checked };
      });
      const pubRadio = radios.find(r => {
        const label = document.querySelector(`label[for="${r.id}"]`);
        return label?.textContent.trim() === '공개' || label?.textContent.trim() === '전체 공개';
      });
      if (pubRadio) { pubRadio.click(); return { clicked: pubRadio.value, all: info }; }
      return { clicked: null, all: info };
    });
    console.log('  라디오 결과:', JSON.stringify(radioResult));
    await sleep(1000);

    // 공개 발행 버튼
    const publishBtn = await page.$('#publish-btn');
    if (publishBtn) {
      const btnText = await page.evaluate(el => el.textContent.trim(), publishBtn);
      await publishBtn.click();
      console.log(`  ✅ "${btnText}" 클릭`);
    }

    // CAPTCHA 대기
    console.log('  ⏳ 90초 대기 (CAPTCHA가 나타나면 해결해주세요)...');
    await sleep(90000);

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/fix-body-done.png' });
    console.log('  최종 URL:', page.url());

    // 포스트 내용 확인
    await page.goto(`https://${BLOG_ID}.tistory.com/${POST_ID}`, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    const hasGeoLink = await page.evaluate(() => document.body.innerHTML.includes('geo-aio.com'));
    console.log(`\n포스트 ${POST_ID} geo-aio.com 링크: ${hasGeoLink ? '✅ 있음' : '❌ 없음'}`);
    console.log('포스트 URL:', page.url());
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/fix-body-verify.png' });

    console.log('\n🎉 완료!');
  } catch (e) {
    console.error('오류:', e.message);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/fix-body-error.png' }).catch(() => {});
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
