import { memoryCardSize } from "../boardLayout";
it.each([
  [260, 350],
  [330, 620],
  [660, 620],
  [780, 150]
])("fits ten large cards within %s by %s", (width, height) => {
  const { size, columns } = memoryCardSize(width, height);
  const rows = Math.ceil(10 / columns);
  expect(size).toBeGreaterThanOrEqual(56);
  expect(columns * size + (columns - 1) * 8).toBeLessThanOrEqual(width);
  expect(rows * size + (rows - 1) * 8).toBeLessThanOrEqual(height);
});
it("uses substantially larger cards on a portrait phone than the previous compact row", () => {
  expect(memoryCardSize(330, 620).size).toBeGreaterThan(100);
});
