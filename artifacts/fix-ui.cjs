const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { openParentGate } = require("../scripts/parent-gate-web.cjs");
const fs = require("node:fs");
const path = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of [320, 390, 768]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let allowed = true;
      await page.route(/^http:\/\/localhost:(3000|3011)\//, async (route) => {
        const url = new URL(route.request().url());
        let body;
        if (url.pathname === "/login")
          body = {
            accessToken: "synthetic-ui-review-token",
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          };
        else if (url.pathname === "/v1/me") body = { id: "10000000-0000-4000-8000-000000000010" };
        else if (url.pathname === "/v1/subscription")
          body = {
            state: allowed ? "active" : "expired",
            version: 1,
            effectiveUntil: new Date(Date.now() + 86400000).toISOString(),
            accessUntil: new Date(Date.now() + 86400000).toISOString(),
            learningAllowed: allowed,
            allowedCapabilities: allowed ? ["learning.plan.full"] : [],
            familyDataAllowed: true,
            serverTime: new Date().toISOString()
          };
        else if (url.pathname === "/v1/children")
          body = [
            {
              id: "10000000-0000-4000-8000-000000000011",
              displayName: "Bé minh họa",
              familyId: "10000000-0000-4000-8000-000000000012",
              version: 1
            },
            {
              id: "10000000-0000-4000-8000-000000000013",
              displayName: "Hồ sơ minh họa hai",
              familyId: "10000000-0000-4000-8000-000000000012",
              version: 1
            }
          ];
        else if (url.pathname.endsWith("/plan"))
          body = url.pathname.includes("000000000013")
            ? {
                revision: 1,
                document: {
                  schemaVersion: 1,
                  contentReleaseId: "synthetic-release",
                  goalIds: ["synthetic-goal"],
                  items: [
                    { lessonId: "synthetic-lesson-one", lessonVersion: 1 },
                    { lessonId: "synthetic-lesson-two", lessonVersion: 1 }
                  ]
                }
              }
            : { revision: 0, document: null };
        else if (url.pathname.endsWith("/observations"))
          body = { observations: [], nextCursor: null };
        else body = [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      });
      await page.goto("http://localhost:19006/login", {
        waitUntil: "domcontentloaded",
        timeout: 120000
      });
      await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
      await page.getByLabel("Mật khẩu").fill("FullAccess123!");
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      await page.getByText("Luyện thêm", { exact: true }).waitFor({ timeout: 60000 });
      async function capture(name) {
        await page.screenshot({
          path: path.join(__dirname, `fixed-${name}-${width}.png`),
          fullPage: true
        });
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          controls: [...document.querySelectorAll('[role="button"],[role="tab"]')].map((el) => {
            const r = el.getBoundingClientRect();
            return {
              label: el.getAttribute("aria-label") || el.textContent,
              width: r.width,
              height: r.height
            };
          })
        }));
        results.push({ width, screen: name, ...metrics });
      }
      await capture("child-allowed");
      await page.getByRole("tab", { name: "Phụ huynh" }).click();
      await page.getByRole("button", { name: "Nhấn giữ để mở khu phụ huynh" }).click();
      assert.equal(await page.getByText("Cùng con mỗi ngày", { exact: true }).count(), 0);
      if (width === 320) {
        await page.getByRole("button", { name: "Nhấn giữ để mở khu phụ huynh" }).focus();
        await page.keyboard.down("Space");
        await delay(1700);
        await page.keyboard.up("Space");
      } else {
        await openParentGate(page);
      }
      await page.getByText("Cùng con mỗi ngày").waitFor();
      results.push({ width, shortTapRejected: true });
      await capture("parent");
      await page.getByRole("button", { name: "Xem bản mẫu", exact: true }).click();
      await page.getByRole("button", { name: "Xem bài hôm nay" }).click();
      await page.getByRole("button", { name: "Bắt đầu cùng con" }).click();
      await capture("prototype-activity");
      await page.getByRole("button", { name: "Mời phụ huynh ghi nhận" }).click();
      await page.getByRole("button", { name: "Tôi là phụ huynh" }).click();
      await page.getByRole("button", { name: "Có hỗ trợ (+/-)", exact: true }).click();
      await page.getByRole("button", { name: "Gợi ý tự nhiên và chờ", exact: true }).click();
      await page.getByRole("button", { name: "Kết thúc bài", exact: true }).click();
      await page.getByText("Đã xong bài hôm nay").waitFor();
      await page.getByRole("button", { name: "Rời mẫu luồng" }).click();
      await page.getByRole("button", { name: "Xem hồ sơ Hồ sơ minh họa hai" }).click();
      await page.getByText("2 bài trong kế hoạch").last().waitFor();
      await page.getByRole("button", { name: "Về học", exact: true }).click();
      await page.getByText("Kế hoạch đã lưu có 2 bài.", { exact: false }).last().waitFor();
      results.push({ width, selectedChildPlanPersistsOnToday: true });
      allowed = false;
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.getByRole("textbox", { name: "Email" }).fill("parent@local.kidedu.test");
      await page.getByLabel("Mật khẩu").fill("LocalTest123!");
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      await page.getByText("Nội dung học đang khóa", { exact: true }).waitFor();
      await capture("child-locked");
      results.push({ width, prototypeCompleted: true, pageErrors: errors });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    path.join(__dirname, "fixed-ui-results.json"),
    JSON.stringify(
      {
        evidence: "Chromium UI with synthetic intercepted API; no backend or native proof",
        results
      },
      null,
      2
    )
  );
  console.log(JSON.stringify(results));
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
