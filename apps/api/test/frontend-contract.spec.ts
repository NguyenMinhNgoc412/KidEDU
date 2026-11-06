import { createLocalApiClient } from "../../../src/api/localClient";
import { FamilyService } from "../src/families/family.service";
import { IdentityService } from "../src/identity/identity.service";
import { LearningService } from "../src/learning/learning.service";
import { SubscriptionService } from "../src/entitlement/subscription.service";
import { createApp } from "../src/main";

describe("frontend HTTP contract", () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  const childId = "11111111-1111-4111-8111-111111111111";
  const accountId = "33333333-3333-4333-8333-333333333333";

  beforeAll(async () => {
    app = await createApp();
    jest.spyOn(app.get(IdentityService), "resolveAccount").mockResolvedValue(accountId);
    jest.spyOn(app.get(FamilyService), "listChildren").mockResolvedValue([
      {
        id: childId,
        familyId: "22222222-2222-4222-8222-222222222222",
        displayName: "Bé Mẫu",
        birthYear: 2022,
        birthMonth: 6,
        gender: null,
        version: 1
      }
    ]);
    jest
      .spyOn(app.get(FamilyService), "listFamilies")
      .mockResolvedValue([{ id: "22222222-2222-4222-8222-222222222222", role: "owner" }]);
    jest.spyOn(app.get(FamilyService), "getChild").mockResolvedValue({
      id: childId,
      familyId: "22222222-2222-4222-8222-222222222222",
      displayName: "Bé Mẫu",
      birthYear: 2022,
      birthMonth: 6,
      gender: null,
      version: 1
    });
    jest.spyOn(app.get(FamilyService), "updateChild").mockResolvedValue({
      id: childId,
      familyId: "22222222-2222-4222-8222-222222222222",
      displayName: "Bé Mẫu mới",
      birthYear: 2022,
      birthMonth: 6,
      gender: null,
      version: 2
    });
    jest.spyOn(app.get(SubscriptionService), "current").mockResolvedValue({
      state: "none",
      version: 0,
      effectiveUntil: null,
      accessUntil: null,
      learningAllowed: false,
      allowedCapabilities: [],
      familyDataAllowed: true,
      serverTime: new Date()
    });
    jest
      .spyOn(app.get(LearningService), "getPlan")
      .mockResolvedValue({ revision: 0, document: null });
    jest
      .spyOn(app.get(LearningService), "savePlan")
      .mockImplementation(async (_account, _child, body) => {
        const input = body as {
          document: {
            schemaVersion: 1;
            contentReleaseId: string;
            goalIds: string[];
            items: { lessonId: string; lessonVersion: number }[];
          };
        };
        return { revision: 1, document: input.document, updatedAt: new Date() };
      });
    jest
      .spyOn(app.get(LearningService), "ingest")
      .mockResolvedValue({ results: [{ eventId: "event-1", status: "accepted" }] });
    jest
      .spyOn(app.get(LearningService), "observations")
      .mockResolvedValue({ observations: [], nextCursor: null });
    jest.spyOn(app.get(LearningService), "supersedeObservation").mockResolvedValue({
      status: "accepted",
      observationId: "44444444-4444-4444-8444-444444444444",
      supersedesId: "55555555-5555-4555-8555-555555555555"
    });
    await app.listen(0, "127.0.0.1");
  });

  afterAll(async () => {
    await app?.close();
  });

  it("uses the same paths, request bodies and response shape as Nest", async () => {
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string") throw new Error("API did not bind");
    const api = createLocalApiClient(`http://127.0.0.1:${address.port}`, "signed-test-token");
    expect((await api.getMe()).id).toBe(accountId);
    expect((await api.getSubscription()).learningAllowed).toBe(false);
    expect((await api.listChildren())[0]?.id).toBe(childId);
    expect((await api.listFamilies())[0]?.role).toBe("owner");
    expect((await api.getChild(childId)).version).toBe(1);
    expect((await api.updateChild(childId, 1, { displayName: "Bé Mẫu mới" })).version).toBe(2);
    expect((await api.getPlan(childId)).revision).toBe(0);
    const saved = await api.savePlan(childId, 0, {
      schemaVersion: 1,
      contentReleaseId: "release-1",
      goalIds: ["goal-1"],
      items: [{ lessonId: "lesson-1", lessonVersion: 1 }]
    });
    expect(saved.revision).toBe(1);
    const batch = await api.ingestObservations(childId, [
      {
        schemaVersion: 1,
        eventId: "event-1",
        eventType: "observation.recorded",
        childId,
        occurredAt: "2026-10-01T10:00:00Z",
        payload: {
          goalId: "goal-1",
          targetId: "target-1",
          activityType: "recognition",
          contentVersion: 1,
          result: "supported",
          promptLevel: 1,
          context: "in_app",
          sessionId: "session-1"
        }
      }
    ]);
    expect(batch.results[0]?.status).toBe("accepted");
    expect((await api.listObservations(childId)).observations).toEqual([]);
    expect(
      (
        await api.supersedeObservation(
          "55555555-5555-4555-8555-555555555555",
          "correction-1",
          "independent",
          null
        )
      ).status
    ).toBe("accepted");
    expect(app.get(LearningService).supersedeObservation).toHaveBeenCalledWith(
      expect.any(String),
      "55555555-5555-4555-8555-555555555555",
      { eventId: "correction-1", result: "independent", promptLevel: null }
    );
  });
});
