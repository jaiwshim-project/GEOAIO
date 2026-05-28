const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("⏳ Proposal 페이지 로드 중...");
    await page.goto("http://localhost:3000/proposal/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC", { 
      waitUntil: "networkidle",
      timeout: 60000 
    });
    
    console.log("✅ 페이지 로드 완료");
    await page.waitForTimeout(2000);
    
    // 상단 메뉴 버튼 찾기 (flex container)
    const topMenu = await page.locator("main > div.flex.justify-between").first();
    const isVisible = await topMenu.isVisible();
    
    console.log("✅ 상단 메뉴 표시 여부:", isVisible);
    
    if (isVisible) {
      const allLinks = await topMenu.locator("a").all();
      console.log("✅ 버튼 개수:", allLinks.length);
      
      for (let i = 0; i < allLinks.length; i++) {
        const text = await allLinks[i].textContent();
        const href = await allLinks[i].getAttribute("href");
        console.log(`  버튼 ${i+1}: "${text.trim()}" → ${href}`);
      }
    }
    
    // 월간 보고서 버튼 클릭
    const monthlyBtn = await topMenu.locator('a[href="/blog/monthly-report"]').first();
    if (await monthlyBtn.isVisible()) {
      console.log("✅ 월간 보고서 버튼 클릭 가능");
      await monthlyBtn.click();
      await page.waitForNavigation();
      console.log("✅ 월간 보고서 페이지 이동 완료");
      console.log("✅ 최종 URL:", page.url());
    } else {
      console.log("❌ 월간 보고서 버튼을 찾을 수 없음");
    }
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();