const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SAMPLE_ROADMAP = {
  categorySlug: '테스트카테고리',
  categoryLink: 'https://www.geo-aio.com/blog/category/%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%B9%B4%ED%85%8C%EA%B3%A0%EB%A6%AC',
  posts: [
    {
      postNo: 1,
      weekNum: 1,
      channel: 'Tistory',
      role: 'Pillar',
      intent: 'educational',
      date: '2026-05-12',
      title: '테스트 티스토리 포스트 제목',
      body: '이것은 테스트 본문입니다. 복사 버튼을 눌렀을 때 이 내용이 복사되어야 합니다.',
      tags: ['태그1', '태그2', '태그3'],
      categoryLink: 'https://www.geo-aio.com/blog/category/%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%B9%B4%ED%85%8C%EA%B3%A0%EB%A6%AC',
    },
    {
      postNo: 2,
      weekNum: 1,
      channel: 'LinkedIn',
      role: 'Echo',
      intent: 'social',
      date: '2026-05-12',
      title: '테스트 LinkedIn 포스트 제목',
      body: '이것은 LinkedIn용 테스트 본문입니다. 해시태그와 링크가 포함되어야 합니다. #테스트 #LinkedIn',
      tags: [],
      categoryLink: 'https://www.geo-aio.com/blog/category/%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%B9%B4%ED%85%8C%EA%B3%A0%EB%A6%AC',
    },
  ],
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();
  await browser.defaultBrowserContext().overridePermissions('https://www.geo-aio.com', ['clipboard-read', 'clipboard-write']);

  try {
    // 1. 먼저 페이지 접속해서 localStorage 주입
    await page.goto('https://www.geo-aio.com/backlink/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate((data) => {
      localStorage.setItem('geoaio_backlink_roadmaps', JSON.stringify({ [data.categorySlug]: data }));
    }, SAMPLE_ROADMAP);

    // 2. 리로드해서 데이터 반영
    await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(3000);

    // 3. 카드 확인
    const cards = await page.evaluate(() => {
      return [...document.querySelectorAll('button')].map(b => b.textContent?.trim()).filter(Boolean);
    });
    console.log('버튼 목록:', cards);

    // 4. Tistory 카드 복사 버튼 클릭
    const tistoryResult = await page.evaluate(async () => {
      const btns = [...document.querySelectorAll('button')];
      const copyBtn = btns.find(b => b.textContent?.includes('📋'));
      if (!copyBtn) return { error: '📋 버튼 없음' };
      copyBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      try {
        const text = await navigator.clipboard.readText();
        return { ok: true, text };
      } catch (e) {
        return { clipErr: e.message };
      }
    });

    console.log('\n======== Tistory 복사 결과 ========');
    if (tistoryResult.ok) {
      console.log(tistoryResult.text);
    } else {
      console.log(JSON.stringify(tistoryResult));
    }

  } finally {
    await browser.close();
  }
})().catch(e => { console.error('오류:', e.message); process.exit(1); });
