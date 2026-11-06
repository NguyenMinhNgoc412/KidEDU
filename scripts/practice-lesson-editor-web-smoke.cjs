const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { openParentGate } = require("./parent-gate-web.cjs");
try {
  process.loadEnvFile(path.join(__dirname, "../.env"));
} catch {
  /* explicit env is also supported */
}
const apiOrigin =
  process.env.KIDEDU_API_ORIGIN ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const identityOrigin =
  process.env.KIDEDU_IDENTITY_ORIGIN ??
  process.env.EXPO_PUBLIC_LOCAL_IDENTITY_URL ??
  "http://localhost:3011";
const webOrigin = process.env.KIDEDU_WEB_ORIGIN ?? "http://localhost:19006";
const artifacts = path.join(__dirname, "../artifacts/practice-feature");
async function run() {
  // Refuse to mutate a remote account. All records belong to the seeded local test account.
  const host = new URL(apiOrigin).hostname;
  assert(/^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(host));
  const login = await globalThis.fetch(`${identityOrigin}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "fullaccess@local.kidedu.test", password: "FullAccess123!" })
  });
  assert.equal(login.status, 200);
  const { accessToken } = await login.json();
  async function call(method, endpoint, body) {
    const response = await globalThis.fetch(`${apiOrigin}/v1${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const result = await response.json();
    assert(response.ok, `API ${endpoint} failed (${response.status})`);
    return result;
  }
  assert.equal((await call("GET", "/me")).id, "00000000-0000-4000-8000-000000000002");
  const children = await call("GET", "/children");
  let child = children.find((item) => item.displayName === "Local Practice Test Child");
  if (!child) {
    const families = await call("GET", "/families");
    const family = families[0] ?? (await call("POST", "/families", {}));
    await call("POST", "/consents", {
      scope: "child_profile",
      documentVersion: "local-test-v1",
      action: "grant",
      attestsGuardian: true
    });
    child = await call("POST", "/children", {
      familyId: family.id,
      displayName: "Local Practice Test Child"
    });
  }
  const prefix = `/children/${child.id}/practice`;
  const catalog = await call("GET", `${prefix}/catalog`);
  assert.equal(catalog.source, "development_fixture");
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(artifacts, { recursive: true });
  const results = [];
  try {
    for (const width of [320, 390, 768]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(`${webOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
        await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
        await page.getByLabel("Mật khẩu").fill("FullAccess123!");
        await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        await page.getByRole("tab", { name: "Phụ huynh", exact: true }).click();
        await openParentGate(page);
        const gate = page.getByRole("button", {
          name: "Nhấn giữ để mở khu phụ huynh",
          exact: true
        });
        if (await gate.isVisible()) await gate.click({ delay: 2300 });
        await page
          .getByRole("button", { name: "Xem hồ sơ Local Practice Test Child", exact: true })
          .click();
        await page.getByRole("tab", { name: "Cùng luyện", exact: true }).click();
        const edit = page.getByRole("button", { name: "Chỉnh sửa bài trong phiên", exact: true });
        if (await edit.isVisible()) await edit.click();
        else
          await page
            .getByRole("button", { name: "Cùng phụ huynh chọn mục tiêu", exact: true })
            .click();
        await openParentGate(page);
        if (await gate.isVisible()) await gate.click({ delay: 2300 });
        await page
          .getByText("Chỉnh bài trong phiên", { exact: true })
          .filter({ visible: true })
          .last()
          .waitFor();
        async function pressSave(name) {
          const response = page.waitForResponse(
            (response) =>
              response.url().endsWith(`${prefix}/plan`) && response.request().method() === "PUT"
          );
          await page.getByRole("button", { name, exact: true }).click();
          assert.equal((await response).status(), 200);
        }
        const current = await call("GET", `${prefix}/plan`);
        if (current.document?.lessonIds?.length !== 0) await pressSave("Bỏ chọn tất cả");
        assert.deepEqual((await call("GET", `${prefix}/plan`)).document.lessonIds, []);
        await page
          .getByText("Chưa chọn bài nào. Thêm bài bên dưới để tạo phiên học.", { exact: true })
          .waitFor();
        await pressSave("Thêm Con muốn bóng vào phiên");
        await pressSave("Thêm Con gọi tên ba vào phiên");
        await pressSave("Đưa Con muốn bóng xuống");
        assert.deepEqual((await call("GET", `${prefix}/plan`)).document.lessonIds, [
          "fixture_lesson_naming",
          "fixture_lesson_ball"
        ]);
        await pressSave("Bỏ Con muốn bóng khỏi phiên");
        await pressSave("Thêm Con muốn bóng vào phiên");
        await page
          .getByText("Đã chọn 2 bài", { exact: true })
          .filter({ visible: true })
          .last()
          .waitFor();
        await page.evaluate(() => {
          for (const element of document.querySelectorAll("*"))
            if (element.scrollTop) element.scrollTop = 0;
        });
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false
        );
        await page.screenshot({
          path: path.join(artifacts, `lesson-editor-${width}.png`),
          fullPage: true
        });
        await page.getByRole("button", { name: "Về cùng luyện", exact: true }).click();
        await page
          .getByText("Một phiên · 2 bài học", { exact: true })
          .filter({ visible: true })
          .last()
          .waitFor();
        await page.getByRole("button", { name: /^(Chuẩn bị|Tiếp tục) buổi luyện$/ }).click();
        await page
          .getByText("Một phiên · 2 bài học", { exact: true })
          .filter({ visible: true })
          .last()
          .waitFor();
        await page
          .getByText("1. Con gọi tên ba", { exact: true })
          .filter({ visible: true })
          .last()
          .waitFor({ timeout: 60000 });
        await page
          .getByText("2. Con muốn bóng", { exact: true })
          .filter({ visible: true })
          .last()
          .waitFor();
        await page.getByRole("button", { name: "Vào buổi cùng luyện", exact: true }).click();
        await page
          .getByRole("button", { name: /^(Bắt đầu cùng con|Tiếp tục bài đã lưu)$/ })
          .click({ timeout: 60000 });
        for (let index = 0; index < 2; index++) {
          await page
            .getByText(`Phần học · Bài ${index + 1}/2`, { exact: true })
            .filter({ visible: true })
            .last()
            .waitFor();
          await page.getByRole("button", { name: "Để lúc khác", exact: true }).click();
        }
        await page
          .getByRole("button", { name: "Nhấn giữ để ghi nhận", exact: true })
          .click({ delay: 2300 });
        for (let index = 0; index < 2; index++) {
          await page.getByText(`Nhận xét bài ${index + 1}/2`, { exact: true }).waitFor();
          await page.getByRole("radio", { name: "Chưa có dịp quan sát", exact: true }).click();
          await page
            .getByRole("button", {
              name: index === 1 ? "Lưu nhận xét · Hoàn tất phiên" : "Lưu nhận xét · Bài tiếp theo",
              exact: true
            })
            .click();
        }
        await page.getByText("Đã hoàn tất phiên học và nhận xét", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Đồng bộ quan sát", exact: true }).click();
        await page.getByText("Quan sát đã được đồng bộ.", { exact: true }).waitFor();
        const checkpoints = (await call("GET", `${prefix}/checkpoints`)).checkpoints;
        assert(
          checkpoints.some(
            (item) =>
              item.document.phase === "finished" &&
              JSON.stringify(item.document.course?.lessonIds) ===
                JSON.stringify(["fixture_lesson_naming", "fixture_lesson_ball"])
          )
        );
        assert.deepEqual(errors, []);
        results.push({
          width,
          addRemove: true,
          reorder: true,
          emptySelection: true,
          serverPersists: true,
          preparationMatches: true,
          selectedLessonsRunAndReview: true
        });
      } catch (error) {
        await page.screenshot({
          path: path.join(artifacts, `lesson-editor-failure-${width}.png`),
          fullPage: true
        });
        console.error(await page.locator("body").innerText());
        throw error;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    path.join(artifacts, "lesson-editor-results.json"),
    JSON.stringify({ evidence: "Chromium + real Nest/JWKS/PostgreSQL", results }, null, 2)
  );
  console.log(JSON.stringify(results));
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
