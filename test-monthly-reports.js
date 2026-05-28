const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 콘솔 메시지 캡처
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  
  try {
    const normalPath = "C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/monthly-reports.html";
    
    console.log("📄 페이지 로드 중...\n");
    await page.goto(`file://${normalPath.replace(/\\/g, '/')}`, { 
      waitUntil: "load",
      timeout: 15000 
    });
    
    console.log("✅ 페이지 로드 완료\n");
    
    // 프로젝트 입력
    console.log("🔍 디지털스마일치과 추가 중...\n");
    await page.locator('input[type="text"]').fill('디지털스마일치과');
    await page.locator('button:has-text("추가")').click();
    
    // API 호출 대기
    await page.waitForTimeout(3000);
    
    // 탭이 생성되었는지 확인
    const tabs = await page.locator('.tab').count();
    console.log(`\n📊 탭 개수: ${tabs}개`);
    
    if (tabs > 0) {
      const tabText = await page.locator('.tab').first().textContent();
      console.log(`  탭 텍스트: ${tabText}`);
      
      // 통계 카드 확인
      const statCards = await page.locator('.stat-card').count();
      console.log(`\n📈 통계 카드: ${statCards}개`);
      
      if (statCards > 0) {
        const values = await Promise.all([
          page.locator('.stat-card').nth(0).locator('.stat-value').textContent(),
          page.locator('.stat-card').nth(1).locator('.stat-value').textContent(),
        ]);
        console.log(`  클리닉 수: ${values[0]}`);
        console.log(`  총 게시물: ${values[1]}`);
      }
    }
    
    await page.screenshot({ path: "monthly-reports-test.png" });
    console.log("\n✅ 스크린샷 저장: monthly-reports-test.png");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();