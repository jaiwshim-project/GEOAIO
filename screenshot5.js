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
    
    // 월간 보고서 버튼 찾기
    const reportButton = await page.locator('a:has-text("월간 보고서")').first();
    const isVisible = await reportButton.isVisible();
    
    console.log("✅ 월간 보고서 버튼 표시 여부:", isVisible);
    
    if (isVisible) {
      const href = await reportButton.getAttribute('href');
      console.log("✅ 버튼 href:", href);
      
      await reportButton.click();
      await page.waitForNavigation({ waitUntil: "networkidle" });
      
      const url = page.url();
      const heading = await page.locator("h1").first().textContent();
      console.log("✅ 네비게이션 성공");
      console.log("✅ 최종 URL:", url);
      console.log("✅ 페이지 헤딩:", heading);
      
      await page.screenshot({ path: "monthly-report-final.png", fullPage: false });
      console.log("✅ Screenshot saved");
    }
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();