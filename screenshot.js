const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to http://localhost:3000/blog/monthly-report...");
    await page.goto("http://localhost:3000/blog/monthly-report", { waitUntil: "networkidle" });
    
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log("✅ Page Title:", title);
    
    const heading = await page.locator("h1").first();
    const headingText = await heading.textContent();
    console.log("✅ Main Heading:", headingText);
    
    const statsCards = await page.locator("[class*='border-l-4']");
    const statsCount = await statsCards.count();
    console.log("✅ Stats Cards Count:", statsCount);
    
    const clinicCards = await page.locator("[class*='hover:shadow-md']");
    const clinicCount = await clinicCards.count();
    console.log("✅ Clinic Data Cards Count:", clinicCount);
    
    const monthSelect = await page.locator("select");
    const monthValue = await monthSelect.inputValue();
    console.log("✅ Selected Month:", monthValue);
    
    await page.screenshot({ path: "monthly-report.png", fullPage: true });
    console.log("✅ Screenshot saved: monthly-report.png");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();