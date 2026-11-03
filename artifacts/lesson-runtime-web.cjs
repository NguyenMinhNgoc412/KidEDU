const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { openParentGate } = require("../scripts/parent-gate-web.cjs");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let lastPage;
  try {
    for (const width of [320, 390, 768]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      lastPage = page;
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const received = new Map();
      const batches = [];
      let dropFirstAck = true;
      let learning = false;
      const callsInActivity = [];
      await page.route(/^http:\/\/localhost:(3000|3011)\//, async (route) => {
        const url = new URL(route.request().url());
        if (learning) callsInActivity.push(url.pathname);
        let body;
        const childId = "10000000-0000-4000-8000-000000000011";
        if (url.pathname === "/login")
          body = {
            accessToken: "synthetic-runtime-token",
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          };
        else if (url.pathname === "/v1/me") body = { id: "10000000-0000-4000-8000-000000000010" };
        else if (url.pathname === "/v1/subscription")
          body = {
            state: "active",
            version: 1,
            learningAllowed: true,
            familyDataAllowed: true,
            allowedCapabilities: ["learning.plan.full"],
            serverTime: new Date().toISOString(),
            effectiveUntil: new Date(Date.now() + 86400000).toISOString(),
            accessUntil: new Date(Date.now() + 86400000).toISOString()
          };
        else if (url.pathname === "/v1/children")
          body = [
            {
              id: childId,
              displayName: "Hồ sơ thử",
              version: 1,
              familyId: "10000000-0000-4000-8000-000000000012"
            }
          ];
        else if (url.pathname.endsWith("/plan")) body = { revision: 0, document: null };
        else if (url.pathname.endsWith("/observations"))
          body = { observations: [], nextCursor: null };
        else if (url.pathname.endsWith("/events:batch")) {
          const { events } = route.request().postDataJSON();
          batches.push(events);
          const acknowledgements = events.map((event) => {
            const duplicate = received.has(event.eventId);
            received.set(event.eventId, event);
            return { eventId: event.eventId, status: duplicate ? "duplicate" : "accepted" };
          });
          if (dropFirstAck) {
            dropFirstAck = false;
            await route.abort("failed");
            return;
          }
          body = { results: acknowledgements };
        } else body = [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      });
      async function login() {
        await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
        await page.getByLabel("Mật khẩu").fill("FullAccess123!");
        await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        await page
          .getByRole("button", { name: "Thử bài có lưu tiến độ", exact: true })
          .waitFor({ timeout: 30000 })
          .catch(async (error) => {
            await page.screenshot({
              path: path.join(__dirname, "runtime-failure.png"),
              fullPage: true
            });
            console.log(await page.locator("body").innerText());
            console.log(JSON.stringify(errors));
            throw error;
          });
      }
      async function capture(name) {
        await page.screenshot({
          path: path.join(__dirname, `runtime-${name}-${width}.png`),
          fullPage: true
        });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        );
        assert.equal(overflow, false, `${name} overflows ${width}px`);
      }
      await page.goto("http://localhost:19006/login", {
        waitUntil: "domcontentloaded",
        timeout: 120000
      });
      await login();
      await page.getByRole("button", { name: "Thử bài có lưu tiến độ", exact: true }).click();
      await page.getByRole("button", { name: "Bắt đầu bài đã chuẩn bị" }).waitFor();
      await capture("overview");
      learning = true;
      await page.getByRole("button", { name: "Bắt đầu bài đã chuẩn bị" }).click();
      await page.getByRole("button", { name: "Đã tạo cơ hội, chờ con" }).click();
      assert.equal(
        await page.getByRole("button", { name: "Mời phụ huynh ghi nhận", exact: true }).isEnabled(),
        false
      );
      await page.getByRole("button", { name: "Mời phụ huynh ghi nhận", exact: true }).click();
      await page.getByRole("button", { name: "Nhấn giữ để ghi nhận" }).click({ delay: 1700 });
      await page.getByRole("button", { name: "Độc lập (+) — lưu và tiếp", exact: true }).click();
      await page.getByText("Thử trong sinh hoạt", { exact: true }).waitFor();
      await capture("transfer");
      learning = false;
      assert.deepEqual(callsInActivity, [], "Activity loop made remote requests");
      await page.getByRole("button", { name: "Về học, giữ bài đã lưu" }).click();
      await page.reload({ waitUntil: "domcontentloaded" });
      await login();
      await page.getByRole("button", { name: "Thử bài có lưu tiến độ", exact: true }).click();
      await page.getByText("Bài đang tạm dừng", { exact: true }).waitFor();
      await capture("restored");
      await page.getByRole("button", { name: "Tiếp tục bài đã lưu" }).click();
      await page.getByText("Thử trong sinh hoạt", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Để lúc khác", exact: true }).click();
      await page.getByRole("button", { name: "Nhấn giữ để ghi nhận" }).click({ delay: 1700 });
      await page
        .getByRole("button", { name: "Không quan sát được — lưu và tiếp", exact: true })
        .click();
      await page.getByText("Đã xong bài hôm nay", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Gửi quan sát đã lưu" }).click();
      await page
        .getByText("Quan sát đã lưu trên thiết bị. Có thể gửi lại khi có kết nối.", { exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Gửi quan sát đã lưu" }).click();
      await page.getByText("Quan sát đã được đồng bộ.", { exact: true }).waitFor();
      assert.equal(received.size, 2);
      assert.deepEqual(batches[0], batches[1], "Retry changed event IDs or payloads");
      assert.equal(batches[0][0].payload.result, "independent");
      assert.equal(batches[0][1].payload.result, "not_observed");
      assert.equal(batches[0][1].payload.context, "parent_guided");
      await capture("finished");
      await page.getByRole("button", { name: "Về học, giữ bài đã lưu" }).click();
      await page.getByRole("tab", { name: "Phụ huynh", exact: true }).click();
      if (await page.getByRole("button", { name: "Nhấn giữ để mở khu phụ huynh" }).count())
        await openParentGate(page);
      await page.getByText("Độc lập (+) · Trong bài · Đã đồng bộ", { exact: true }).waitFor();
      await page
        .getByText("Không quan sát được · Trong sinh hoạt · Đã đồng bộ", { exact: true })
        .waitFor();
      assert.deepEqual(errors, []);
      results.push({
        width,
        restoredFromSQLite: true,
        noActivityNetwork: true,
        observations: 2,
        duplicateRetryStable: true,
        parentHistory: true,
        pageErrors: errors
      });
      await context.close();
    }
  } finally {
    if (results.length < 3 && lastPage && !lastPage.isClosed()) {
      await lastPage.screenshot({
        path: path.join(__dirname, "runtime-failure.png"),
        fullPage: true
      });
      console.log(await lastPage.locator("body").innerText());
    }
    await browser.close();
  }
  fs.writeFileSync(
    path.join(__dirname, "lesson-runtime-web-results.json"),
    JSON.stringify(
      {
        evidence:
          "Chromium + real Expo SQLite; API intercepted synthetic fixture, not backend/native proof",
        results
      },
      null,
      2
    )
  );
  console.log(JSON.stringify(results));
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
