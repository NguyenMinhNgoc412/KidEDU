import { localDailyPreparation } from "../localPreparationBoundary";
import { localPreviewPlan } from "../localPreviewPlan";
import { initialDailyGameCheckpoint } from "../sessionEngine";
import type { createLocalApiClient } from "../../../api/localClient";

let mockLocal = true;
jest.mock("../../lessonRuntime/fixtureBoundary", () => ({ localFixtureEnabled: () => mockLocal }));
const plan = { ...localPreviewPlan, contentVersion: "local_daily_integration_v1" };
const session = {
  schemaVersion: 1 as const,
  id: "session",
  playDay: "2026-11-06",
  resetAt: "2026-11-06T17:00:00.000Z",
  revision: 1,
  completedAt: null,
  plan,
  checkpoint: initialDailyGameCheckpoint(plan)
};
const input = { accountId: "account", childId: "child", session };
let elapsed = 0;
const api = { getDailyGameStatus: jest.fn(), getSubscription: jest.fn() };
const getApi = () => api as unknown as ReturnType<typeof createLocalApiClient>;
beforeEach(() => {
  mockLocal = true;
  elapsed = 100;
  jest.resetAllMocks();
  api.getDailyGameStatus.mockResolvedValue({
    sessionId: session.id,
    playDay: session.playDay,
    serverNow: "2026-11-06T16:59:00.000Z",
    resetAt: session.resetAt,
    canStart: true
  });
});
it("uses a conservative monotonic reset boundary without API calls during inputs", async () => {
  const identity = jest.fn();
  const boundary = localDailyPreparation(getApi, identity, () => elapsed);
  const lease = await boundary.prepare(input);
  elapsed += 59999;
  lease.assertUsable();
  expect(api.getDailyGameStatus).toHaveBeenCalledTimes(1);
  elapsed++;
  expect(() => lease.assertUsable()).toThrow("EXPIRED");
  lease.close();
});
it("rejects production, unknown content, identity changes and closed leases", async () => {
  const identity = jest.fn();
  const boundary = localDailyPreparation(getApi, identity, () => elapsed);
  mockLocal = false;
  await expect(boundary.prepare(input)).rejects.toThrow("UNAVAILABLE");
  mockLocal = true;
  await expect(
    boundary.prepare({ ...input, session: { ...session, plan: localPreviewPlan } })
  ).rejects.toThrow("UNAVAILABLE");
  const lease = await boundary.prepare(input);
  identity.mockImplementation(() => {
    throw new Error("IDENTITY_CHANGED");
  });
  expect(() => lease.assertUsable()).toThrow("IDENTITY_CHANGED");
  identity.mockReset();
  lease.close();
  expect(() => lease.assertUsable()).toThrow("EXPIRED");
});
