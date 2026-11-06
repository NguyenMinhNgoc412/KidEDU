const assert = require("node:assert/strict");
module.exports = async function play(page, lesson, capture) {
  async function drag(id, target) {
    const source = page.getByTestId(`play-drag-${id}`),
      hole = page.getByTestId(`play-place-${target}`);
    await source.scrollIntoViewIfNeeded();
    const from = await source.boundingBox(),
      to = await hole.boundingBox();
    assert(
      from && to && to.y >= 0 && to.y + to.height <= page.viewportSize().height,
      "Drag board must keep its target visible"
    );
    await require("./drag-scroll-lock-web.cjs")(page, source, from, to);
    return from;
  }
  async function returnsHome(id) {
    await page.waitForFunction(
      ({ id }) => {
        const node = document.querySelector(`[data-testid="play-drag-${id}"]`);
        if (!node) return false;
        const matrix = new globalThis.DOMMatrixReadOnly(
          globalThis.getComputedStyle(node).transform
        );
        return Math.abs(matrix.m41) < 2 && Math.abs(matrix.m42) < 2;
      },
      { id }
    );
    assert.equal(await page.getByTestId(`play-attached-${id}`).count(), 0);
  }
  assert.equal(await page.getByRole("button", { name: /^(Chọn |Đặt vào |Thêm )/ }).count(), 0);
  const suffix = lesson.id.replace("fixture_play_", "");
  const pairs = {
    pairs: [
      ["ball", "ball_pair"],
      ["bear", "bear_pair"]
    ],
    baskets: [
      ["milk", "food"],
      ["ball", "toys"],
      ["cake", "food"],
      ["bear", "toys"]
    ],
    feed: [
      ["fish", "cat"],
      ["seed", "bird"]
    ],
    habitat: [
      ["fish", "water"],
      ["bird", "tree"],
      ["dog", "home"]
    ],
    purpose: [
      ["cup", "drink"],
      ["cake", "eat"]
    ],
    ownership: [
      ["cup", "dad"],
      ["car", "mom"]
    ]
  };
  if (pairs[suffix]) {
    const mappings = pairs[suffix],
      [id, target] = mappings[0],
      wrong = mappings[1][1];
    if (suffix === "pairs" && page.viewportSize().width === 390) {
      const source = page.getByTestId(`play-drag-${id}`),
        cancelTarget = page.getByTestId(`play-place-${target}`);
      await source.scrollIntoViewIfNeeded();
      await require("./drag-scroll-lock-web.cjs")(
        page,
        source,
        await source.boundingBox(),
        await cancelTarget.boundingBox(),
        { cancel: true }
      );
      await returnsHome(id);
    }
    await page.getByTestId(`play-drag-${id}`).click();
    await page.getByTestId(`play-place-${target}`).click();
    assert.equal(
      await page.getByTestId(`play-drag-${id}`).count(),
      1,
      "Tap-to-select is forbidden"
    );
    await returnsHome(id, await drag(id, wrong));
    for (const [id, target] of mappings) {
      await drag(id, target);
      await page.getByTestId(`play-drag-${id}`).waitFor({ state: "detached" });
      assert.equal(
        await page.getByTestId(`play-place-${target}`).getByTestId(`play-attached-${id}`).count(),
        1
      );
    }
  } else if (suffix === "sequence" || suffix === "sentence") {
    const order = suffix === "sequence" ? ["take", "put"] : ["say_child", "want", "ball"];
    await returnsHome(order[0], await drag(order[0], "step_1"));
    for (const [index, id] of order.entries()) {
      await drag(id, `step_${index}`);
      await page.getByTestId(`play-attached-${id}`).waitFor();
      assert.equal(await page.getByTestId(`play-drag-${id}`).count(), 0);
    }
  } else if (suffix === "find") {
    while (await page.getByRole("button", { name: /^Mở ô / }).count())
      await page
        .getByRole("button", { name: /^Mở ô / })
        .first()
        .click();
    assert.equal(await page.getByRole("button", { name: /^Hình / }).count(), 3);
  } else if (suffix === "turns") {
    const zones = page.locator('[data-testid^="play-place-"]');
    const ids = await zones.evaluateAll((nodes) =>
      nodes.map((n) => n.dataset.testid.replace("play-place-", ""))
    );
    await returnsHome("turn_ball", await drag("turn_ball", ids[0]));
    await drag("turn_ball", ids[1]);
    await page.getByTestId(`play-place-${ids[1]}`).getByTestId("play-drag-turn_ball").waitFor();
    await drag("turn_ball", ids[0]);
    await page.getByTestId(`play-place-${ids[0]}`).getByTestId("play-drag-turn_ball").waitFor();
  } else {
    await drag("reply_0", "reply");
    await page.getByTestId("play-attached-reply").waitFor();
    if (suffix === "greeting") {
      await page.getByTestId("play-drag-reply_0").waitFor();
      await drag("reply_0", "reply");
      await page.getByTestId("play-attached-reply").waitFor();
    }
  }
  await capture(lesson.id);
  await require("./game-reward-web-actions.cjs")(
    page,
    lesson.id.length % 2 ? "sticker" : "puzzle_piece"
  );
};
