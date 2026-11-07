const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { openParentGate } = require("./parent-gate-web.cjs");
const lockedDrag = require("./drag-scroll-lock-web.cjs");

async function run() {
  const apiOrigin = process.env.KIDEDU_API_ORIGIN;
  const identityOrigin = process.env.KIDEDU_IDENTITY_ORIGIN;
  for (const origin of [apiOrigin, identityOrigin]) {
    assert.ok(
      origin && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/.test(origin),
      "Explicit local fixture origins required"
    );
  }
  const login = await globalThis.fetch(`${identityOrigin}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "fullaccess@local.kidedu.test", password: "FullAccess123!" })
  });
  assert.equal(login.status, 200);
  const { accessToken } = await login.json();
  const call = async (path, body) => {
    const response = await globalThis.fetch(`${apiOrigin}/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    assert.ok(response.ok, `Fixture setup/read failed (${response.status})`);
    return response.json();
  };
  const families = await call("/families");
  assert.ok(families[0]?.id, "Synthetic full-access account needs its local family/consent");
  const displayName = `C50 kiểm thử ${Date.now()}`;
  const child = await call("/children", { familyId: families[0].id, displayName, gender: "boy" });
  const learningCatalog = await call(`/children/${child.id}/practice/catalog`);
  assert.equal(
    learningCatalog.lessons.some((lesson) => lesson.id === "fixture_play_today_words"),
    false
  );
  const retiredPreparation = await globalThis.fetch(
    `${apiOrigin}/v1/children/${child.id}/practice/lessons/fixture_play_today_words/prepare`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: "{}"
    }
  );
  assert.equal(retiredPreparation.status, 404);
  const disguisedReward = await globalThis.fetch(
    `${apiOrigin}/v1/children/${child.id}/practice/checkpoints/c50_forbidden_legacy`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        schemaVersion: 1,
        lessonId: "fixture_lesson_put_ball",
        lessonVersion: 1,
        revision: 1,
        index: 0,
        phase: "paused",
        resumePhase: "waiting",
        promptLevel: 0,
        repeats: 0,
        waitRemainingMs: 1000,
        deferred: false,
        rewardReceipts: {
          "fixture_play_today_words_practice:round_1": {
            kind: "sticker",
            itemId: "sticker_animals_1"
          }
        }
      })
    }
  );
  assert.equal(disguisedReward.status, 409);
  assert.equal((await call(`/children/${child.id}/practice/checkpoints`)).checkpoints.length, 0);
  const width = Number(process.env.KIDEDU_PREVIEW_WIDTH ?? 390);
  const browser = await chromium.launch({ headless: true });
  let page;
  try {
    page = await browser.newPage({
      viewport: { width, height: Number(process.env.KIDEDU_PREVIEW_HEIGHT || 844) }
    });
    const errors = [];
    let mutations = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /non-boolean|React does not recognize|Each child in a list|Cannot update a component/.test(
          message.text()
        )
      )
        errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.url().includes("/daily-game") && request.method() !== "GET") mutations++;
    });
    const origin = process.env.KIDEDU_WEB_ORIGIN ?? "http://localhost:19007";
    const checkBoard = async () => {
      await page.waitForFunction(() => {
        const buttons = [...document.querySelectorAll('[aria-label="Quay lại Trò chơi"]')];
        return buttons.some((button) => {
          const box = button.getBoundingClientRect();
          return box.width >= 56 && box.top >= 0 && box.bottom <= 100;
        });
      });
      const outside = await page
        .locator(
          '[data-testid^="drag-"], [data-testid^="hole-"], [data-testid^="daily-card-"], [aria-label^="Chọn "]'
        )
        .evaluateAll((elements) =>
          elements
            .filter((element) => {
              if (!element.checkVisibility()) return false;
              const box = element.getBoundingClientRect();
              return (
                box.width > 0 &&
                (box.top < 0 ||
                  box.bottom > globalThis.innerHeight ||
                  box.left < 0 ||
                  box.right > innerWidth)
              );
            })
            .map(
              (element) => element.getAttribute("data-testid") || element.getAttribute("aria-label")
            )
        );
      assert.deepEqual(outside, [], "Every game target must fit the viewport");
    };
    await page.goto(`${origin}/login`, { timeout: 120000 });
    await page.getByRole("textbox", { name: "Email" }).fill("fullaccess@local.kidedu.test");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("FullAccess123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByRole("tab", { name: "Phụ huynh", exact: true }).click({ timeout: 60000 });
    await openParentGate(page);
    await page.getByRole("button", { name: "Chỉnh hồ sơ", exact: true }).click();
    await page.getByRole("button", { name: displayName, exact: true }).click();
    await page.getByRole("button", { name: "Về Phụ huynh", exact: true }).click();
    await page.getByRole("tab", { name: "Trò chơi", exact: true }).click();
    await page.getByRole("button", { name: "Vào chơi", exact: true }).click();
    await page.getByText("Màn 1/5", { exact: true }).waitFor({ timeout: 60000 });
    await checkBoard();
    await page.screenshot({ path: `artifacts/c50-daily-shadow-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => globalThis.crossOriginIsolated), true);
    const status = await call(`/children/${child.id}/daily-game`);
    const remote = await call(`/children/${child.id}/daily-game/start`, {});
    assert.equal(remote.id, status.sessionId);
    if (process.env.KIDEDU_CHECK_BACK === "1") {
      await page.getByRole("button", { name: "Quay lại Trò chơi", exact: true }).click();
      await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
      await page.getByText("Màn 1/5", { exact: true }).filter({ visible: true }).waitFor();
      await checkBoard();
      assert.equal((await call(`/children/${child.id}/daily-game/start`, {})).id, remote.id);
    }
    const preparedMutations = mutations;
    for (let index = 0; index < remote.plan.shadowScreens.length; index++) {
      await page.screenshot({
        path: `artifacts/c50-shadow-round-${index + 1}-${width}.png`,
        fullPage: true
      });
      for (const [position, id] of remote.plan.shadowScreens[index].targetIds.entries()) {
        const source = page.getByTestId(`drag-${id}`);
        const hole = page.getByTestId(`hole-${id}`);
        await source.scrollIntoViewIfNeeded();
        const from = await source.boundingBox(),
          to = await hole.boundingBox();
        assert.ok(from && to);
        await lockedDrag(page, source, from, to);
        if (position < 2) await source.waitFor({ state: "hidden" });
        else if (index + 1 < remote.plan.shadowScreens.length)
          await page.getByText(`Màn ${index + 2}/5`, { exact: true }).waitFor();
        else await page.getByRole("button", { name: "Trò tiếp theo", exact: true }).waitFor();
      }
    }
    assert.equal(mutations, preparedMutations, "No activity-loop HTTP mutations");
    await page.getByRole("button", { name: "Trò tiếp theo", exact: true }).click();
    const labels = {
      bong: "Bóng",
      gau: "Gấu",
      xe: "Xe",
      banh: "Bánh",
      sua: "Sữa",
      ly: "Ly",
      meo: "Mèo",
      cho: "Chó",
      ca: "Cá",
      me: "Mẹ",
      chim: "Chim",
      ba: "Ba"
    };
    await checkBoard();
    await page.screenshot({ path: `artifacts/c50-daily-listen-${width}.png`, fullPage: true });
    const firstChoice = remote.plan.listenRounds[0];
    const wrongChoice = firstChoice.optionTargetIds.find((id) => id !== firstChoice.targetId);
    await page
      .getByRole("button", {
        name: `Chọn ${labels[wrongChoice.replace(/^target_/, "")]}`,
        exact: true
      })
      .click();
    await page.getByText("Mình thử lại nhé", { exact: true }).filter({ visible: true }).waitFor();
    await page.screenshot({ path: `artifacts/c50-choice-retry-${width}.png`, fullPage: true });
    for (const round of remote.plan.listenRounds) {
      const label = labels[round.targetId.replace(/^target_/, "")];
      await page.getByRole("button", { name: `Chọn ${label}`, exact: true }).click();
      if (round.id === firstChoice.id) {
        await page.getByText("Đúng rồi!", { exact: true }).filter({ visible: true }).waitFor();
        await page.screenshot({
          path: `artifacts/c50-choice-correct-${width}.png`,
          fullPage: true
        });
      }
    }
    await page.getByRole("button", { name: "Trò tiếp theo", exact: true }).click();
    await page.getByText("Lật thẻ tìm đôi", { exact: true }).waitFor();
    await checkBoard();
    await page.screenshot({ path: `artifacts/c50-daily-memory-${width}.png`, fullPage: true });
    const [first, second] = remote.plan.memoryTargetIds;
    await page.getByTestId(`daily-card-${first}:a`).click();
    await page.getByTestId(`daily-card-${second}:a`).click();
    assert.equal(await page.getByRole("button", { name: "Úp hai thẻ, thử tiếp" }).count(), 0);
    await page.waitForFunction(
      (id) =>
        document
          .querySelector(`[data-testid="daily-card-${id}:a"]`)
          ?.getAttribute("aria-label")
          ?.startsWith("Thẻ úp"),
      first
    );
    for (const id of remote.plan.memoryTargetIds) {
      await page.getByTestId(`daily-card-${id}:a`).click();
      if (id === remote.plan.memoryTargetIds.at(-1))
        assert.equal(mutations, preparedMutations, "No HTTP before completion boundary");
      await page.getByTestId(`daily-card-${id}:b`).click();
    }
    assert.equal(await page.getByRole("button", { name: "Lưu lượt chơi", exact: true }).count(), 0);
    const rewardKind =
      process.env.KIDEDU_REWARD_KIND === "puzzle_piece" ? "puzzle_piece" : "sticker";
    await page
      .getByRole("button", { name: rewardKind === "sticker" ? /Sticker · còn/ : /Mảnh ghép · còn/ })
      .click();
    if (process.env.KIDEDU_REWARD_LOST_ACK === "1") {
      await page.route("**/reward/claim", async (route) => {
        const committed = await route.fetch();
        assert.equal(committed.status(), 201);
        await route.abort();
        await page.unroute("**/reward/claim");
      });
    }
    await page.getByRole("button", { name: "Hộp quà 3", exact: true }).click();
    if (process.env.KIDEDU_REWARD_LOST_ACK === "1")
      await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await page.getByText("Quà đã vào bộ sưu tập!", { exact: true }).waitFor();
    const reward = await call(`/children/${child.id}/daily-game/${remote.id}/reward`);
    assert.equal(reward.state, "claimed");
    assert.equal(reward.receipt.boxIndex, 2);
    const retried = await call(`/children/${child.id}/daily-game/${remote.id}/reward/claim`, {
      boxIndex: 0
    });
    assert.equal(retried.id, reward.receipt.id);
    assert.equal(retried.boxIndex, 2);
    await page
      .getByText("Mình đã chơi xong hôm nay", { exact: true })
      .filter({ visible: true })
      .waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Chơi phiên thử mới", exact: true }).isEnabled(),
      true
    );
    await page.getByRole("tab", { name: "Bộ sưu tập", exact: true }).click();
    if (rewardKind === "puzzle_piece") {
      await page.getByRole("button", { name: "Tranh ghép", exact: true }).click();
      await page.getByText("Đã có 1/6 mảnh", { exact: true }).waitFor();
    }
    await page.screenshot({ path: `artifacts/c50-daily-collection-${width}.png`, fullPage: true });
    assert.equal((await call(`/children/${child.id}/daily-game/inventory`)).items.length, 1);
    if (process.env.KIDEDU_RESTART_TEST === "1") {
      await page.getByRole("tab", { name: "Trò chơi", exact: true }).click();
      await page.getByRole("button", { name: "Chơi phiên thử mới", exact: true }).click();
      await page.getByText("Màn 1/5", { exact: true }).filter({ visible: true }).waitFor();
      const next = await call(`/children/${child.id}/daily-game/start`, {});
      assert.notEqual(next.id, remote.id);
      assert.equal(next.completedAt, null);
      assert.equal((await call(`/children/${child.id}/daily-game/inventory`)).items.length, 1);
      await page.getByRole("button", { name: "Quay lại Trò chơi", exact: true }).click();
    }
    assert.deepEqual(errors, []);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false
    );
    console.log(
      "C50 local daily integration: real server reservation, SQLite checkpoints, full quotas, three games without loop HTTP, four boxes, one receipt and album passed"
    );
  } catch (error) {
    await page?.screenshot({ path: "artifacts/c50-daily-failure.png", fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
