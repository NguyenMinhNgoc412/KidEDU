const assert = require("node:assert/strict");
const { PrismaClient } = require("../apps/api/generated/prisma");
async function run() {
  assert.ok(
    process.argv.includes("--cleanup-c50-synthetic"),
    "Explicit synthetic cleanup flag required"
  );
  const url = process.env.DATABASE_POOL_URL ?? "";
  assert.ok(
    /^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):5439\/kidedu_local(?:\?|$)/.test(url),
    "Only the local fixture database is permitted"
  );
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    const identity = await db.authIdentity.findUnique({
      where: { provider_subject: { provider: "supabase", subject: "local-full-access-parent" } }
    });
    assert.ok(identity);
    const entitlement = await db.entitlement.findUnique({
      where: { accountId: identity.accountId }
    });
    assert.equal(entitlement?.source, "local_fixture");
    const children = await db.childProfile.findMany({
      where: {
        displayName: { startsWith: "C50 kiểm thử " },
        createdAt: { gte: new Date("2026-11-06T00:00:00Z") },
        family: { members: { some: { accountId: identity.accountId, role: "owner" } } }
      },
      select: { id: true, displayName: true }
    });
    let removed = 0;
    for (const child of children) {
      if (!/^C50 kiểm thử \d{13}$/.test(child.displayName)) continue;
      await db.$transaction(async (tx) => {
        const [observations, plan, practice, checkpoints] = await Promise.all([
          tx.observation.count({ where: { childId: child.id } }),
          tx.learningPlan.count({ where: { childId: child.id } }),
          tx.practicePlan.count({ where: { childId: child.id } }),
          tx.practiceCheckpoint.count({ where: { childId: child.id } })
        ]);
        assert.equal(
          observations + plan + practice + checkpoints,
          0,
          "A synthetic profile was reused outside this test; keep it"
        );
        const sessions = await tx.dailyGameSession.findMany({
          where: { childId: child.id },
          select: { id: true }
        });
        const ids = sessions.map((session) => session.id);
        await tx.dailyRewardReceipt.deleteMany({ where: { sessionId: { in: ids } } });
        await tx.rewardInventory.deleteMany({ where: { childId: child.id } });
        await tx.dailyRewardReservation.deleteMany({ where: { sessionId: { in: ids } } });
        await tx.dailyGameSession.deleteMany({ where: { childId: child.id } });
        await tx.childProfile.delete({ where: { id: child.id } });
      });
      removed++;
    }
    console.log(
      `Removed ${removed} isolated C50 synthetic game profiles; existing profiles, learning history and family records retained`
    );
  } finally {
    await db.$disconnect();
  }
}
run().catch(() => {
  console.error(
    "C50 synthetic cleanup stopped; verify the local fixture preconditions. No credentials or profile data logged."
  );
  process.exitCode = 1;
});
