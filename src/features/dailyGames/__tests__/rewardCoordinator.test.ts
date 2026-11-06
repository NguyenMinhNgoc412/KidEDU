import { DailyGameLocalRepository } from "../localRepository";
import { DailyRewardCoordinator } from "../rewardCoordinator";
import { TestDailyDatabase } from "./sqliteTestDatabase";

const account = "11111111-1111-4111-8111-111111111111";
const child = "22222222-2222-4222-8222-222222222222";
const session = "33333333-3333-4333-8333-333333333333";
const receipt = {
  schemaVersion: 1 as const,
  id: account,
  sessionId: session,
  boxIndex: 2,
  itemId: "sticker_test",
  catalogId: "catalog_test",
  catalogVersion: 1,
  claimedAt: "2026-11-06T12:00:00Z"
};
const boxes = {
  schemaVersion: 1 as const,
  sessionId: session,
  state: "boxes" as const,
  kind: "sticker" as const,
  receipt: null
};
let db: TestDailyDatabase;
let repository: DailyGameLocalRepository;
const api = {
  getDailyRewardState: jest.fn(),
  reserveDailyReward: jest.fn(),
  claimDailyReward: jest.fn()
};
beforeEach(async () => {
  jest.resetAllMocks();
  db = new TestDailyDatabase();
  repository = new DailyGameLocalRepository(db, account);
  await repository.initialize();
  api.getDailyRewardState.mockResolvedValue(boxes);
  api.claimDailyReward.mockResolvedValue(receipt);
});
afterEach(async () => {
  await repository.close();
  db.close();
});

it("pins the box before a failed request and recovers the same choice after coordinator restart", async () => {
  const first = new DailyRewardCoordinator(repository, child, session, () => api);
  api.claimDailyReward.mockRejectedValueOnce(new Error("LOST_ACK"));
  await expect(first.claim(2)).rejects.toThrow("LOST_ACK");
  first.close();
  const reopened = new DailyRewardCoordinator(repository, child, session, () => api);
  expect(await reopened.recover()).toEqual({ state: boxes, pendingBox: 2 });
  expect(await reopened.claim(0)).toEqual(receipt);
  expect(api.claimDailyReward.mock.calls.map((args) => args[2])).toEqual([2, 2]);
});

it("returns the server's first receipt when another device chose a different box", async () => {
  api.claimDailyReward.mockResolvedValue({ ...receipt, boxIndex: 1 });
  const controller = new DailyRewardCoordinator(repository, child, session, () => api);
  expect((await controller.claim(2)).boxIndex).toBe(1);
  expect(await repository.rewardBoxChoice(child, session)).toBe(2);
});

it("cannot reuse another child's local choice or send after account closure", async () => {
  await repository.chooseRewardBox(child, session, 1);
  const other = new DailyRewardCoordinator(repository, account, session, () => api);
  await expect(other.claim(0)).rejects.toThrow("CHILD_MISMATCH");
  expect(api.claimDailyReward).not.toHaveBeenCalled();
  const controller = new DailyRewardCoordinator(repository, child, session, () => api);
  controller.close();
  await expect(controller.claim(2)).rejects.toThrow("DAILY_REWARD_CLOSED");
  expect(api.claimDailyReward).not.toHaveBeenCalled();
});

it("recovers a confirmed receipt without reserving or claiming again", async () => {
  api.getDailyRewardState.mockResolvedValue({ ...boxes, state: "claimed", receipt });
  const controller = new DailyRewardCoordinator(repository, child, session, () => api);
  expect((await controller.recover()).state.receipt).toEqual(receipt);
  expect(api.reserveDailyReward).not.toHaveBeenCalled();
  expect(api.claimDailyReward).not.toHaveBeenCalled();
});
it("serializes foreground recovery behind an in-flight claim", async () => {
  let finish!: (value: typeof receipt) => void;
  api.claimDailyReward.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  api.getDailyRewardState.mockResolvedValue({ ...boxes, state: "claimed", receipt });
  const controller = new DailyRewardCoordinator(repository, child, session, () => api);
  const claim = controller.claim(2);
  const recovered = controller.recover();
  // Let SQLite persist the selection and the first network command start.
  for (let attempt = 0; attempt < 20 && !finish; attempt++)
    await new Promise((resolve) => setTimeout(resolve, 0));
  expect(finish).toBeDefined();
  expect(api.getDailyRewardState).not.toHaveBeenCalled();
  finish(receipt);
  await claim;
  expect((await recovered).state.receipt).toEqual(receipt);
  expect(api.claimDailyReward).toHaveBeenCalledTimes(1);
});
