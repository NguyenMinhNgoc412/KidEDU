import { ConflictException, GoneException, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma";
import type { PrismaService } from "../src/database/prisma.service";
import { DailyGameRepository } from "../src/daily-games/daily-game.repository";

const url = process.env.DATABASE_POOL_URL;
if (
  !url ||
  !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):\d+\/kidedu_c50_test(?:\?|$)/.test(url)
)
  throw new Error("C50 integration requires isolated local kidedu_c50_test database");
const db = new PrismaClient({ datasources: { db: { url } } });
const repository = new DailyGameRepository(db as unknown as PrismaService);
afterAll(async () => db.$disconnect());
const clock = () => new Date("2026-11-05T16:59:59Z");
const midnight = () => new Date("2026-11-05T17:00:00Z");
const plan = (tier: "basic" | "full") => ({
  schemaVersion: 1,
  kind: "daily_game",
  contentVersion: "synthetic_v1",
  tier,
  shadowScreens: Array.from({ length: tier === "full" ? 5 : 2 }, (_, i) => ({
    id: `shadow_${i}`,
    targetIds: ["target_a", "target_b", "target_c"]
  })),
  listenRounds: Array.from({ length: tier === "full" ? 12 : 5 }, (_, i) => ({
    id: `listen_${i}`,
    targetId: `target_${i}`,
    optionTargetIds: [`target_${i}`, "distractor_a", "distractor_b"]
  })),
  memoryTargetIds: ["target_0", "target_1", "target_2", "target_3", "target_4"]
});

it("serializes devices, pins the day, protects ownership and rejects stale/expired progress", async () => {
  const account = await db.account.create({ data: {} });
  const outsider = await db.account.create({ data: {} });
  const family = await db.family.create({
    data: {
      members: { create: { accountId: account.id, role: "owner" } }
    }
  });
  const child = await db.childProfile.create({
    data: { familyId: family.id, displayName: "Synthetic" }
  });
  try {
    await expect(
      repository.startOrResume(outsider.id, child.id, plan, clock)
    ).rejects.toBeInstanceOf(NotFoundException);
    const starts = await Promise.all(
      Array.from({ length: 8 }, () => repository.startOrResume(account.id, child.id, plan, clock))
    );
    expect(new Set(starts.map((s) => s.id)).size).toBe(1);
    const first = starts[0]!;
    expect(first.tier).toBe("basic");
    expect(first.playDay).toBe("2026-11-05");
    await db.entitlement.create({
      data: {
        accountId: account.id,
        state: "active",
        effectiveUntil: new Date("2026-12-01"),
        capabilities: ["learning.plan.full"],
        source: "synthetic"
      }
    });
    expect(
      (
        await repository.startOrResume(
          account.id,
          child.id,
          () => {
            throw new Error("must not rebuild");
          },
          clock
        )
      ).id
    ).toBe(first.id);
    const original = first.checkpoint as Record<string, unknown>;
    const next = { ...original, placedTargetIds: ["target_a"] };
    const updates = await Promise.allSettled([
      repository.saveCheckpoint(account.id, child.id, first.id, 1, next, clock),
      repository.saveCheckpoint(
        account.id,
        child.id,
        first.id,
        1,
        { ...original, placedTargetIds: ["target_b"] },
        clock
      )
    ]);
    expect(updates.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = updates.find((r) => r.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(ConflictException);
    const current = await db.dailyGameSession.findUniqueOrThrow({ where: { id: first.id } });
    expect(
      (
        await repository.saveCheckpoint(
          account.id,
          child.id,
          first.id,
          1,
          current.checkpoint,
          clock
        )
      ).revision
    ).toBe(2);
    await expect(
      repository.saveCheckpoint(account.id, child.id, first.id, 2, original, clock)
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      repository.saveCheckpoint(outsider.id, child.id, first.id, 2, next, clock)
    ).rejects.toBeInstanceOf(NotFoundException);
    const completed = {
      ...original,
      shadowScreenIndex: 2,
      listenRoundIndex: 5,
      memoryMatchedTargetIds: plan("basic").memoryTargetIds
    };
    expect(
      (await repository.saveCheckpoint(account.id, child.id, first.id, 2, completed, clock))
        .completedAt
    ).toEqual(clock());
    expect((await repository.startOrResume(account.id, child.id, plan, clock)).id).toBe(first.id);
    await expect(
      repository.saveCheckpoint(account.id, child.id, first.id, 3, completed, midnight)
    ).rejects.toBeInstanceOf(GoneException);
    const tomorrow = await repository.startOrResume(account.id, child.id, plan, midnight);
    expect(tomorrow.id).not.toBe(first.id);
    expect(tomorrow.tier).toBe("full");
    expect(tomorrow.playDay).toBe("2026-11-06");
    expect(await db.dailyGameSession.count({ where: { childId: child.id } })).toBe(2);
    // Clock must be evaluated only once the database lock has actually been obtained.
    let unlock!: () => void;
    let locked!: () => void;
    const lockReady = new Promise<void>((resolve) => {
      locked = resolve;
    });
    const releaseLock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const holder = db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM child_profiles WHERE id = ${child.id}::uuid FOR UPDATE`;
      locked();
      await releaseLock;
    });
    await lockReady;
    let clockRead = false;
    const delayed = repository.startOrResume(account.id, child.id, plan, () => {
      clockRead = true;
      return new Date("2026-11-06T17:00:00Z");
    });
    try {
      expect(clockRead).toBe(false);
    } finally {
      unlock();
      await holder;
    }
    expect((await delayed).playDay).toBe("2026-11-07");
    expect(clockRead).toBe(true);
    // Failed catalog validation must not consume the next day's turn.
    const later = () => new Date("2026-11-07T17:00:00Z");
    await expect(
      repository.startOrResume(account.id, child.id, () => ({}), later)
    ).rejects.toThrow();
    expect(await db.dailyGameSession.count({ where: { childId: child.id } })).toBe(3);
    expect((await repository.startOrResume(account.id, child.id, plan, later)).playDay).toBe(
      "2026-11-08"
    );
  } finally {
    await db.dailyGameSession.deleteMany({ where: { childId: child.id } });
    await db.childProfile.delete({ where: { id: child.id } });
    await db.familyMember.deleteMany({ where: { familyId: family.id } });
    await db.family.delete({ where: { id: family.id } });
    await db.entitlement.deleteMany({ where: { accountId: account.id } });
    await db.account.deleteMany({ where: { id: { in: [account.id, outsider.id] } } });
  }
});
