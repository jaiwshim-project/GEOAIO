const { chromium } = require("@playwright/test");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 콘솔 메시지 캡처
  page.on('console', msg => console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('error', err => console.log(`[ERROR] ${err.message}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));
  
  try {
    const filePath = "file:///C:/01%20클로드코드/40-10%20GEO-AIO%20콘텐츠(41-4%20AI%20Optimized%20Contents)/monthly-reports.html";
    const normalPath = "C:/01 클로드코드/40-10 GEO-AIO 콘텐츠(41-4 AI Optimized Contents)/monthly-reports.html";
    
    console.log("📁 파일 확인:");
    if (fs.existsSync(normalPath)) {
      const size = fs.statSync(normalPath).size;
      console.log(`  ✅ 파일 존재: ${size} bytes`);
    } else {
      console.log(`  ❌ 파일 없음: ${normalPath}`);
      process.exit(1);
    }
    
    console.log("\n📄 페이지 로드 중...");
    await page.goto(`file://${normalPath.replace(/\\/g, '/')}`, { 
      waitUntil: "networkidle",
      timeout: 10000 
    });
    
    await page.waitForTimeout(2000);
    
    // 페이지 내용 확인
    const body = await page.locator('body').innerHTML();
    const hasContent = body.length > 500;
    
    console.log(`\n📊 페이지 내용: ${body.length} bytes`);
    console.log(`  ${hasContent ? '✅' : '❌'} 콘텐츠 있음: ${hasContent}`);
    
    // 헤더 확인
    const header = await page.locator('header h1').textContent();
    console.log(`  헤더: ${header || '없음'}`);
    
    // input 요소 확인
    const input = await page.locator('input[type="text"]').count();
    console.log(`  입력 필드: ${input}개`);
    
    // 스크린샷
    await page.screenshot({ path: "monthly-reports-debug.png" });
    console.log("\n✅ 스크린샷 저장: monthly-reports-debug.png");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();