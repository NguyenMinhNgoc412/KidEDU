const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { openParentGate } = require("./parent-gate-web.cjs");
async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const width = Number(process.env.KIDEDU_PREVIEW_WIDTH ?? 390);
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto(`${process.env.KIDEDU_WEB_ORIGIN ?? "http://localhost:19007"}/login`);
    await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("FullAccess123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    for (const [label, file] of [
      ["Tập nói", "speech"],
      ["Trò chơi", "games"],
      ["Bộ sưu tập", "collection"],
      ["Phụ huynh", "parent"]
    ]) {
      await page.getByRole("tab", { name: label, exact: true }).click({ timeout: 60000 });
      if (label === "Phụ huynh") await openParentGate(page);
      await page.getByRole("tab", { name: label, exact: true }).waitFor();
      await page.screenshot({ path: `artifacts/c50-tab-${file}-${width}.png`, fullPage: true });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false
      );
    }
    console.log(`C50 four tabs and Parent Gate: ${width}px passed`);
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
