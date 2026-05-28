const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto("http://localhost:3000/blog/monthly-report", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ path: "monthly-report-full.png", fullPage: true });
    console.log("✅ 월간 보고서 전체 페이지 스크린샷 저장됨");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();