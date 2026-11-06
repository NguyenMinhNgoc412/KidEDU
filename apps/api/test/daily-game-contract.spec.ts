import { readFileSync } from "node:fs";
import { resolve } from "node:path";

it("keeps the standalone server validator identical to the versioned mobile content contract", () => {
  // Separate build roots; neither runtime imports Prisma or mobile modules across boundaries.
  const read = (path: string) =>
    readFileSync(resolve(__dirname, path), "utf8").replace(/\r\n/g, "\n");
  expect(read("../src/daily-games/daily-game.contract.ts")).toBe(
    read("../../../src/content/contracts/dailyGame.ts")
  );
});
