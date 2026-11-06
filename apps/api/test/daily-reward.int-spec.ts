import {
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException
} from "@nestjs/common";
import { PrismaClient } from "../generated/prisma";
import type { PrismaService } from "../src/database/prisma.service";
import {
  DailyRewardRepository,
  type PublishedRewardPool
} from "../src/daily-games/daily-reward.repository";

const url = process.env.DATABASE_POOL_URL;
if (
  !url ||
  !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):\d+\/kidedu_c50_test(?:\?|$)/.test(url)
)
  throw new Error("C50 integration requires isolated local kidedu_c50_test database");
const db = new PrismaClient({ datasources: { db: { url } } });
const rewards = new DailyRewardRepository(db as unknown as PrismaService);
afterAll(async () => db.$disconnect());
const now = () => new Date("2026-11-06T16:59:59Z");
const reset = () => new Date("2026-11-06T17:00:00Z");
const catalog: PublishedRewardPool = {
  catalogId: "synthetic_catalog",
  version: 1,
  items: [
    { id: "sticker_boy", kind: "sticker", groups: ["boy"] },
    { id: "sticker_girl", kind: "sticker", groups: ["girl"] },
    { id: "piece_common", kind: "puzzle_piece", groups: ["boy", "girl"] }
  ]
};

async function fixture(
  run: (ids: {
    accountId: string;
    outsiderId: string;
    childId: string;
    sessionId: string;
  }) => Promise<void>
) {
  const account = await db.account.create({ data: {} });
  const outsider = await db.account.create({ data: {} });
  const family = await db.family.create({
    data: { members: { create: { accountId: account.id, role: "owner" } } }
  });
  const child = await db.childProfile.create({
    data: { familyId: family.id, displayName: "Synthetic rewards", gender: "boy" }
  });
  const session = await db.dailyGameSession.create({
    data: {
      childId: child.id,
      playDay: "2026-11-06",
      startsAt: new Date("2026-11-05T17:00:00Z"),
      resetAt: reset(),
      tier: "basic",
      plan: {},
      checkpoint: {},
      completedAt: now()
    }
  });
  try {
    await run({
      accountId: account.id,
      outsiderId: outsider.id,
      childId: child.id,
      sessionId: session.id
    });
  } finally {
    await db.dailyRewardReceipt.deleteMany({ where: { sessionId: session.id } });
    await db.rewardInventory.deleteMany({ where: { childId: child.id } });
    await db.dailyRewardReservation.deleteMany({ where: { sessionId: session.id } });
    await db.dailyGameSession.delete({ where: { id: session.id } });
    await db.childProfile.delete({ where: { id: child.id } });
    await db.familyMember.deleteMany({ where: { familyId: family.id } });
    await db.family.delete({ where: { id: family.id } });
    await db.account.deleteMany({ where: { id: { in: [account.id, outsider.id] } } });
  }
}

