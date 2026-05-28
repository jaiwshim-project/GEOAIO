const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 1. /proposal 메인 페이지 확인
    console.log("1️⃣ /proposal 메인 페이지 확인...");
    await page.goto("http://localhost:3000/proposal", { waitUntil: "networkidle", timeout: 30000 });
    
    const mainBtn = await page.locator('a[href="/blog/monthly-report"]').first();
    const mainBtnVisible = await mainBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(mainBtnVisible ? "  ✅ 월간 보고서 버튼 있음" : "  ❌ 버튼 없음");
    
    // 2. /proposal/[slug] 상세 페이지 확인
    console.log("2️⃣ /proposal/디지털스마일치과 상세 페이지 확인...");
    await page.goto("http://localhost:3000/proposal/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC", { waitUntil: "networkidle", timeout: 30000 });
    
    const detailBtn = await page.locator('a[href="/blog/monthly-report"]').first();
    const detailBtnVisible = await detailBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(detailBtnVisible ? "  ✅ 월간 보고서 버튼 있음" : "  ❌ 버튼 없음");
    
    // 3. 상세 페이지의 상단 메뉴 구조 확인
    console.log("3️⃣ 상세 페이지 상단 구조 확인...");
    const mainElement = await page.locator("main").first();
    const html = await mainElement.innerHTML();
    
    if (html.includes("flex justify-between")) {
      console.log("  ✅ flex justify-between 구조 있음");
    }
    if (html.includes("월간 보고서")) {
      console.log("  ✅ '월간 보고서' 텍스트 있음");
    }
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();