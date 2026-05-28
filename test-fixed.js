const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() !== 'warn') {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  try {
    const normalPath = "C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/monthly-reports.html";
    
    console.log("📄 테스트 페이지 로드...\n");
    await page.goto(`file://${normalPath.replace(/\\/g, '/')}`, { 
      waitUntil: "load",
      timeout: 15000 
    });
    
    console.log("✅ 페이지 로드 완료\n");
    console.log("🔍 디지털스마일치과 추가 중...\n");
    
    await page.locator('input[type="text"]').fill('디지털스마일치과');
    await page.locator('button:has-text("추가")').click();
    
    console.log("⏳ 데이터 로드 중 (5초 대기)...\n");
    await page.waitForTimeout(5000);
    
    // 통계 확인
    const statValues = await page.locator('.stat-value').allTextContents();
    
    if (statValues.length >= 2) {
      console.log("✅ 데이터 로드 성공!\n");
      console.log("📊 통계:");
      console.log(`  클리닉 수: ${statValues[0]}`);
      console.log(`  총 게시물: ${statValues[1]}`);
      if (statValues[2]) console.log(`  총 조회수: ${statValues[2]}`);
      if (statValues[3]) console.log(`  평균 조회: ${statValues[3]}`);
    } else {
      console.log("⚠️ 통계 데이터를 찾을 수 없음");
    }
    
    await page.screenshot({ path: "monthly-reports-fixed.png" });
    console.log("\n✅ 스크린샷 저장");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();