it("pins four boxes for a one-item pool and commits exactly one receipt across devices", async () =>
  fixture(async ({ accountId, childId, sessionId, outsiderId }) => {
    await expect(rewards.state(outsiderId, childId, sessionId, now)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect((await rewards.state(accountId, childId, sessionId, now)).state).toBe("choose_kind");
    await expect(
      rewards.reserve(outsiderId, childId, sessionId, "sticker", catalog, now)
    ).rejects.toBeInstanceOf(NotFoundException);
    const boxes = await Promise.all(
      Array.from({ length: 4 }, () =>
        rewards.reserve(accountId, childId, sessionId, "sticker", catalog, now)
      )
    );
    expect(boxes.every((b) => b.boxCount === 4)).toBe(true);
    expect(boxes[0]).not.toHaveProperty("candidates");
    const recovered = await rewards.state(accountId, childId, sessionId, now);
    expect(recovered).toMatchObject({ state: "boxes", kind: "sticker", receipt: null });
    expect(recovered).not.toHaveProperty("candidates");
    expect((await rewards.state(accountId, childId, sessionId, reset)).state).toBe("expired");
    expect(
      (await db.dailyRewardReservation.findUniqueOrThrow({ where: { sessionId } })).candidates
    ).toEqual(Array(4).fill("sticker_boy"));
    await expect(
      rewards.reserve(accountId, childId, sessionId, "puzzle_piece", catalog, now)
    ).rejects.toBeInstanceOf(ConflictException);
    const receipts = await Promise.all(
      [0, 1, 2, 3].map((index) => rewards.claim(accountId, childId, sessionId, index, now))
    );
    expect(new Set(receipts.map((r) => r.id)).size).toBe(1);
    expect(await rewards.state(accountId, childId, sessionId, reset)).toMatchObject({
      state: "claimed",
      receipt: { id: receipts[0]!.id, itemId: "sticker_boy" }
    });
    expect(await db.rewardInventory.count({ where: { childId } })).toBe(1);
    expect((await rewards.claim(accountId, childId, sessionId, 3, reset)).id).toBe(receipts[0]!.id);
    const inventory = await rewards.inventory(accountId, childId, catalog);
    expect(inventory.remaining).toEqual({ sticker: 0, puzzle_piece: 1 });
    expect(inventory.items[0]!.itemId).toBe("sticker_boy");
    const withoutCatalog = await rewards.inventory(accountId, childId);
    expect(withoutCatalog.items[0]!.itemId).toBe("sticker_boy");
    expect(withoutCatalog.remaining).toBeNull();
    await expect(rewards.claim(outsiderId, childId, sessionId, 0, now)).rejects.toBeInstanceOf(
      NotFoundException
    );
    await expect(rewards.inventory(outsiderId, childId, catalog)).rejects.toBeInstanceOf(
      NotFoundException
    );
  }));

it("does not award unfinished, missing-profile, expired or invalid claims", async () =>
  fixture(async ({ accountId, childId, sessionId }) => {
    await db.dailyGameSession.update({ where: { id: sessionId }, data: { completedAt: null } });
    await expect(
      rewards.reserve(accountId, childId, sessionId, "sticker", catalog, now)
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(rewards.claim(accountId, childId, sessionId, 0, now)).rejects.toBeInstanceOf(
      ConflictException
    );
    await db.dailyGameSession.update({ where: { id: sessionId }, data: { completedAt: now() } });
    await db.childProfile.update({ where: { id: childId }, data: { gender: null } });
    await expect(
      rewards.reserve(accountId, childId, sessionId, "sticker", catalog, now)
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await rewards.inventory(accountId, childId, catalog)).profileRequired).toBe(true);
    await db.childProfile.update({ where: { id: childId }, data: { gender: "boy" } });
    await rewards.reserve(accountId, childId, sessionId, "sticker", catalog, now);
    await expect(rewards.claim(accountId, childId, sessionId, 4, now)).rejects.toBeInstanceOf(
      BadRequestException
    );
    await expect(rewards.claim(accountId, childId, sessionId, 0, reset)).rejects.toBeInstanceOf(
      GoneException
    );
    expect(await db.rewardInventory.count({ where: { childId } })).toBe(0);
  }));

it("excludes existing inventory and refuses stale candidates without rerolling", async () =>
  fixture(async ({ accountId, childId, sessionId }) => {
    await db.rewardInventory.create({
      data: { childId, itemId: "sticker_boy", catalogId: catalog.catalogId, catalogVersion: 1 }
    });
    await expect(
      rewards.reserve(accountId, childId, sessionId, "sticker", catalog, now)
    ).rejects.toBeInstanceOf(ConflictException);
    await rewards.reserve(accountId, childId, sessionId, "puzzle_piece", catalog, now);
    await db.rewardInventory.create({
      data: { childId, itemId: "piece_common", catalogId: catalog.catalogId, catalogVersion: 1 }
    });
    await expect(rewards.claim(accountId, childId, sessionId, 0, now)).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(await db.dailyRewardReceipt.count({ where: { sessionId } })).toBe(0);
    expect((await rewards.inventory(accountId, childId, catalog)).remaining).toEqual({
      sticker: 0,
      puzzle_piece: 0
    });
  }));
