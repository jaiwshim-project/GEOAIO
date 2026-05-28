const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("⏳ Proposal 페이지 로드 중...");
    
    // Proposal 페이지로 이동 (URL인코딩된 한글 경로)
    await page.goto("http://localhost:3000/proposal/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC", { 
      waitUntil: "networkidle",
      timeout: 60000 
    });
    
    console.log("✅ 페이지 로드 완료");
    
    await page.waitForTimeout(3000);
    
    // 모든 링크 찾기
    const allLinks = await page.locator('a').all();
    console.log("ℹ️  총 링크 개수:", allLinks.length);
    
    // 월간 보고서 텍스트를 포함한 링크 찾기
    for (let link of allLinks) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text && text.includes('월간') && text.includes('보고')) {
        console.log("✅ 월간 보고서 링크 찾음:", text.trim(), "→", href);
      }
    }
    
    // 월간 보고서 버튼 클릭
    const reportButton = await page.locator('a:has-text("월간 보고서")').first();
    const isVisible = await reportButton.isVisible();
    
    console.log("✅ 월간 보고서 버튼 표시 여부:", isVisible);
    
    if (isVisible) {
      await reportButton.click();
      await page.waitForNavigation({ waitUntil: "networkidle" });
      
      const url = page.url();
      const heading = await page.locator("h1").first().textContent();
      console.log("✅ 클릭 성공");
      console.log("✅ URL:", url);
      console.log("✅ 헤딩:", heading);
      
      await page.screenshot({ path: "proposal-click-success.png", fullPage: false });
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