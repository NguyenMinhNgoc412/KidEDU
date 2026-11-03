const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { openParentGate } = require("./parent-gate-web.cjs");

const origin = process.env.KIDEDU_WEB_ORIGIN ?? "http://localhost:19006";
const apiOrigin = process.env.KIDEDU_API_ORIGIN ?? "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const ready = await page.request.get(`${apiOrigin}/health/ready`);
    assert.equal(ready.status(), 200, "Local API readiness failed");
    const unauthenticated = await page.request.get(`${apiOrigin}/v1/me`);
    assert.equal(unauthenticated.status(), 401, "Local API exposed /v1/me without a token");

    const home = await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(home?.status(), 200);
    await page.getByRole("textbox", { name: "Email" }).fill("parent@local.kidedu.test");
    await page.getByLabel("Mật khẩu").fill("LocalTest123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByRole("tab", { name: "Phụ huynh" }).click();
    await openParentGate(page);
    await page.getByRole("button", { name: "Xem bản mẫu", exact: true }).click();
    await page.getByRole("button", { name: "Xem bài hôm nay", exact: true }).waitFor();
    await page.getByRole("button", { name: "Xem bài hôm nay" }).click();
    await page.getByRole("button", { name: "Bắt đầu cùng con" }).click();
    await page.getByRole("button", { name: "Mời phụ huynh ghi nhận" }).click();
    await page.getByRole("button", { name: "Tôi là phụ huynh" }).click();
    await page.getByRole("button", { name: "Có hỗ trợ (+/-)" }).click();
    await page.getByRole("button", { name: "Gợi ý tự nhiên và chờ" }).click();
    await page.getByRole("button", { name: "Kết thúc bài" }).click();
    await page.getByText("Đã xong bài hôm nay").waitFor();
    const overflow = await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth
    );
    assert.equal(overflow, false, "Prototype overflows a 390px viewport");
    assert.deepEqual(pageErrors, []);
    console.log(
      "Local API and web flow passed: Home → Today → activity → observation → transfer → finish"
    );
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
