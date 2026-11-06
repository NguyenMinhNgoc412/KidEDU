const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { openParentGate } = require("./parent-gate-web.cjs");
const lockedDrag = require("./drag-scroll-lock-web.cjs");

async function run() {
  const width = Number(process.env.KIDEDU_PREVIEW_WIDTH ?? 390);
  assert.ok([320, 390, 768].includes(width));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    let dailyMutations = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().includes("/daily-game") && request.method() !== "GET") dailyMutations++;
    });
    await page.goto(`${process.env.KIDEDU_WEB_ORIGIN ?? "http://localhost:8081"}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 120000
    });
    await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("FullAccess123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByRole("tab", { name: "Phụ huynh", exact: true }).click({ timeout: 60000 });
    await openParentGate(page);
    await page.getByRole("button", { name: "Thử ba trò chơi (local)", exact: true }).click();
    await page.getByText("Bản thử ba trò chơi", { exact: true }).waitFor();
    await page.screenshot({ path: `artifacts/c50-preview-shadow-${width}.png`, fullPage: true });
    const rounds = [
      ["bong", "gau", "xe"],
      ["xe", "banh", "sua"]
    ];
    for (let round = 0; round < rounds.length; round++) {
      for (let index = 0; index < rounds[round].length; index++) {
        const id = `target_${rounds[round][index]}`;
        const source = page.getByTestId(`drag-${id}`);
        const hole = page.getByTestId(`hole-${id}`);
        await source.scrollIntoViewIfNeeded();
        const from = await source.boundingBox(),
          to = await hole.boundingBox();
        assert.ok(from && to && to.y >= 0 && to.y + to.height <= 844);
        await lockedDrag(page, source, from, to);
        if (index < 2) await source.waitFor({ state: "hidden" });
        else
          await page
            .getByText(round === 0 ? "Màn 2/2" : "Nghe rồi chọn hình", { exact: true })
            .waitFor();
      }
    }
    await page.screenshot({ path: `artifacts/c50-preview-listen-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Chọn Gấu", exact: true }).click();
    await page.getByText("Người lớn đọc: Bóng", { exact: true }).waitFor();
    for (const label of ["Bóng", "Gấu", "Xe", "Bánh", "Sữa"])
      await page.getByRole("button", { name: `Chọn ${label}`, exact: true }).click();
    await page.getByText("Lật thẻ tìm đôi", { exact: true }).waitFor();
    await page.screenshot({ path: `artifacts/c50-preview-memory-${width}.png`, fullPage: true });
    await page.getByTestId("daily-card-target_bong:a").click();
    await page.getByTestId("daily-card-target_gau:a").click();
    await page.waitForFunction(() =>
      document
        .querySelector('[data-testid="daily-card-target_bong:a"]')
        ?.getAttribute("aria-label")
        ?.startsWith("Thẻ úp")
    );
    for (const id of ["bong", "gau", "xe", "banh", "sua"]) {
      await page.getByTestId(`daily-card-target_${id}:a`).click();
      await page.getByTestId(`daily-card-target_${id}:b`).click();
    }
    await page.getByText("Mình đã hoàn thành cả ba trò!", { exact: true }).waitFor();
    await page.screenshot({ path: `artifacts/c50-preview-complete-${width}.png`, fullPage: true });
    assert.equal(
      await page.getByRole("button", { name: "Chơi lại bản thử", exact: true }).count(),
      0
    );
    await page.getByRole("button", { name: "Quay lại Trò chơi", exact: true }).click();
    assert.equal(dailyMutations, 0);
    assert.deepEqual(errors, []);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false
    );
    console.log(
      "C50 local preview: Parent Gate, touch drag with scroll lock, wrong/correct choices, automatic mismatch closure/five pairs, completion/back passed; no daily mutations"
    );
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
