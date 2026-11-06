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
  const results = [];
  fs.mkdirSync(artifacts, { recursive: true });
  try {
    for (const width of [320, 390, 768]) {
      const existing = await call("GET", `${prefix}/plan`);
      await call("PUT", `${prefix}/plan`, {
        expectedRevision: existing.revision,
        document: {
          schemaVersion: 1,
          curriculumVersion: catalog.version,
          goalIds: ["command"],
          selectedLessonId: "fixture_lesson_two_steps",
          deferredLessonIds: []
        }
      });
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      const errors = [],
        activityRequests = [];
      let inActivity = false;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (inActivity && request.url().startsWith(apiOrigin))
          activityRequests.push(new URL(request.url()).pathname);
      });
      async function capture(name) {
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false
        );
        await page.screenshot({
          path: path.join(artifacts, `course-${name}-${width}.png`),
          fullPage: true
        });
      }
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
        await page
          .getByText(`Một phiên · ${catalog.lessons.length} bài học`, { exact: true })
          .waitFor();
        await capture("hub");
        await page.getByRole("button", { name: /^(Chuẩn bị|Tiếp tục) buổi luyện$/ }).click();
        await page.getByText("Học hết phiên rồi mới nhận xét", { exact: true }).waitFor();
        await capture("preparation");
        await page
          .getByRole("button", { name: "Vào buổi cùng luyện", exact: true })
          .click({ timeout: 60000 });
        await page
          .getByRole("button", { name: /^(Bắt đầu cùng con|Tiếp tục bài đã lưu)$/ })
          .click({ timeout: 60000 });
        inActivity = true;
        for (let index = 0; index < catalog.lessons.length; index++) {
          await page
            .getByText(`Phần học · Bài ${index + 1}/${catalog.lessons.length}`, { exact: true })
            .waitFor();
          assert.equal(
            await page.getByText(/^Nhận xét bài \d+\//).count(),
            0,
            "Review interrupted learning"
          );
          assert.equal(
            await page.getByRole("button", { name: "Nhấn giữ để ghi nhận", exact: true }).count(),
            0
          );
          if (index === 0) {
            await page.getByRole("button", { name: "Đã tạo cơ hội, chờ con", exact: true }).click();
            await page.getByRole("button", { name: "Thêm gợi ý", exact: true }).click();
            await capture("learning");
            await page.getByRole("button", { name: "Sang bài tiếp theo", exact: true }).click();
          } else await page.getByRole("button", { name: "Để lúc khác", exact: true }).click();
        }
        await page.getByText("Một chút dành cho phụ huynh", { exact: true }).waitFor();
        await capture("review-gate");
        await page
          .getByRole("button", { name: "Nhấn giữ để ghi nhận", exact: true })
          .click({ delay: 2300 });
        for (let index = 0; index < catalog.lessons.length; index++) {
          await page
            .getByText(`Nhận xét bài ${index + 1}/${catalog.lessons.length}`, { exact: true })
            .waitFor();
          await page
            .getByRole("radio", {
              name: index === 0 ? "Con thực hiện khi có hỗ trợ" : "Chưa có dịp quan sát",
              exact: true
            })
            .click();
          if (index === 0) await capture("review");
          await page
            .getByRole("button", {
              name:
                index === catalog.lessons.length - 1
                  ? "Lưu nhận xét · Hoàn tất phiên"
                  : "Lưu nhận xét · Bài tiếp theo",
              exact: true
            })
            .click();
        }
        await page.getByText("Đã hoàn tất phiên học và nhận xét", { exact: true }).waitFor();
        await capture("finished");
        inActivity = false;
        assert.deepEqual(errors, []);
        assert.deepEqual(activityRequests, []);
        await page.getByRole("button", { name: "Đồng bộ quan sát", exact: true }).click();
        await page.getByText("Quan sát đã được đồng bộ.", { exact: true }).waitFor();
        const remote = (await call("GET", `${prefix}/checkpoints`)).checkpoints.find(
          (item) =>
            item.document.course?.lessonIds.length === catalog.lessons.length &&
            item.document.phase === "finished"
        );
        assert(remote, "No finished multi-lesson checkpoint");
        const observations = (
          await call("GET", `/children/${child.id}/observations`)
        ).observations.filter((item) => item.sessionId === remote.sessionId);
        assert.equal(observations.length, catalog.lessons.length);
        assert.equal(observations.filter((item) => item.result === "supported").length, 1);
        assert.equal(
          observations.filter((item) => item.result === "not_observed").length,
          catalog.lessons.length - 1
        );
        results.push({
          width,
          lessons: catalog.lessons.length,
          reviewOnlyAfterLearning: true,
          oneReviewPerLesson: true,
          realBackend: true,
          atomicSync: true,
          noActivityNetwork: true
        });
      } catch (error) {
        await page.screenshot({
          path: path.join(artifacts, `course-failure-${width}.png`),
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
    path.join(artifacts, "course-results.json"),
    JSON.stringify({ evidence: "Chromium + real local Nest/JWKS/PostgreSQL", results }, null, 2)
  );
  console.log(JSON.stringify(results));
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
