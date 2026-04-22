---
name: screenshot
description: "Desktop/webpage screenshot capture and analysis"
triggers:
  - "screenshot"
  - "screen capture"
  - "capture screen"
  - "스크린샷"
  - "캡쳐"
  - "화면 캡쳐"
  - "스크린샷 캡쳐"
  - "화면 확인"
---

# Screenshot Capture Skill

User requests a screenshot → capture the current screen and analyze it.

## Desktop Screenshot (default)

Use PowerShell System.Drawing to capture the full desktop:

```bash
powershell -Command "Add-Type -AssemblyName System.Windows.Forms, System.Drawing; \$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; \$bitmap = New-Object System.Drawing.Bitmap(\$bounds.Width, \$bounds.Height); \$graphics = [System.Drawing.Graphics]::FromImage(\$bitmap); \$graphics.CopyFromScreen(\$bounds.Location, [System.Drawing.Point]::Empty, \$bounds.Size); \$bitmap.Save('<OUTPUT_PATH>', [System.Drawing.Imaging.ImageFormat]::Png); \$graphics.Dispose(); \$bitmap.Dispose()"
```

### Steps:
1. Run the PowerShell command above via Bash tool
   - Replace `<OUTPUT_PATH>` with a temp path like `C:/01 클로드코드/40-10 GEO-AIO 콘텐츠/screenshot_temp.png`
2. Read the saved PNG file using the Read tool to view the image
3. Analyze the screen contents and respond to the user's context
4. Clean up: delete the temp screenshot file after analysis

### Notes:
- This captures the **entire primary monitor**
- The image is read as a multimodal input (Claude can see images)
- Always describe what you see on screen to the user
- If the user asks to check something specific, focus analysis on that area

## Webpage Screenshot (when URL is provided)

Use puppeteer-core (globally installed) for web page captures:

```javascript
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();
```

### When to use webpage screenshot:
- User provides a specific URL to capture
- Need to verify deployed web page appearance
- Full-page capture needed (scrollable content)

## Quick Reference

| Trigger | Action |
|---------|--------|
| "스크린샷 캡쳐해" | Desktop screenshot → analyze |
| "화면 확인해" | Desktop screenshot → analyze |
| "이 URL 캡쳐해" | Webpage screenshot via puppeteer |
| "스크린샷 캡쳐해서 확인해" | Desktop screenshot → analyze + advise next steps |
