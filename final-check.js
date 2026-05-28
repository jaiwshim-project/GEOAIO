const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("🌐 원격 사이트 재확인 (캐시 무효화)...");
    
    // 캐시 무효화 헤더 추가
    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    });
    
    await page.goto("https://www.geo-aio.com/proposal/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC", { 
      waitUntil: "networkidle",
      timeout: 30000 
    });
    
    console.log("✅ 페이지 로드 완료");
    
    // 상단 메뉴 찾기
    const topMenu = await page.locator("main > div.flex.justify-between").first();
    const isVisible = await topMenu.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      console.log("✅ 상단 메뉴 찾음!");
      
      const links = await topMenu.locator("a").all();
      console.log("버튼 개수:", links.length);
      
      for (let link of links) {
        const text = await link.textContent();
        const href = await link.getAttribute("href");
        console.log(`  ✓ ${text.trim()} → ${href}`);
      }
      
      // 월간 보고서 버튼이 있는지 확인
      const monthlyBtn = await topMenu.locator('a[href="/blog/monthly-report"]').first();
      if (await monthlyBtn.isVisible()) {
        console.log("✅ 월간 보고서 버튼 표시됨!");
      }
    } else {
      console.log("❌ 상단 메뉴를 찾을 수 없음");
      
      // 디버깅: 페이지 소스 일부 출력
      const htmlSnippet = await page.locator("main").first().innerHTML();
      if (htmlSnippet.includes("flex justify-between")) {
        console.log("⚠️ flex 클래스는 있는데 선택자가 맞지 않을 수도 있음");
      }
    }
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();