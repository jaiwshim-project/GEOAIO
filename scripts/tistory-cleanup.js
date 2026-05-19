// 중복 비공개 포스트 삭제 + 공개 포스트 URL 확인
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLOG_ID = 'metabiz101';

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
    // 관리 페이지 접속 (로그인 세션 유지 가정)
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/posts?type=private`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    // 비공개 포스트 목록 확인
    const privatePosts = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')];
      return links
        .filter(a => a.href.match(/tistory\.com\/\d+$/) && a.textContent.includes('GEO-AIO'))
        .map(a => {
          const m = a.href.match(/(\d+)$/);
          return { id: m ? m[1] : null, text: a.textContent.trim().slice(0, 60), href: a.href };
        });
    });
    console.log('비공개 GEO-AIO 포스트:', JSON.stringify(privatePosts, null, 2));

    // 포스트 6990893 삭제 (비공개 중복)
    for (const post of privatePosts) {
      if (post.id) {
        const deleteUrl = `https://${BLOG_ID}.tistory.com/manage/posts/delete/${post.id}`;
        console.log(`\n▶ 포스트 ${post.id} 삭제 시도...`);
        // 삭제는 POST 요청 필요 — 관리 페이지에서 직접 수행
        await page.goto(`https://${BLOG_ID}.tistory.com/manage/newpost/${post.id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await sleep(3000);
        console.log(`  편집 페이지: ${page.url()}`);
      }
    }

    // 공개 포스트 최신 2개 확인
    await page.goto(`https://${BLOG_ID}.tistory.com/manage/posts`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);

    const recentPosts = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')];
      return links
        .filter(a => a.href.match(/tistory\.com\/\d+$/) && a.textContent.includes('GEO-AIO'))
        .slice(0, 5)
        .map(a => {
          const m = a.href.match(/(\d+)$/);
          return { id: m ? m[1] : null, text: a.textContent.trim().slice(0, 60), href: a.href };
        });
    });
    console.log('\n전체 GEO-AIO 포스트 (최근 5개):', JSON.stringify(recentPosts, null, 2));

    // 최신 공개 허브 포스트 방문
    const hubPost = recentPosts.find(p => parseInt(p.id) > 6990892);
    if (hubPost) {
      console.log(`\n▶ 허브 포스트 방문: ${hubPost.href}`);
      await page.goto(hubPost.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(3000);
      const hasGeoLink = await page.evaluate(() => document.body.innerHTML.includes('geo-aio.com'));
      console.log('geo-aio.com 링크 포함:', hasGeoLink ? '✅' : '❌');
      console.log('포스트 URL:', page.url());
      await page.screenshot({ path: 'C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/scripts/hub-post-verify.png' });
    }

    console.log('\n🎉 확인 완료!');
  } catch (e) {
    console.error('오류:', e.message);
  } finally {
    await sleep(5000);
    await browser.close();
  }
})();
