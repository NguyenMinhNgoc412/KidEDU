const assert = require("node:assert/strict");
module.exports = async function claimReward(page, kind = "sticker", capture = async () => {}) {
  await page.getByRole("button", { name: "Chọn sticker", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Chọn mảnh ghép", exact: true }).count(), 1);
  const puzzle = page.getByRole("button", { name: "Chọn mảnh ghép", exact: true });
  if (kind === "puzzle_piece" && (await puzzle.isEnabled())) await puzzle.click();
  else await page.getByRole("button", { name: "Chọn sticker", exact: true }).click();
  const box = page.getByRole("button", { name: "Mở hộp quà", exact: true });
  await box.waitFor();
  assert.equal(await box.count(), 1);
  await capture("box");
  await box.click();
  await page.getByLabel(/^Con nhận được /).waitFor();
  await capture("revealed");
  await page.getByLabel(/^Con nh?n ???c /).waitFor({ state: "detached" });
};
