const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Proposal 페이지로 이동 (URL인코딩된 한글 경로)
    await page.goto("http://localhost:3000/proposal/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC", { waitUntil: "networkidle" });
    
    await page.waitForTimeout(1000);
    
    // 월간 보고서 링크 찾기
    const monthlyReportLink = await page.locator('a[href="/blog/monthly-report"]');
    const linkText = await monthlyReportLink.textContent();
    const linkVisible = await monthlyReportLink.isVisible();
    
    console.log("✅ 월간 보고서 링크 텍스트:", linkText);
    console.log("✅ 링크 표시 여부:", linkVisible);
    
    // 링크 클릭
    await monthlyReportLink.click();
    
    await page.waitForNavigation({ waitUntil: "networkidle" });
    
    const pageUrl = page.url();
    const heading = await page.locator("h1").first().textContent();
    
    console.log("✅ 네비게이션 성공");
    console.log("✅ 최종 URL:", pageUrl);
    console.log("✅ 페이지 헤딩:", heading);
    
    await page.screenshot({ path: "proposal-to-report.png", fullPage: false });
    console.log("✅ Screenshot saved: proposal-to-report.png");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();