import { ConflictException, GoneException, Injectable, NotFoundException } from "@nestjs/common";
import { isDeepStrictEqual } from "node:util";
import { lockDailyGameChild } from "./lock-child";
import { PrismaService } from "../database/prisma.service";
import { dailyGameAccess, dailyGameWindow } from "./daily-game.policy";
import { dailyGamePlanSchemaV1, validateDailyGameCheckpoint } from "./daily-game.contract";

// Internal persistence boundary. No controller accepts a plan from the mobile client.
// A future service must supply only a verified, published prepared plan.
@Injectable()
export class DailyGameRepository {
  constructor(private readonly prisma: PrismaService) {}

  async startOrResume(
    accountId: string,
    childId: string,
    resolvePublishedPlan: (tier: "basic" | "full") => unknown,
    clock: () => Date = () => new Date()
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockDailyGameChild(tx, accountId, childId);
      // Read time after lock acquisition: waiting across midnight cannot reserve yesterday.
      const now = clock();
      const window = dailyGameWindow(now);
      const existing = await tx.dailyGameSession.findUnique({
        where: { childId_playDay: { childId, playDay: window.playDay } }
      });
      // Returning a saved session is not a premium content/decryption grant.
      if (existing) return existing;
      const entitlement = await tx.entitlement.findUnique({ where: { accountId } });
      const { tier } = dailyGameAccess(entitlement, now);
      const plan = dailyGamePlanSchemaV1.parse(resolvePublishedPlan(tier));
      if (plan.tier !== tier) throw new Error("Published plan tier mismatch");
      return tx.dailyGameSession.create({
        data: {
          childId,
          ...window,
          tier,
          plan,
          checkpoint: {
            schemaVersion: 1,
            kind: "daily_game",
            contentVersion: plan.contentVersion,
            shadowScreenIndex: 0,
            placedTargetIds: [],
            listenRoundIndex: 0,
            memoryMatchedTargetIds: [],
            memoryOpenCardIds: []
          }
        }
      });
    });
  }

  async saveCheckpoint(
    accountId: string,
    childId: string,
    sessionId: string,
    expectedRevision: number,
    input: unknown,
    clock: () => Date = () => new Date()
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockDailyGameChild(tx, accountId, childId);
      const session = await tx.dailyGameSession.findFirst({ where: { id: sessionId, childId } });
      if (!session) throw new NotFoundException("Session not found");
      const next = validateDailyGameCheckpoint(session.plan, input);
      const previous = validateDailyGameCheckpoint(session.plan, session.checkpoint);
      // Lost ACK: same session/base revision/payload acknowledges the committed write.
      // It never advances the expired session or grants an unclaimed reward.
      if (session.revision === expectedRevision + 1 && isDeepStrictEqual(next, previous))
        return session;
      const now = clock();
      dailyGameWindow(now); // Reject invalid clocks, including during tests.
      if (now < session.startsAt || now >= session.resetAt)
        throw new GoneException("Session expired");
      if (session.revision !== expectedRevision || session.completedAt)
        throw new ConflictException("Reload the current session");
      if (
        next.shadowScreenIndex < previous.shadowScreenIndex ||
        next.listenRoundIndex < previous.listenRoundIndex ||
        (next.shadowScreenIndex === previous.shadowScreenIndex &&
          previous.placedTargetIds.some((id) => !next.placedTargetIds.includes(id))) ||
        previous.memoryMatchedTargetIds.some((id) => !next.memoryMatchedTargetIds.includes(id))
      )
        throw new ConflictException("Completed progress cannot move backwards");
      const complete = next.memoryMatchedTargetIds.length === 5;
      return tx.dailyGameSession.update({
        where: { id: session.id },
        data: { checkpoint: next, revision: { increment: 1 }, completedAt: complete ? now : null }
      });
    });
  }
}
