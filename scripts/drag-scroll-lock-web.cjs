const assert = require("node:assert/strict");
module.exports = async function lockedDrag(page, source, from, to, { cancel = false } = {}) {
  const scroller = source.locator('xpath=ancestor::*[@data-testid="screen-scroll"][1]');
  const scrollElement = await scroller.elementHandle();
  assert(scrollElement, "Drag must belong to its screen scroll container");
  const before = await scroller.evaluate((node) => ({
    top: node.scrollTop,
    left: node.scrollLeft
  }));
  const pageBefore = await page.evaluate(() => ({ x: globalThis.scrollX, y: globalThis.scrollY }));
  const fixed = await scroller.evaluate((node) => node.id === "game-fixed-screen");
  const touch = page.viewportSize().width === 390;
  const session = touch ? await page.context().newCDPSession(page) : null;
  async function send(type, x, y) {
    await session.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y, id: 1 }]
    });
  }
  try {
    if (touch) {
      await session.send("Emulation.setTouchEmulationEnabled", {
        enabled: true,
        maxTouchPoints: 1
      });
      await send("touchStart", from.x + from.width / 2, from.y + from.height / 2);
    } else {
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
    }
    await page.waitForFunction(
      (node) => globalThis.getComputedStyle(node).overflowY === "hidden",
      scrollElement
    );
    await page.mouse.wheel(0, 140);
    if (touch) {
      for (let step = 1; step <= 12; step++)
        await send(
          "touchMove",
          from.x + from.width / 2 + ((to.x + to.width / 2 - from.x - from.width / 2) * step) / 12,
          from.y + from.height / 2 + ((to.y + to.height / 2 - from.y - from.height / 2) * step) / 12
        );
    } else await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 16 });
    const during = await scroller.evaluate((node) => ({
      top: node.scrollTop,
      left: node.scrollLeft
    }));
    assert.deepEqual(during, before, "Screen moved while a picture held the drag lock");
    assert.deepEqual(
      await page.evaluate(() => ({ x: globalThis.scrollX, y: globalThis.scrollY })),
      pageBefore,
      "Document moved during drag"
    );
    if (touch) await send(cancel ? "touchCancel" : "touchEnd");
    else await page.mouse.up();
    if (!fixed)
      await page.waitForFunction(
        (node) => globalThis.getComputedStyle(node).overflowY !== "hidden",
        scrollElement
      );
  } finally {
    if (session) await session.detach();
  }
};
