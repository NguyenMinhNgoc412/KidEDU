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
const artifacts =
  process.env.KIDEDU_ARTIFACTS_DIR ?? path.join(__dirname, "../artifacts/practice-feature");
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
  let child = children.find((item) => item.displayName === "Local Drag Test Child");
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
      displayName: "Local Drag Test Child"
    });
  }
  const prefix = `/children/${child.id}/practice`;
  const catalog = await call("GET", `${prefix}/catalog`);
  assert.equal(catalog.source, "development_fixture");
  const plays = catalog.lessons.filter(
    (lesson) => lesson.id.startsWith("fixture_play_") && lesson.id !== "fixture_play_today_words"
  );
  assert.equal(plays.length, 13);
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
          goalIds: ["command", "request", "social"],
          selectedLessonId: plays[0].id,
          lessonIds: plays.map((item) => item.id),
          deferredLessonIds: []
        }
      });
      const context = await browser.newContext({ viewport: { width, height: 844 } }),
        page = await context.newPage();
      let active = false;
      const errors = [],
        requests = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          /cannot contain|cannot be a descendant|non-boolean|does not recognize|Unknown event handler/.test(
            message.text()
          )
        )
          errors.push(message.text());
      });
      page.on("request", (request) => {
        if (active && request.url().startsWith(apiOrigin))
          requests.push(new URL(request.url()).pathname);
      });
      async function button(name) {
        await page.getByRole("button", { name, exact: true }).click();
      }
      async function textVisible(text) {
        await page.getByText(text, { exact: true }).filter({ visible: true }).last().waitFor();
      }
      async function capture(name) {
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false
        );
        await page.screenshot({
          path: path.join(artifacts, `play-${name}-${width}.png`),
          fullPage: true
        });
      }
      try {
        await page.goto(`${webOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
        await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
        await page.getByLabel("Mật khẩu").fill("FullAccess123!");
        await button("Đăng nhập");
        await page.getByRole("tab", { name: "Phụ huynh", exact: true }).click();
        await openParentGate(page);
        const gate = page.getByRole("button", {
          name: "Nhấn giữ để mở khu phụ huynh",
          exact: true
        });
        if (await gate.isVisible()) await gate.click({ delay: 2300 });
        await button("Xem hồ sơ Local Drag Test Child");
        await page.getByRole("tab", { name: "Cùng luyện", exact: true }).click();
        await page.getByRole("button", { name: /^(Chuẩn bị|Tiếp tục) buổi luyện$/ }).click();
        await button("Vào buổi cùng luyện");
        await page
          .getByRole("button", { name: /^(Bắt đầu cùng con|Tiếp tục bài đã lưu)$/ })
          .click({ timeout: 60000 });
        active = true;
        for (const [index, lesson] of plays.entries()) {
          await textVisible(`Phần học · Bài ${index + 1}/13`);
          await require("./play-drag-web-actions.cjs")(page, lesson, capture);

          if (index < plays.length - 1)
            assert.equal(
              await page.getByRole("button", { name: "Nhấn giữ để ghi nhận", exact: true }).count(),
              0
            );
          assert.equal(
            await page
              .getByRole("button", { name: /^(Đã tạo cơ hội|Bắt đầu quan sát|Sang bài tiếp theo)/ })
              .count(),
            0
          );
          if (index < plays.length - 1) await textVisible(`Phần học · Bài ${index + 2}/13`);
        }
        await page
          .getByRole("button", { name: "Nhấn giữ để ghi nhận", exact: true })
          .click({ delay: 2300 });
        for (let index = 0; index < 13; index++) {
          await textVisible(`Nhận xét bài ${index + 1}/13`);
          await page.getByRole("radio", { name: "Chưa có dịp quan sát", exact: true }).click();
          await button(
            index === 12 ? "Lưu nhận xét · Hoàn tất phiên" : "Lưu nhận xét · Bài tiếp theo"
          );
        }
        await textVisible("Đã hoàn tất phiên học và nhận xét");
        active = false;
        assert.deepEqual(errors, []);
        assert.deepEqual(requests, []);
        await button("Đồng bộ quan sát");
        await textVisible("Quan sát đã được đồng bộ.");
        results.push({
          width,
          playVariants: 7,
          scenarios: 13,
          directDrag: true,
          endReviews: true,
          noActivityApi: true,
          noBrowserErrors: true
        });
      } catch (error) {
        await page.screenshot({
          path: path.join(artifacts, `play-failure-${width}.png`),
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
    path.join(artifacts, "play-results.json"),
    JSON.stringify({ evidence: "Chromium + real Nest/JWKS/PostgreSQL", results }, null, 2)
  );
  console.log(JSON.stringify(results));
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
