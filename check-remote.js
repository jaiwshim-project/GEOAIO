const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("🌐 원격 사이트 확인 중...");
    
    // 원격 사이트 접속 (캐시 무효화)
    await page.goto("https://www.geo-aio.com/proposal/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC", { 
      waitUntil: "networkidle",
      timeout: 30000 
    });
    
    console.log("✅ 페이지 로드 완료");
    
    // 상단 메뉴 찾기
    const topMenu = await page.locator("main > div.flex.justify-between").first();
    const isVisible = await topMenu.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log("상단 메뉴 찾음:", isVisible);
    
    if (isVisible) {
      const links = await topMenu.locator("a").all();
      console.log("버튼 개수:", links.length);
      
      for (let link of links) {
        const text = await link.textContent();
        console.log("  -", text.trim());
      }
    } else {
      // 대체 방법: 모든 링크 검색
      const allLinks = await page.locator("a").all();
      console.log("전체 링크 개수:", allLinks.length);
      
      for (let link of allLinks) {
        const text = await link.textContent();
        if (text && text.includes("월간")) {
          console.log("✅ 월간 보고서 링크 찾음:", text.trim());
        }
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