import { PrismaClient } from "../generated/prisma";

import { ApiRequestError, createLocalApiClient } from "../../../src/api/localClient";
import { IdentityService } from "../src/identity/identity.service";
import { createApp } from "../src/main";

const databaseUrl = process.env.DATABASE_POOL_URL;
if (!databaseUrl || !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):\d+\//.test(databaseUrl)) {
  throw new Error("Integration tests require a local PostgreSQL DATABASE_POOL_URL");
}

describe("frontend client against PostgreSQL learning API", () => {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  let app: Awaited<ReturnType<typeof createApp>>;
  let accountId: string;
  let otherAccountId: string;
  let familyId: string;
  let childId: string;
  let owner: ReturnType<typeof createLocalApiClient>;
  let outsider: ReturnType<typeof createLocalApiClient>;

  beforeAll(async () => {
    const account = await prisma.account.create({ data: {} });
    const other = await prisma.account.create({ data: {} });
    accountId = account.id;
    otherAccountId = other.id;
    await prisma.entitlement.create({
      data: {
        accountId,
        state: "active",
        effectiveUntil: new Date(Date.now() + 60_000),
        capabilities: ["learning.plan.full", "content.pack.full"],
        source: "local-test"
      }
    });
    const family = await prisma.family.create({
      data: { members: { create: { accountId, role: "owner" } } }
    });
    familyId = family.id;
    const child = await prisma.childProfile.create({ data: { familyId, displayName: "Bé Mẫu" } });
    childId = child.id;
    app = await createApp();
    jest
      .spyOn(app.get(IdentityService), "resolveAccount")
      .mockImplementation(async (token) => (token === "owner-token" ? accountId : otherAccountId));
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string") throw new Error("API did not bind");
    const url = `http://127.0.0.1:${address.port}`;
    owner = createLocalApiClient(url, "owner-token");
    outsider = createLocalApiClient(url, "outsider-token");
  });

  afterAll(async () => {
    await app?.close();
    if (childId) {
      await prisma.observationSupersession.deleteMany({
        where: { original: { childId } }
      });
      await prisma.observation.deleteMany({ where: { childId } });
      await prisma.learningPlan.deleteMany({ where: { childId } });
      await prisma.childProfile.delete({ where: { id: childId } });
    }
    if (familyId) {
      await prisma.familyMember.deleteMany({ where: { familyId } });
      await prisma.family.delete({ where: { id: familyId } });
    }
    if (accountId) await prisma.entitlement.deleteMany({ where: { accountId } });
    if (accountId) await prisma.account.delete({ where: { id: accountId } });
    if (otherAccountId) await prisma.account.delete({ where: { id: otherAccountId } });
    await prisma.$disconnect();
  });

  it("writes and reads plan and observations while rejecting cross-family access", async () => {
    expect((await owner.getMe()).id).toBe(accountId);
    expect((await owner.getSubscription()).learningAllowed).toBe(true);
    expect((await outsider.getSubscription()).learningAllowed).toBe(false);
    expect((await owner.listFamilies()).map((family) => family.id)).toContain(familyId);
    expect((await outsider.listFamilies()).map((family) => family.id)).not.toContain(familyId);
    expect((await owner.listChildren()).map((child) => child.id)).toContain(childId);
    expect((await owner.getChild(childId)).version).toBe(1);
    const updatedChild = await owner.updateChild(childId, 1, { displayName: "Bé Mẫu mới" });
    expect(updatedChild).toMatchObject({ displayName: "Bé Mẫu mới", version: 2 });
    await expect(owner.updateChild(childId, 1, { displayName: "Bé Mẫu cũ" })).rejects.toMatchObject(
      {
        status: 409
      }
    );
    await expect(outsider.getChild(childId)).rejects.toMatchObject({ status: 404 });
    await expect(
      outsider.updateChild(childId, 2, { displayName: "Không được sửa" })
    ).rejects.toMatchObject({ status: 404 });
    expect(await owner.getPlan(childId)).toMatchObject({ revision: 0, document: null });
    const document = {
      schemaVersion: 1 as const,
      contentReleaseId: "release-1",
      goalIds: ["goal-1"],
      items: [{ lessonId: "lesson-1", lessonVersion: 1 }]
    };
    expect((await owner.savePlan(childId, 0, document)).revision).toBe(1);
    await expect(owner.savePlan(childId, 0, document)).rejects.toMatchObject({ status: 409 });
    const event = {
      schemaVersion: 1 as const,
      eventId: "local-test-event",
      eventType: "observation.recorded" as const,
      childId,
      occurredAt: "2026-10-01T10:00:00Z",
      payload: {
        goalId: "goal-1",
        targetId: "target-1",
        activityType: "recognition" as const,
        contentVersion: 1,
        result: "supported" as const,
        promptLevel: 1,
        context: "in_app" as const,
        sessionId: "session-1"
      }
    };
    expect((await owner.ingestObservations(childId, [event])).results[0]?.status).toBe("accepted");
    expect((await owner.ingestObservations(childId, [event])).results[0]?.status).toBe("duplicate");
    expect((await owner.listObservations(childId)).observations[0]).toMatchObject({
      eventId: event.eventId,
      result: "supported"
    });
    const originalObservationId = (await owner.listObservations(childId)).observations[0]?.id;
    if (!originalObservationId) throw new Error("Observation was not persisted");
    const correction = await owner.supersedeObservation(
      originalObservationId,
      "local-correction-1",
      "independent",
      null
    );
    expect(correction.status).toBe("accepted");
    expect(
      (
        await owner.supersedeObservation(
          originalObservationId,
          "local-correction-1",
          "independent",
          null
        )
      ).status
    ).toBe("duplicate");
    const history = (await owner.listObservations(childId)).observations;
    expect(history.find((item) => item.id === originalObservationId)?.supersededById).toBe(
      correction.observationId
    );
    expect(history.find((item) => item.id === correction.observationId)?.supersedesId).toBe(
      originalObservationId
    );
    await expect(
      outsider.supersedeObservation(originalObservationId, "other-correction", "not_yet", null)
    ).rejects.toMatchObject({ status: 404 });
    await expect(outsider.getPlan(childId)).rejects.toBeInstanceOf(ApiRequestError);
    await expect(outsider.listObservations(childId)).rejects.toMatchObject({ status: 404 });
  });
});
