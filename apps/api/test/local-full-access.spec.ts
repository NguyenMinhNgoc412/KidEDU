import { ConflictException, NotFoundException } from "@nestjs/common";
import { DailyGameService } from "../src/daily-games/daily-game.service";
import type { PrismaService } from "../src/database/prisma.service";
import type { DailyGameRepository } from "../src/daily-games/daily-game.repository";
import type { DailyRewardRepository } from "../src/daily-games/daily-reward.repository";
import { UnavailableDailyContentGateway } from "../src/daily-games/daily-content.gateway";
const accountId = "00000000-0000-4000-8000-000000000002";
const childId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const originalEnv = { ...process.env };
afterEach(() => {
  process.env = { ...originalEnv };
});
function fixture() {
  process.env.APP_ENV = "local";
  process.env.C50_LOCAL_DAILY_FIXTURE = "1";
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: childId }]),
    authIdentity: { findFirst: jest.fn().mockResolvedValue({ accountId }) },
    entitlement: { findUnique: jest.fn().mockResolvedValue({ source: "local_fixture" }) },
    dailyGameSession: {
      findUnique: jest.fn().mockResolvedValue({ id: sessionId, completedAt: new Date() }),
      delete: jest.fn()
    },
    dailyRewardReceipt: { deleteMany: jest.fn() },
    dailyRewardReservation: { deleteMany: jest.fn() }
  };
  const transaction = jest.fn((run) => run(tx));
  const service = new DailyGameService(
    { $transaction: transaction } as unknown as PrismaService,
    {} as DailyGameRepository,
    {} as DailyRewardRepository,
    new UnavailableDailyContentGateway()
  );
  return { tx, transaction, service };
}
it.each(["production", "staging", "test"])(
  "rejects test restart in %s before accessing data",
  async (env) => {
    const { service, transaction } = fixture();
    process.env.APP_ENV = env;
    await expect(
      service.restartLocalTest(accountId, childId, { sessionId })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transaction).not.toHaveBeenCalled();
  }
);
it("rejects ordinary accounts and disabled fixtures", async () => {
  const { service, transaction } = fixture();
  await expect(service.restartLocalTest(childId, childId, { sessionId })).rejects.toBeInstanceOf(
    NotFoundException
  );
  process.env.C50_LOCAL_DAILY_FIXTURE = "0";
  await expect(service.restartLocalTest(accountId, childId, { sessionId })).rejects.toBeInstanceOf(
    NotFoundException
  );
  expect(transaction).not.toHaveBeenCalled();
});
it("requires fixture provenance and child ownership", async () => {
  const { service, tx } = fixture();
  tx.$queryRaw.mockResolvedValueOnce([]);
  await expect(service.restartLocalTest(accountId, childId, { sessionId })).rejects.toBeInstanceOf(
    NotFoundException
  );
  tx.entitlement.findUnique.mockResolvedValueOnce({ source: "store" });
  await expect(service.restartLocalTest(accountId, childId, { sessionId })).rejects.toBeInstanceOf(
    NotFoundException
  );
  expect(tx.dailyGameSession.delete).not.toHaveBeenCalled();
});
it("does not reset an active or replaced session", async () => {
  const { service, tx } = fixture();
  tx.dailyGameSession.findUnique.mockResolvedValueOnce({ id: sessionId, completedAt: null });
  await expect(service.restartLocalTest(accountId, childId, { sessionId })).rejects.toBeInstanceOf(
    ConflictException
  );
  await expect(
    service.restartLocalTest(accountId, childId, { sessionId: childId })
  ).rejects.toBeInstanceOf(ConflictException);
  expect(tx.dailyRewardReceipt.deleteMany).not.toHaveBeenCalled();
});
it("retires only completed test metadata without deleting owned inventory", async () => {
  const { service, tx } = fixture();
  expect(await service.restartLocalTest(accountId, childId, { sessionId })).toEqual({
    restarted: true
  });
  expect(tx.dailyRewardReceipt.deleteMany).toHaveBeenCalledWith({ where: { sessionId } });
  expect(tx.dailyRewardReservation.deleteMany).toHaveBeenCalledWith({ where: { sessionId } });
  expect(tx.dailyGameSession.delete).toHaveBeenCalledWith({ where: { id: sessionId } });
  tx.dailyGameSession.findUnique.mockResolvedValueOnce(null);
  expect(await service.restartLocalTest(accountId, childId, { sessionId })).toEqual({
    restarted: true
  });
});
