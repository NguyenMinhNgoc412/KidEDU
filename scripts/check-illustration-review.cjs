const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function run() {
  const directory = path.resolve(__dirname, "../content-candidates/illustrations-v2");
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8"));
  assert.equal(manifest.assets.length, 29);
  assert.equal(new Set(manifest.assets.map((asset) => asset.id)).size, 29);
  for (const asset of manifest.assets) {
    const bytes = fs.readFileSync(path.join(directory, asset.file));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), asset.sha256);
    assert.equal(bytes.readUInt32BE(16), bytes.readUInt32BE(20) * 2);
    assert.equal(asset.reviewStatus, "pending");
  }
  const browser = await chromium.launch({ headless: true });
  const reviewUrl = pathToFileURL(
    path.resolve(__dirname, "../content-candidates/illustrations-v2/review.html")
  ).href;
  try {
    const page = await browser.newPage({ viewport: { width: 1180, height: 950 } });
    await page.clock.install();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(reviewUrl);
    assert.equal(await page.locator("article").count(), 29);
    assert.deepEqual(
      await page
        .locator("article")
        .evaluateAll((cards) => cards.map((card) => card.dataset.itemId)),
      manifest.assets.map((asset) => asset.id)
    );
    const loaded = await page.evaluate(async () => {
      return Promise.all(
        [...document.querySelectorAll("article")].map(
          (card) =>
            new Promise((resolve) => {
              const image = new globalThis.Image();
              image.onload = () => resolve(image.naturalWidth > 0);
              image.onerror = () => resolve(false);
              image.src = card.dataset.sprite;
            })
        )
      );
    });
    assert.deepEqual(loaded, Array(29).fill(true));
    await page.screenshot({
      path: "content-candidates/illustrations-v2/review-preview.png",
      fullPage: false
    });
    for (const asset of manifest.assets) {
      const card = page.locator(`[data-item-id="${asset.id}"]`);
      await card.locator("button").click();
      await page.clock.runFor(375);
      assert.equal(await card.locator("button").getAttribute("aria-pressed"), "true");
      assert.notEqual(
        await card.locator(".sprite").evaluate((el) => el.style.backgroundPosition),
        "0% 0%"
      );
      await page.clock.runFor(2625);
      assert.equal(await card.locator("button").getAttribute("aria-pressed"), "false");
      assert.equal(
        await card.locator(".sprite").evaluate((el) => el.style.backgroundPosition),
        asset.staticFallbackFrame === 7 ? "100% 100%" : "0% 0%"
      );
    }
    const first = page.locator("article").first();
    await first.locator("button").click();
    await page.clock.runFor(375);
    await page.waitForFunction(
      () => document.querySelector(".sprite").style.backgroundPosition !== "0% 0%"
    );
    await page.clock.runFor(2625);
    await page.waitForFunction(
      () => document.querySelector("article button").getAttribute("aria-pressed") === "false",
      null,
      { timeout: 5000 }
    );
    assert.equal(
      await first.locator(".sprite").evaluate((el) => el.style.backgroundPosition),
      "0% 0%"
    );
    await first.locator("button").click();
    await page.clock.runFor(375);
    await first.locator("button").click();
    assert.equal(await first.locator("button").getAttribute("aria-pressed"), "false");
    const pausedPosition = await first
      .locator(".sprite")
      .evaluate((el) => el.style.backgroundPosition);
    await page.clock.runFor(4000);
    assert.equal(
      await first.locator(".sprite").evaluate((el) => el.style.backgroundPosition),
      pausedPosition
    );
    await page.locator("#search").fill("uong");
    assert.equal(await page.locator("article:visible").count(), 1);
    assert.equal(await page.locator("article:visible").getAttribute("data-item-id"), "item-uong");
    await page.locator("#search").fill("");
    await page.locator("#category").selectOption("cat-actions");
    assert.equal(await page.locator("article:visible").count(), 7);
    await page.locator("#search").fill("not-a-word");
    assert.equal(await page.locator("article:visible").count(), 0);
    assert.equal(await page.locator("#empty").isVisible(), true);
    await page.locator("#search").fill("");
    await page.locator("#category").selectOption("all");
    await page.locator("#static-mode").check();
    await first.locator("button").click();
    assert.equal(await first.locator("button").getAttribute("aria-pressed"), "false");
    await page.setViewportSize({ width: 320, height: 800 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    assert.equal(await page.locator("#static-mode").isChecked(), true);
    await first.locator("button").click();
    assert.equal(await first.locator("button").getAttribute("aria-pressed"), "false");
    assert.deepEqual(errors, []);
    console.log(
      "Illustration review passed: 29 words/232 frames, hashes, per-word finite playback, pause, static fallback, search/filter, reduced motion, 320px layout"
    );
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
