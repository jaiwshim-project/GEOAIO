// 비공개 허브 포스트를 공개로 전환
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLOG_ID = 'metabiz101';
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

async function createAndPublishNewPost(page) {
  console.log('\n▶ 새 포스트 작성 (공개)...');
  await page.goto(`https://${BLOG_ID}.tistory.com/manage/newpost/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(8000);
  console.log('  편집기 URL:', page.url());

  // 제목 입력
  await page.waitForSelector('input#title, [placeholder*="제목"]', { timeout: 10000 }).catch(() => {});
  const titleEl = await page.$('input#title') || await page.$('[placeholder*="제목"]');
  if (titleEl) {
    await titleEl.click({ clickCount: 3 });
    await titleEl.type('GEO-AIO.com — AI 검색 인용 최적화 완전 가이드 총정리', { delay: 40 });
    console.log('  ✅ 제목 입력');
  }
  await sleep(1000);

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

  // TinyMCE API로 본문 삽입
  await sleep(2000); // 에디터 초기화 대기
  const insertResult = await page.evaluate((html) => {
    // TinyMCE API (가장 신뢰할 수 있음)
    if (window.tinyMCE && window.tinyMCE.activeEditor) {
      window.tinyMCE.activeEditor.setContent(html);
      window.tinyMCE.activeEditor.save();
      return 'tinyMCE-api';
    }
    if (window.tinymce && window.tinymce.activeEditor) {
      window.tinymce.activeEditor.setContent(html);
      window.tinymce.activeEditor.save();
      return 'tinymce-api';
    }
    // fallback: iframe body
    const iframes = [...document.querySelectorAll('iframe')];
    for (const iframe of iframes) {
      try {
        if (iframe.contentDocument && iframe.contentDocument.body) {
          iframe.contentDocument.body.innerHTML = html;
          // 변경 이벤트 발생시키기
          const event = new Event('input', { bubbles: true });
          iframe.contentDocument.body.dispatchEvent(event);
          return 'iframe-body';
        }
      } catch(e) {}
    }
    return 'not-inserted';
  }, bodyHtml);
  console.log(`  본문 삽입 방식: ${insertResult}`);

  if (insertResult === 'not-inserted') {
    // 최후 수단: 에디터 영역 클릭 후 키보드 입력
    const editorIframe = await page.$('#editor-tistory_ifr, iframe');
    if (editorIframe) {
      const frame = await editorIframe.contentFrame();
      if (frame) {
        await frame.click('body');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await frame.evaluate((html) => {
          document.execCommand('insertHTML', false, html);
        }, bodyHtml);
        console.log('  ✅ 본문 삽입 (execCommand)');
      }
    }
  }
  await sleep(1500);

  // 발행 버튼 클릭
  const pubHandle = await page.evaluateHandle(() =>
    [...document.querySelectorAll('button')].find(b => b.textContent.includes('발행') || b.id === 'publish-layer-btn')
  );
  const pubEl = pubHandle.asElement();
  if (!pubEl) { console.log('⚠ 발행 버튼 없음'); return; }

  await pubEl.click();
  await sleep(2000);
  console.log('  발행 패널 열림');

  await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/new-publish-panel.png' });

  // 패널 로딩 대기
  await sleep(2000);

  // 라디오 레이블 확인 (전체공개 찾기)
  const radioInfo = await page.evaluate(() => {
    const radios = [...document.querySelectorAll('input[type="radio"]')];
    return radios.map(r => {
      const label = document.querySelector(`label[for="${r.id}"]`);
      return { id: r.id, value: r.value, checked: r.checked, label: label ? label.textContent.trim() : '' };
    });
  });
  console.log('  라디오+레이블:', JSON.stringify(radioInfo));

  // 전체공개 라디오 클릭 (레이블 텍스트로 찾기)
  const publicResult = await page.evaluate(() => {
    const radios = [...document.querySelectorAll('input[type="radio"]')];
    for (const r of radios) {
      const label = document.querySelector(`label[for="${r.id}"]`);
      const labelText = label ? label.textContent.trim() : '';
      if (labelText.includes('전체') || labelText === '공개') {
        r.click();
        return 'label-match:' + labelText + ':value=' + r.value;
      }
    }
    // 레이블 없으면 value=20 시도 (새 에디터 공개 값)
    const r20 = radios.find(r => r.value === '20');
    if (r20) { r20.click(); return 'value20'; }
    return 'not-found';
  });
  console.log('  공개 선택:', publicResult);
  await sleep(1000);

  // publish-btn 클릭 (실제 저장/발행 버튼)
  const publishBtn = await page.$('#publish-btn');
  if (publishBtn) {
    const btnText = await page.evaluate(el => el.textContent.trim(), publishBtn);
    await publishBtn.click();
    console.log(`  ✅ publish-btn("${btnText}") 클릭`);
  } else {
    // fallback: 텍스트로 찾기
    const fallbackHandle = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find(b =>
        b.offsetParent !== null &&
        (b.textContent.includes('발행') || b.textContent.includes('저장') || b.textContent.includes('공개'))
      )
    );
    const fallbackEl = fallbackHandle.asElement();
    if (fallbackEl) {
      const t = await page.evaluate(el => el.textContent.trim(), fallbackEl);
      await fallbackEl.click();
      console.log(`  ✅ fallback("${t}") 클릭`);
    } else {
      console.log('  ⚠ 저장 버튼 없음');
    }
  }

  // CAPTCHA 대비: 90초 무조건 대기 (브라우저 창에서 CAPTCHA 수동 해결)
  console.log('  ⏳ 90초 대기 중... (CAPTCHA가 나타나면 브라우저 창에서 직접 해결해주세요)');
  await sleep(90000);
  console.log('  대기 완료');

  await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/new-post-public.png' });
  console.log('  최종 URL:', page.url());

  // 발행된 포스트 URL 확인
  const postUrl = await page.evaluate(() => {
    const a = document.querySelector('a[href*="metabiz101.tistory.com"]:not([href*="manage"])');
    return a ? a.href : null;
  });
  if (postUrl) console.log('  발행된 포스트:', postUrl);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000);

  try {
    // 1. Tistory 관리 페이지 접속 (로그인 확인)
    await page.goto(`https://${BLOG_ID}.tistory.com/manage`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // 로그인 필요 시
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
        if (sub) { await sub.click(); await sleep(5000); }
      }
      console.log('로그인 URL:', page.url());
    } else {
      console.log('✅ 이미 로그인됨');
    }

    // 동의/약관 페이지 처리
    for (let i = 0; i < 3; i++) {
      if (page.url().includes('consent') || page.url().includes('agreement') || page.url().includes('terms')) {
        console.log('▶ 동의 페이지 처리...');
        const agreeBtn = await page.evaluateHandle(() =>
          [...document.querySelectorAll('button,a')].find(el =>
            el.textContent.includes('동의') || el.textContent.includes('확인') || el.textContent.includes('계속')
          )
        );
        const agreeEl = agreeBtn.asElement();
        if (agreeEl) { await agreeEl.click(); await sleep(3000); console.log('  동의 클릭, URL:', page.url()); }
        else break;
      } else break;
    }

    // 2. 비공개 포스트 목록 접속 (카테고리 필터 없이 전체 비공개)
    console.log('\n▶ 비공개 포스트 목록 조회...');
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/posts?type=private`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    // 목록 HTML 출력 (디버깅)
    const listInfo = await page.evaluate(() => {
      // 모든 a 태그와 제목 관련 요소 수집
      const links = [...document.querySelectorAll('a')];
      const geoLinks = links.filter(a => a.textContent.includes('GEO') || a.textContent.includes('geo'));
      const editLinks = links.filter(a => a.href && (a.href.includes('newpost') || a.href.includes('edit')));
      return {
        totalLinks: links.length,
        geoLinks: geoLinks.map(a => ({ text: a.textContent.trim().slice(0, 60), href: a.href })),
        editLinks: editLinks.slice(0, 5).map(a => ({ text: a.textContent.trim().slice(0, 60), href: a.href })),
        bodyText: document.body.innerText.slice(0, 500),
      };
    });
    console.log('GEO 관련 링크:', JSON.stringify(listInfo.geoLinks, null, 2));
    console.log('편집 링크 (처음 5개):', JSON.stringify(listInfo.editLinks, null, 2));
    console.log('페이지 텍스트 (앞 500자):', listInfo.bodyText);

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/private-list.png' });

    // 3. GEO-AIO 허브 포스트 편집 링크 찾기
    let editUrl = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')];
      // 제목 링크 (GEO-AIO 포함)
      const geoLink = links.find(a =>
        (a.textContent.includes('GEO-AIO') || a.textContent.includes('GEO') || a.textContent.includes('geo-aio')) &&
        (a.href.includes('newpost') || a.href.includes('edit'))
      );
      if (geoLink) return geoLink.href;

      // 편집 링크 중 첫 번째 (가장 최근 비공개 글)
      const editLinks = links.filter(a => a.href && a.href.includes('newpost'));
      // href 끝에 숫자 ID가 있는 것 찾기
      const numberedLinks = editLinks.filter(a => /newpost\/\d+/.test(a.href));
      return numberedLinks[0]?.href || editLinks[0]?.href || null;
    });

    console.log('\n▶ 찾은 편집 URL:', editUrl);

    // 편집 URL이 없으면 직접 모든 편집 링크 수집
    if (!editUrl) {
      const allPostLinks = await page.evaluate(() => {
        return [...document.querySelectorAll('a[href*="newpost"]')].map(a => ({
          text: a.textContent.trim().slice(0, 80),
          href: a.href
        }));
      });
      console.log('모든 newpost 링크:', JSON.stringify(allPostLinks));
      if (allPostLinks.length > 0) editUrl = allPostLinks[0].href;
    }

    if (!editUrl) {
      console.log('⚠ 기존 비공개 포스트를 찾지 못했습니다 → 새 포스트를 공개로 바로 작성합니다.');
      await createAndPublishNewPost(page);
      return;
    }

    // 4. 편집 페이지 이동
    console.log(`\n▶ 편집 페이지 이동: ${editUrl}`);
    await page.goto(editUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(4000);
    console.log('편집 URL:', page.url());

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/edit-page.png' });

    // 제목 확인
    const title = await page.evaluate(() => {
      const t = document.querySelector('input#title, .editor-title, [placeholder*="제목"]');
      return t ? t.value || t.textContent : '(제목 불명)';
    });
    console.log('포스트 제목:', title.slice(0, 80));

    // 5. 발행 버튼 클릭
    const pubBtnHandle = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find(b =>
        b.textContent.includes('발행') || b.id === 'publish-layer-btn' || b.className.includes('publish')
      )
    );
    const pubBtn = pubBtnHandle.asElement();
    if (!pubBtn) {
      console.log('⚠ 발행 버튼 없음');
      await sleep(10000);
      return;
    }

    await pubBtn.click();
    console.log('▶ 발행 패널 열림');
    await sleep(2000);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/publish-panel.png' });

    // 6. 공개 옵션 선택
    const publicSelected = await page.evaluate(() => {
      // value="0" = 공개, value="3" = 비공개 (Tistory 기준)
      const radios = [...document.querySelectorAll('input[type="radio"]')];
      console.log('라디오 버튼:', radios.map(r => ({ id: r.id, value: r.value, name: r.name })));

      // 공개 라디오 찾기
      const publicRadio = radios.find(r =>
        r.value === '0' || r.value === 'public' ||
        (r.id && r.id.toLowerCase().includes('public') && !r.id.toLowerCase().includes('protect'))
      );
      if (publicRadio) {
        publicRadio.click();
        return { found: true, id: publicRadio.id, value: publicRadio.value };
      }

      // 라벨로 찾기 (텍스트 매칭)
      const labels = [...document.querySelectorAll('label')];
      const publicLabel = labels.find(l => {
        const t = l.textContent.trim();
        return t === '공개' || t === '전체 공개';
      });
      if (publicLabel) {
        publicLabel.click();
        return { found: true, via: 'label', text: publicLabel.textContent.trim() };
      }

      return { found: false, radios: radios.map(r => ({ id: r.id, value: r.value })) };
    });
    console.log('공개 선택 결과:', JSON.stringify(publicSelected));
    await sleep(1000);

    // 7. 발행 저장 버튼 클릭
    const saveBtnHandle = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll('button')];
      // 발행 패널 안의 확인/저장/발행 버튼
      return btns.find(b => {
        const t = b.textContent.trim();
        return (t === '발행' || t === '저장' || t === '확인' || t === '공개 저장') &&
               b.offsetParent !== null; // 보이는 버튼
      });
    });
    const saveBtn = saveBtnHandle.asElement();
    if (saveBtn) {
      const btnText = await page.evaluate(el => el.textContent.trim(), saveBtn);
      await saveBtn.click();
      console.log(`✅ "${btnText}" 버튼 클릭`);
      await sleep(4000);
    } else {
      console.log('⚠ 저장 버튼 없음 — 발행 패널 버튼 목록:');
      const visibleBtns = await page.evaluate(() =>
        [...document.querySelectorAll('button')]
          .filter(b => b.offsetParent !== null)
          .map(b => ({ text: b.textContent.trim(), id: b.id, class: b.className.slice(0, 50) }))
      );
      console.log(JSON.stringify(visibleBtns, null, 2));
    }

    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/published-result.png' });
    console.log('최종 URL:', page.url());
    console.log('\n🎉 공개 전환 완료!');

  } catch (e) {
    console.error('오류:', e.message);
    await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/make-public-error.png' });
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
