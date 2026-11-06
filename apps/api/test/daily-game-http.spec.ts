import { ServiceUnavailableException } from "@nestjs/common";
import { createLocalApiClient } from "../../../src/api/localClient";
import { IdentityService } from "../src/identity/identity.service";
import { DailyGameService } from "../src/daily-games/daily-game.service";
import { createApp } from "../src/main";

describe("daily-game HTTP/mobile contract", () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  const childId = "11111111-1111-4111-8111-111111111111";
  const accountId = "22222222-2222-4222-8222-222222222222";
  const sessionId = "33333333-3333-4333-8333-333333333333";
  beforeAll(async () => {
    app = await createApp();
    jest.spyOn(app.get(IdentityService), "resolveAccount").mockResolvedValue(accountId);
    await app.listen(0, "127.0.0.1");
  });
  afterAll(async () => app?.close());
  it("routes typed commands through authentication and preserves hidden box contents", async () => {
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string") throw new Error("API not bound");
    const base = `http://127.0.0.1:${address.port}`;
    const api = createLocalApiClient(base, "synthetic-token");
    const service = app.get(DailyGameService);
    const recovery = jest.spyOn(service, "rewardState").mockResolvedValue({
      schemaVersion: 1,
      sessionId,
      state: "boxes",
      kind: "sticker",
      receipt: null
    });
    expect(await api.getDailyRewardState(childId, sessionId)).toEqual({
      schemaVersion: 1,
      sessionId,
      state: "boxes",
      kind: "sticker",
      receipt: null
    });
    expect(recovery).toHaveBeenCalledWith(accountId, childId, sessionId);
    const status = jest.spyOn(service, "status").mockResolvedValue({
      schemaVersion: 1,
      serverNow: "2026-11-06T12:00:00Z",
      playDay: "2026-11-06",
      resetAt: "2026-11-06T17:00:00Z",
      tier: "basic",
      contentReady: false,
      state: "available",
      sessionId: null,
      canStart: false
    });
    expect((await api.getDailyGameStatus(childId)).canStart).toBe(false);
    expect(status).toHaveBeenCalledWith(accountId, childId);
    const denied = await fetch(`${base}/v1/children/${childId}/daily-game`);
    expect(denied.status).toBe(401);
    const start = jest.spyOn(service, "start").mockRejectedValue(new ServiceUnavailableException());
    await expect(api.startDailyGame(childId)).rejects.toMatchObject({ status: 503 });
    expect(start).toHaveBeenCalledWith(accountId, childId, {});
    const reserve = jest
      .spyOn(service, "reserve")
      .mockResolvedValue({ sessionId, kind: "sticker", boxCount: 4 });
    expect(await api.reserveDailyReward(childId, sessionId, "sticker")).toEqual({
      sessionId,
      kind: "sticker",
      boxCount: 4
    });
    expect(reserve).toHaveBeenCalledWith(accountId, childId, sessionId, { kind: "sticker" });
    const claim = jest.spyOn(service, "claim").mockResolvedValue({
      schemaVersion: 1,
      id: "receipt-test",
      sessionId,
      boxIndex: 2,
      itemId: "sticker_test",
      catalogId: "catalog_test",
      catalogVersion: 1,
      claimedAt: "2026-11-06T12:01:00Z"
    });
    expect((await api.claimDailyReward(childId, sessionId, 2)).itemId).toBe("sticker_test");
    expect(claim).toHaveBeenCalledWith(accountId, childId, sessionId, { boxIndex: 2 });
    const checkpoint = {
      schemaVersion: 1 as const,
      kind: "daily_game" as const,
      contentVersion: "content_test",
      shadowScreenIndex: 0,
      placedTargetIds: [],
      listenRoundIndex: 0,
      memoryMatchedTargetIds: [],
      memoryOpenCardIds: []
    };
    const save = jest.spyOn(service, "checkpoint").mockResolvedValue({
      schemaVersion: 1,
      sessionId,
      revision: 2,
      completedAt: null,
      checkpoint
    });
    expect((await api.saveDailyGameCheckpoint(childId, sessionId, 1, checkpoint)).revision).toBe(2);
    expect(save).toHaveBeenCalledWith(accountId, childId, sessionId, {
      expectedRevision: 1,
      checkpoint
    });
  });
});
