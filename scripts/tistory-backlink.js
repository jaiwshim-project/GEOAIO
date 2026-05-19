// Tistory 백링크 자동 삽입 스크립트
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
];

async function kakaoLogin(page) {
  console.log('▶ Tistory 로그인 페이지...');
  await page.goto('https://www.tistory.com/auth/login', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1500);

  // "카카오계정으로 로그인" 버튼 텍스트로 찾기
  const kakaoBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('a, button')];
    return btns.find(b => b.textContent.includes('카카오계정으로 로그인') || b.textContent.includes('카카오'));
  });
  const kakaoEl = kakaoBtn.asElement();
  if (kakaoEl) {
    await kakaoEl.click();
    console.log('  카카오 버튼 클릭');
  } else {
    throw new Error('카카오 로그인 버튼을 찾을 수 없음');
  }

  await sleep(3000);
  console.log('  현재 URL:', page.url());

  // 카카오 로그인 폼
  if (page.url().includes('kakao') || page.url().includes('accounts')) {
    console.log('▶ 카카오 계정 입력...');

    // 이메일
    await page.waitForSelector('input#loginId--1, input[name="loginId"], input[autocomplete="username"]', { timeout: 10000 }).catch(() => {});
    const emailInput = await page.$('input#loginId--1') || await page.$('input[name="loginId"]') || await page.$('input[autocomplete="username"]') || await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(EMAIL, { delay: 60 });
      console.log('  이메일 입력 완료');
    } else {
      console.log('  ⚠ 이메일 입력창 없음');
    }

    // 비밀번호
    const pwInput = await page.$('input#password--2') || await page.$('input[name="password"]') || await page.$('input[type="password"]');
    if (pwInput) {
      await pwInput.click({ clickCount: 3 });
      await pwInput.type(PASSWORD, { delay: 60 });
      console.log('  비밀번호 입력 완료');
    }

    // 로그인 버튼
    const submitBtn = await page.$('button[type="submit"]') || await page.$('input[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('  로그인 버튼 클릭');
    }

    await sleep(4000);
    console.log('  로그인 후 URL:', page.url());
  }

  // Tistory manage로 이동해서 로그인 확인
  await page.goto(`https://${BLOG_ID}.tistory.com/manage`, { waitUntil: 'networkidle0', timeout: 20000 });
  await sleep(2000);
  const isLoggedIn = !page.url().includes('login');
  console.log(isLoggedIn ? '✅ 로그인 확인' : '⚠ 로그인 미확인, URL: ' + page.url());
  return isLoggedIn;
}

async function editPostWithBacklinks(page, postNo) {
  const editUrl = `https://${BLOG_ID}.tistory.com/manage/newpost/${postNo}`;
  console.log(`\n▶ 포스트 ${postNo} 편집 중...`);
  await page.goto(editUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);

  // 스크린샷
  await page.screenshot({ path: `C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/edit-${postNo}.png` });

  const linkHtml = `<br/><br/><div style="border-top:3px solid #4F46E5;padding:16px 0;margin-top:24px;"><p style="font-weight:bold;font-size:15px;color:#4F46E5;margin-bottom:10px;">📌 AI 검색 최적화(GEO) 심화 학습 — geo-aio.com</p><ul style="padding-left:0;list-style:none;">${GEO_AIO_LINKS.map(l => `<li style="margin-bottom:8px;">→ <a href="${l.url}" target="_blank" rel="noopener">${l.title}</a></li>`).join('')}</ul><p style="margin-top:12px;">🔗 더 많은 GEO-AIO 전략: <a href="https://www.geo-aio.com/blog/category/geo-aio" target="_blank" rel="noopener">www.geo-aio.com/blog/category/geo-aio</a></p></div>`;

  // iframe 에디터 확인
  const iframes = await page.$$('iframe');
  console.log(`  iframe 수: ${iframes.length}`);

  let inserted = false;

  for (const iframe of iframes) {
    const src = await page.evaluate(el => el.src || el.id || '', iframe);
    console.log('  iframe:', src.slice(0, 80));
    try {
      const frame = await iframe.contentFrame();
      if (!frame) continue;
      const body = await frame.$('body[contenteditable="true"], body');
      if (body) {
        await frame.evaluate((el, html) => { el.innerHTML += html; }, body, linkHtml);
        console.log('  ✅ iframe body에 링크 삽입');
        inserted = true;
        break;
      }
    } catch (e) { /* cross-origin 무시 */ }
  }

  if (!inserted) {
    // contenteditable 찾기
    const editable = await page.$('[contenteditable="true"]');
    if (editable) {
      await page.evaluate((el, html) => { el.innerHTML += html; }, editable, linkHtml);
      console.log('  ✅ contenteditable에 링크 삽입');
      inserted = true;
    }
  }

  if (!inserted) {
    console.log('  ⚠ 에디터를 찾지 못함 — 스크린샷 확인');
    return false;
  }

  await sleep(1000);

  // 발행 버튼 찾기
  const publishBtnHandle = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button, input[type="submit"]')];
    return btns.find(b => b.textContent.includes('발행') || b.textContent.includes('저장') || b.id === 'publish-layer-btn');
  });
  const publishEl = publishBtnHandle.asElement();
  if (publishEl) {
    await publishEl.click();
    console.log('  발행 버튼 클릭');
    await sleep(2000);
    // 최종 확인 버튼
    const confirmHandle = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.find(b => b.textContent.includes('발행') || b.textContent.includes('확인') || b.textContent.includes('저장'));
    });
    const confirmEl = confirmHandle.asElement();
    if (confirmEl) {
      await confirmEl.click();
      console.log('  ✅ 최종 발행 완료');
    }
  } else {
    console.log('  ⚠ 발행 버튼 없음');
  }

  await sleep(3000);
  await page.screenshot({ path: `C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/after-${postNo}.png` });
  return true;
}

