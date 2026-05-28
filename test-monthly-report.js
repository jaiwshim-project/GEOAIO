const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("📊 월간 분석 리포트 페이지 로드...");
    await page.goto("http://localhost:3000/monthly-report", { 
      waitUntil: "networkidle",
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    const heading = await page.locator("h1").first().textContent();
    console.log("✅ 페이지 타이틀:", heading?.trim());
    
    // API 테스트: 모든 프로젝트 가져오기
    console.log("\n🔍 API 테스트:");
    const projectsRes = await page.evaluate(() => 
      fetch('/api/all-projects').then(r => r.json())
    );
    console.log("✅ 모든 프로젝트:", projectsRes.projects?.slice(0, 3), "...");
    
    // UI 요소 확인
    const input = await page.locator('input[placeholder*="프로젝트"]').first();
    console.log("✅ 프로젝트 입력 필드: ", await input.isVisible());
    
    const addBtn = await page.locator('button:has-text("추가")').first();
    console.log("✅ 추가 버튼:", await addBtn.isVisible());
    
    // 프로젝트 추가 테스트
    await input.fill("디지털스마일치과");
    await addBtn.click();
    await page.waitForTimeout(2000);
    
    // 탭 확인
    const tab = await page.locator('button:has-text("디지털스마일치과")').first();
    console.log("✅ 프로젝트 탭이 생성됨:", await tab.isVisible());
    
    await page.screenshot({ path: "monthly-report-final.png", fullPage: true });
    console.log("✅ 전체 페이지 스크린샷 저장됨");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();