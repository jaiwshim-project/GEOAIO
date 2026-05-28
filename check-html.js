const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto("https://www.geo-aio.com/proposal/%EB%94%94%EC%A7%80%ED%84%B8%EC%8A%A4%EB%A7%88%EC%9D%BC%EC%B9%98%EA%B3%BC", { 
      waitUntil: "networkidle"
    });
    
    // 페이지 HTML 전체
    const html = await page.content();
    
    // 월간 보고서 버튼이 있는지 확인
    if (html.includes("/blog/monthly-report")) {
      console.log("✅ 월간 보고서 링크가 HTML에 포함됨");
    } else {
      console.log("❌ 월간 보고서 링크가 HTML에 없음");
    }
    
    // main 태그 내 flex 구조 확인
    if (html.includes("flex justify-between")) {
      console.log("✅ flex justify-between 구조가 있음");
    } else {
      console.log("❌ flex justify-between 구조가 없음");
    }
    
    // 버튼 관련 코드 확인
    if (html.includes("월간 보고서")) {
      console.log("✅ '월간 보고서' 텍스트가 있음");
    } else {
      console.log("❌ '월간 보고서' 텍스트가 없음");
    }
    
    // 뒤로가기 링크 확인
    if (html.includes("전체 제안서 목록으로")) {
      console.log("✅ '전체 제안서 목록으로' 텍스트가 있음");
    } else {
      console.log("❌ '전체 제안서 목록으로' 텍스트가 없음");
    }
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();