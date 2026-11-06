import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import type { PrismaService } from "../src/database/prisma.service";
import type { DailyGameRepository } from "../src/daily-games/daily-game.repository";
import type { DailyRewardRepository } from "../src/daily-games/daily-reward.repository";
import { DailyGameService } from "../src/daily-games/daily-game.service";
import {
  UnavailableDailyContentGateway,
  type DailyContentGateway
} from "../src/daily-games/daily-content.gateway";

const childId = "11111111-1111-4111-8111-111111111111";
const accountId = "22222222-2222-4222-8222-222222222222";
const status = {
  schemaVersion: 1 as const,
  serverNow: "2026-11-06T12:00:00Z",
  playDay: "2026-11-06",
  resetAt: "2026-11-06T17:00:00Z",
  tier: "basic" as const,
  contentReady: false,
  state: "available" as const,
  sessionId: null,
  canStart: false
};

function fixture(content: DailyContentGateway = new UnavailableDailyContentGateway()) {
  const startOrResume = jest.fn();
  const entitlement = jest.fn().mockResolvedValue(null);
  const service = new DailyGameService(
    { entitlement: { findUnique: entitlement } } as unknown as PrismaService,
    { startOrResume } as unknown as DailyGameRepository,
    {} as DailyRewardRepository,
    content
  );
  jest.spyOn(service, "status").mockResolvedValue(status);
  return { service, startOrResume };
}

it("does not consume a turn when reviewed content is unavailable", async () => {
  const { service, startOrResume } = fixture();
  await expect(service.start(accountId, childId, {})).rejects.toBeInstanceOf(
    ServiceUnavailableException
  );
  expect(startOrResume).not.toHaveBeenCalled();
});
it("rejects client-authored plans and invalid child identifiers before persistence", async () => {
  const { service, startOrResume } = fixture();
  await expect(
    service.start(accountId, childId, { tier: "full", plan: {} })
  ).rejects.toBeInstanceOf(BadRequestException);
  await expect(service.start(accountId, "invalid", {})).rejects.toBeInstanceOf(NotFoundException);
  expect(startOrResume).not.toHaveBeenCalled();
});
it("does not release a saved full plan after entitlement expiry", async () => {
  const { service, startOrResume } = fixture({ ready: true, plan: jest.fn(), rewards: jest.fn() });
  startOrResume.mockResolvedValue({ tier: "full" });
  await expect(service.start(accountId, childId, {})).rejects.toBeInstanceOf(ForbiddenException);
});
