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
    const lessons = catalog.lessons.filter((lesson) =>
      ["model", "recognition", "naming", "cloze", "sentence", "yes_no", "visual_qa"].includes(
        lesson.goalId
      )
    );
    assert.equal(lessons.length, 7);
    for (const lesson of lessons) {
      const plan = await call("GET", `${prefix}/plan`);
      await call("PUT", `${prefix}/plan`, {
        expectedRevision: plan.revision,
        document: {
          schemaVersion: 1,
          curriculumVersion: catalog.version,
          goalIds: [lesson.goalId],
          selectedLessonId: lesson.id,
          deferredLessonIds: []
        }
      });
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const errors = [],
        requests = [];
      let active = false;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (active && request.url().startsWith(apiOrigin))
          requests.push(new URL(request.url()).pathname);
      });
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
        await page.getByText(lesson.title, { exact: true }).first().waitFor();
        await page.getByRole("button", { name: /^(Chuẩn bị|Tiếp tục) buổi luyện$/ }).click();
        await page
          .getByRole("button", { name: "Vào buổi cùng luyện", exact: true })
          .click({ timeout: 45000 });
        await page
          .getByRole("button", {
            name: /^(Bắt đầu cùng con|Tiếp tục cùng con|Tiếp tục bài đã lưu)$/,
            exact: true
          })
          .click({ timeout: 45000 });
        active = true;
        if (["model", "recognition", "cloze"].includes(lesson.goalId)) {
          await page
            .getByRole("button", {
              name: /^(Sang bài tiếp theo|Học xong · Nhận xét cuối phiên)$/,
              exact: true
            })
            .waitFor({ timeout: 30000 });
        }
        if (lesson.goalId === "naming") {
          await page
            .getByText("Cho con cơ hội tự gọi tên. Chưa phát mẫu.", { exact: true })
            .waitFor();
          assert.equal(
            await page.getByRole("button", { name: "Nghe âm mẫu", exact: true }).count(),
            0
          );
        }
        if (lesson.goalId === "recognition") {
          await page.getByRole("button", { name: "Ba", exact: true }).click();
          await page
            .getByText("Con đã chọn. Cùng người lớn quan sát nhé.", { exact: true })
            .waitFor();
        }
        if (lesson.goalId === "yes_no") {
          for (const name of ["Có", "Không"])
            await page.getByRole("button", { name, exact: true }).click();
          await page.getByText("Cảm ơn con đã cho biết.", { exact: true }).waitFor();
        }
        if (lesson.goalId === "cloze") await page.getByText("Ba…", { exact: true }).waitFor();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false
        );
        await page.screenshot({
          path: path.join(artifacts, `media-${lesson.goalId}-390.png`),
          fullPage: true
        });
        assert.deepEqual(errors, []);
        assert.deepEqual(requests, []);
        active = false;
        await page
          .getByRole("button", { name: "Về cùng luyện, giữ buổi đã lưu", exact: true })
          .click();
        await page.getByRole("tab", { name: "Cùng luyện", exact: true }).waitFor();
        if (lesson.goalId === "visual_qa") {
          await page.getByRole("button", { name: "Nhờ phụ huynh điều chỉnh", exact: true }).click();
          await openParentGate(page);
          await page
            .getByRole("button", { name: "Media gia đình cho Con gọi tên ba", exact: true })
            .click();
          const picker = page.waitForEvent("filechooser");
          await page.getByRole("button", { name: "Chọn ảnh lựa chọn 1", exact: true }).click();
          await (
            await picker
          ).setFiles(path.join(__dirname, "../assets/default-media/item-me/illustration-v2.jpg"));
          await page.getByText("Xem trước bản thay thế", { exact: true }).waitFor();
          await page.screenshot({
            path: path.join(artifacts, "family-preview-390.png"),
            fullPage: true
          });
          await page.getByRole("button", { name: "Xác nhận dùng media này", exact: true }).click();
          await page
            .getByText("Đã lưu cho buổi mới. Buổi đang dở giữ media đã chuẩn bị.", { exact: true })
            .waitFor();
          const download = page.waitForEvent("download");
          await page
            .getByRole("button", { name: "Xuất bản gia đình ảnh lựa chọn 1", exact: true })
            .click();
          assert((await (await download).suggestedFilename()).startsWith("kidedu-family-image"));
          await page
            .getByRole("button", { name: "Dùng lại mẫu ảnh lựa chọn 1", exact: true })
            .click();
          await page
            .getByText("Buổi mới sẽ dùng mẫu mặc định cho vai trò này.", { exact: true })
            .waitFor();
          results.push({
            familyPreviewCommitAndFallback: true,
            historyFilters:
              (await page.getByRole("button", { name: "Tất cả mục tiêu", exact: true }).count()) ===
              1
          });
        }
        results.push({
          lessonId: lesson.id,
          goalId: lesson.goalId,
          preparedLocalMedia: true,
          noActivityNetwork: true,
          parentObservationOnly: true
        });
      } catch (error) {
        await page.screenshot({
          path: path.join(artifacts, `media-failure-${lesson.goalId}.png`),
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
    path.join(artifacts, "media-results.json"),
    JSON.stringify({ evidence: "Real local API, JWKS and PostgreSQL, Chromium", results }, null, 2)
  );
  console.log(JSON.stringify(results));
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
