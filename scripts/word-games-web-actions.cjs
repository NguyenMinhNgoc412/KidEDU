const assert = require("node:assert/strict");
module.exports = async function playWordGames(page, capture, reopenSession = null) {
  const button = (name) => page.getByRole("button", { name, exact: true }).click();
  async function dismissGuide(name) {
    const guide = page.getByTestId("word-game-guide");
    await guide.waitFor();
    await capture(`guide-${name}`);
    await guide.click({ position: { x: 8, y: 8 } });
    await guide.waitFor({ state: "detached" });
  }
  await page.getByTestId("word-game-0").waitFor();
  await dismissGuide("memory");
  assert.equal(
    await page.locator('[data-testid^="memory-card-"][aria-label^="Thẻ úp "]').count(),
    10
  );
  assert.equal(await page.getByRole("button", { name: "Để lúc khác", exact: true }).count(), 0);
  await button("Tạm dừng bài");
  await page.getByRole("button", { name: "Để bài này lúc khác", exact: true }).waitFor();
  await button("Tiếp tục bài đã lưu");
  await page.getByTestId("word-game-0").waitFor();
  assert.equal((await page.getByTestId("word-game-0").innerText()).trim(), "");
  await capture("memory");
  const labels = {};
  let autoClosed = 0;
  for (let i = 0; i < 10; i++) {
    const tile = page.getByTestId(`memory-card-${i}`);
    if (!(await tile.getAttribute("aria-label")).startsWith("Đã ghép ")) {
      await tile.click();
      await page.waitForFunction(
        (index) =>
          !document
            .querySelector(`[data-testid="memory-card-${index}"]`)
            ?.getAttribute("aria-label")
            ?.startsWith("Thẻ úp "),
        i
      );
    }
    labels[i] = (await tile.getAttribute("aria-label")).replace(/^Đã ghép /, "");
    const disabledMismatch = await page
      .locator(
        '[data-testid^="memory-card-"]:not([aria-label^="Đã ghép "]):not([aria-label^="Thẻ úp "])'
      )
      .count();
    if (disabledMismatch === 2) {
      await page.waitForFunction(
        () =>
          !document.querySelector(
            '[data-testid^="memory-card-"]:not([aria-label^="Đã ghép "]):not([aria-label^="Thẻ úp "])'
          )
      );
      assert.match(await tile.getAttribute("aria-label"), /^Thẻ úp /);
      autoClosed++;
    }
  }
  assert(autoClosed > 0, "No automatic mismatch closure exercised");
  for (const word of ["Bóng", "Gấu", "Xe", "Bánh", "Sữa"]) {
    for (const index of Object.keys(labels).filter((key) => labels[key] === word)) {
      const tile = page.getByTestId(`memory-card-${index}`);
      if (!(await tile.getAttribute("aria-label")).startsWith("Đã ghép ")) await tile.click();
    }
    await page
      .getByRole("button", { name: `Đã ghép ${word}`, exact: true })
      .first()
      .waitFor();
    const matched = await page
      .locator('[data-testid^="memory-card-"][aria-label^="Đã ghép "]')
      .count();
    if (matched > 0) {
      await button("Tạm dừng bài");
      await button("Tiếp tục bài đã lưu");
      await page.getByTestId("word-game-0").waitFor();
      assert.equal(
        await page.locator('[data-testid^="memory-card-"][aria-label^="Đã ghép "]').count(),
        matched
      );
    }
  }
  await require("./game-reward-web-actions.cjs")(page, "puzzle_piece", (name) =>
    capture(`round-1-${name}`)
  );
  await page.getByTestId("word-game-1").waitFor();
  await dismissGuide("find");
  assert.equal((await page.getByTestId("word-game-1").innerText()).trim(), "");
  const start = await page.getByTestId("drag-ball").boundingBox();
  await page.getByTestId("drag-ball").click();
  await page.getByTestId("hole-ball").click();
  assert.equal(await page.getByTestId("drag-ball").count(), 1, "Taps must not place a picture");
  await drag("ball", "bear");
  await page.waitForFunction(
    ({ x, y }) => {
      const box = document.querySelector('[data-testid="drag-ball"]')?.getBoundingClientRect();
      return box && Math.abs(box.x - x) < 2 && Math.abs(box.y - y) < 2;
    },
    { x: start.x, y: start.y }
  );
  await capture("find");
  for (const id of ["ball", "bear", "car", "cake", "milk"]) {
    await drag(id, id);
    await page.getByTestId(`drag-${id}`).waitFor({ state: "detached" });
    assert.equal(await page.getByTestId(`hole-${id}`).getByTestId(`attached-${id}`).count(), 1);
    await button("Tạm dừng bài");
    await button("Tiếp tục bài đã lưu");
    await page.getByTestId("word-game-1").waitFor();
    assert.equal(await page.getByTestId(`drag-${id}`).count(), 0);
  }
  await require("./game-reward-web-actions.cjs")(page, "sticker", (name) =>
    capture(`round-2-${name}`)
  );
  await page.getByTestId("word-game-2").waitFor();
  await dismissGuide("match");
  assert.equal((await page.getByTestId("word-game-2").innerText()).trim(), "");
  async function drag(id, targetId) {
    const source = page.getByTestId(`drag-${id}`),
      target = page.getByTestId(`hole-${targetId}`);
    await source.scrollIntoViewIfNeeded();
    const from = await source.boundingBox(),
      to = await target.boundingBox();
    assert(from && to && to.y >= 0 && to.y + to.height <= page.viewportSize().height);
    await require("./drag-scroll-lock-web.cjs")(page, source, from, to);
  }
  await capture("match");
  await drag("ball", "bear");
  assert.equal(await page.getByTestId("drag-ball").count(), 1);
  for (const [id] of [
    ["ball", "Bóng"],
    ["bear", "Gấu"],
    ["car", "Xe"],
    ["cake", "Bánh"],
    ["milk", "Sữa"]
  ]) {
    await drag(id, id);
    await page.getByTestId(`drag-${id}`).waitFor({ state: "detached" });
    await button("Tạm dừng bài");
    await button("Tiếp tục bài đã lưu");
    await page.getByTestId("word-game-2").waitFor();
    assert.equal(await page.getByTestId(`drag-${id}`).count(), 0);
    if (id === "bear" && reopenSession) {
      await button("Tạm dừng bài");
      await reopenSession();
      await page.getByTestId("word-game-2").waitFor();
      assert.equal(await page.getByTestId("drag-ball").count(), 0);
      assert.equal(await page.getByTestId("drag-bear").count(), 0);
      assert.equal(await page.getByTestId("drag-car").count(), 1);
      await capture("restored-progress");
    }
  }
  await require("./game-reward-web-actions.cjs")(page, "puzzle_piece", (name) =>
    capture(`round-3-${name}`)
  );
  await require("./game-reward-web-actions.cjs")(page, "sticker", (name) =>
    capture(`lesson-${name}`)
  );
};
