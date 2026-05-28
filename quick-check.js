const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("🔍 /proposal 메인 페이지에서 버튼 확인...");
    
    await page.goto("http://localhost:3000/proposal", { 
      waitUntil: "networkidle",
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // 월간 보고서 버튼 찾기
    const btn = await page.locator('a[href="/blog/monthly-report"]');
    const count = await btn.count();
    
    if (count > 0) {
      const text = await btn.first().textContent();
      console.log("✅ 월간 보고서 버튼 찾음:", text.trim());
      
      const isVisible = await btn.first().isVisible();
      console.log("✅ 버튼 표시 여부:", isVisible);
    } else {
      console.log("❌ 월간 보고서 버튼이 없음");
      
      // 페이지에 있는 모든 링크 출력
      const allLinks = await page.locator("a");
      const linkCount = await allLinks.count();
      console.log("ℹ️  전체 링크 개수:", linkCount);
    }
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();