async function writeNewPost(page) {
  console.log('\n▶ 새 백링크 허브 포스트 작성...');
  await page.goto(`https://${BLOG_ID}.tistory.com/manage/newpost/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);

  // 제목 입력
  const titleSel = 'input#title, input[placeholder*="제목"], .editor-title input, textarea#title';
  await page.waitForSelector(titleSel, { timeout: 8000 }).catch(() => {});
  const titleInput = await page.$(titleSel);
  if (titleInput) {
    await titleInput.click({ clickCount: 3 });
    await titleInput.type('GEO-AIO.com — AI 검색 인용 최적화 완전 가이드 (GEO 총정리)', { delay: 40 });
    console.log('  ✅ 제목 입력');
  }

  await sleep(1000);

  const bodyHtml = `<p>AI Overview, Perplexity, ChatGPT 등 생성형 AI 검색에서 콘텐츠가 인용되도록 최적화하는 GEO(Generative Engine Optimization) 기법을 총정리합니다.</p>

<h2>GEO-AIO 핵심 글 모음</h2>
${GEO_AIO_LINKS.map(l => `<p>→ <a href="${l.url}" target="_blank" rel="noopener"><strong>${l.title}</strong></a></p>`).join('\n')}

<h2>GEO-AIO 플랫폼이란?</h2>
<p>GEO-AIO(Generative Engine Optimization – AI-Indexed Output)는 Google AI Overview, Perplexity, ChatGPT 등 생성형 AI 검색 엔진이 답변을 생성할 때 특정 콘텐츠를 출처로 인용하도록 최적화하는 기법입니다. 기존 SEO가 검색 결과 순위를 높이는 데 집중했다면, GEO는 AI가 답변 생성 시 해당 콘텐츠를 선택하는 신뢰도와 구조를 강화합니다.</p>

<h2>AI 인용률 높이는 핵심 원칙</h2>
<ul>
<li>질문형 헤딩 + 첫 단락에 직접 답변 배치 (TL;DR)</li>
<li>E-E-A-T 신호 강화 — 저자 경력, 날짜, 출처 링크 명시</li>
<li>FAQ Schema.org 구조화 데이터 삽입</li>
<li>수치·통계·명확한 정의 포함</li>
</ul>

<p>전략 도구 및 분석 대시보드: <a href="https://www.geo-aio.com" target="_blank" rel="noopener"><strong>www.geo-aio.com</strong></a></p>
<p>GEO-AIO 블로그 전체 목록: <a href="https://www.geo-aio.com/blog/category/geo-aio" target="_blank" rel="noopener">www.geo-aio.com/blog/category/geo-aio</a></p>`;

  // iframe 에디터
  const iframes = await page.$$('iframe');
  let bodyInserted = false;
  for (const iframe of iframes) {
    try {
      const frame = await iframe.contentFrame();
      if (!frame) continue;
      const body = await frame.$('body');
      if (body) {
        await frame.evaluate((el, html) => { el.innerHTML = html; }, body, bodyHtml);
        console.log('  ✅ 본문 입력');
        bodyInserted = true;
        break;
      }
    } catch (e) { /* cross-origin */ }
  }
  if (!bodyInserted) {
    const editable = await page.$('[contenteditable="true"]');
    if (editable) {
      await page.evaluate((el, html) => { el.innerHTML = html; }, editable, bodyHtml);
      console.log('  ✅ contenteditable 본문 입력');
    }
  }

  await sleep(1000);
  await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/new-post-before.png' });

  // 발행
  const pubHandle = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')];
    return btns.find(b => b.textContent.includes('발행') || b.id === 'publish-layer-btn');
  });
  const pubEl = pubHandle.asElement();
  if (pubEl) {
    await pubEl.click();
    await sleep(2000);
    const confirmHandle = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.find(b => b.textContent.includes('발행') || b.textContent.includes('확인'));
    });
    const confirmEl = confirmHandle.asElement();
    if (confirmEl) { await confirmEl.click(); console.log('  ✅ 새 포스트 발행 완료'); }
  }
  await sleep(3000);
  console.log('  최종 URL:', page.url());
  await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/new-post-after.png' });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();

  try {
    const loggedIn = await kakaoLogin(page);
    if (!loggedIn) throw new Error('로그인 실패');

    // 1. 기존 포스트 백링크 추가
    await editPostWithBacklinks(page, 6990892);

    // 2. 새 허브 포스트 작성
    await writeNewPost(page);

    console.log('\n🎉 완료!');
  } catch (e) {
    console.error('오류:', e.message);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/error-final.png' });
  } finally {
    await sleep(4000);
    await browser.close();
  }
})();
