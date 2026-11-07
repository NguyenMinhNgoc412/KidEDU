import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../database/prisma.service";
import { DAILY_CONTENT_GATEWAY, type DailyContentGateway } from "./daily-content.gateway";
import { dailyGameAccess, dailyGameWindow } from "./daily-game.policy";
import { DailyGameRepository } from "./daily-game.repository";
import { DailyRewardRepository } from "./daily-reward.repository";
import { dailyGameCheckpointSchemaV1, validateDailyGameCheckpoint } from "./daily-game.contract";
import { lockDailyGameChild } from "./lock-child";

const checkpointBody = z.strictObject({
  expectedRevision: z.number().int().positive(),
  checkpoint: dailyGameCheckpointSchemaV1
});
const kindBody = z.strictObject({ kind: z.enum(["sticker", "puzzle_piece"]) });
const boxBody = z.strictObject({ boxIndex: z.number().int().min(0).max(3) });
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException("Invalid daily-game command");
  return result.data;
}

@Injectable()
export class DailyGameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: DailyGameRepository,
    private readonly rewards: DailyRewardRepository,
    @Inject(DAILY_CONTENT_GATEWAY) private readonly content: DailyContentGateway
  ) {}

  private ids(childId: string, sessionId?: string) {
    if (
      !z.uuid().safeParse(childId).success ||
      (sessionId !== undefined && !z.uuid().safeParse(sessionId).success)
    )
      throw new NotFoundException();
  }

  async status(accountId: string, childId: string) {
    this.ids(childId);
    return this.prisma.$transaction(async (tx) => {
      await lockDailyGameChild(tx, accountId, childId);
      const now = new Date();
      const window = dailyGameWindow(now);
      const access = dailyGameAccess(
        await tx.entitlement.findUnique({ where: { accountId } }),
        now
      );
      const session = await tx.dailyGameSession.findUnique({
        where: { childId_playDay: { childId, playDay: window.playDay } }
      });
      return {
        schemaVersion: 1 as const,
        serverNow: now.toISOString(),
        playDay: window.playDay,
        resetAt: window.resetAt.toISOString(),
        tier: access.tier,
        contentReady: this.content.ready,
        state: session
          ? session.completedAt
            ? ("completed" as const)
            : ("resumable" as const)
          : ("available" as const),
        sessionId: session?.id ?? null,
        canStart:
          this.content.ready &&
          !session?.completedAt &&
          (!session || session.tier === "basic" || access.tier === "full")
      };
    });
  }

  async start(accountId: string, childId: string, body: unknown) {
    this.ids(childId);
    parse(z.strictObject({}), body);
    // Ownership is checked even while publication is unavailable.
    await this.status(accountId, childId);
    if (!this.content.ready) throw new ServiceUnavailableException("Daily content is not ready");
    const session = await this.sessions.startOrResume(accountId, childId, (tier) =>
      this.content.plan(tier)
    );
    const access = dailyGameAccess(
      await this.prisma.entitlement.findUnique({ where: { accountId } }),
      new Date()
    );
    if (session.tier === "full" && access.tier !== "full")
      throw new ForbiddenException("Full session access has expired");
    return this.sessionDto(session);
  }

  /** Explicit local test command. Production and ordinary fixture users cannot invoke it. */
  async restartLocalTest(accountId: string, childId: string, body: unknown) {
    this.ids(childId);
    const { sessionId } = parse(z.strictObject({ sessionId: z.uuid() }), body);
    if (
      process.env.APP_ENV !== "local" ||
      process.env.C50_LOCAL_DAILY_FIXTURE !== "1" ||
      accountId !== "00000000-0000-4000-8000-000000000002"
    )
      throw new NotFoundException();
    return this.prisma.$transaction(async (tx) => {
      await lockDailyGameChild(tx, accountId, childId);
      const identity = await tx.authIdentity.findFirst({
        where: {
          accountId,
          provider: "supabase",
          subject: "local-full-access-parent"
        }
      });
      const entitlement = await tx.entitlement.findUnique({ where: { accountId } });
      if (!identity || entitlement?.source !== "local_fixture") throw new NotFoundException();
      const { playDay } = dailyGameWindow(new Date());
      const current = await tx.dailyGameSession.findUnique({
        where: { childId_playDay: { childId, playDay } }
      });
      if (!current) return { restarted: true as const };
      if (current.id !== sessionId || !current.completedAt)
        throw new ConflictException("Only the completed test session can be restarted");
      // Retain every owned gift and all learning data; retire only this test run's metadata.
      await tx.dailyRewardReceipt.deleteMany({ where: { sessionId } });
      await tx.dailyRewardReservation.deleteMany({ where: { sessionId } });
      await tx.dailyGameSession.delete({ where: { id: sessionId } });
      return { restarted: true as const };
    });
  }

  private sessionDto(session: Awaited<ReturnType<DailyGameRepository["startOrResume"]>>) {
    return {
      schemaVersion: 1 as const,
      id: session.id,
      playDay: session.playDay,
      resetAt: session.resetAt.toISOString(),
      revision: session.revision,
      completedAt: session.completedAt?.toISOString() ?? null,
      plan: session.plan,
      checkpoint: session.checkpoint
    };
  }

  async checkpoint(accountId: string, childId: string, sessionId: string, body: unknown) {
    this.ids(childId, sessionId);
    const command = parse(checkpointBody, body);
    // Reference errors become 400 without exposing the submitted body in logs.
    const session = await this.prisma.dailyGameSession.findFirst({
      where: {
        id: sessionId,
        childId,
        child: { deletedAt: null, family: { deletedAt: null, members: { some: { accountId } } } }
      }
    });
    if (!session) throw new NotFoundException();
    try {
      validateDailyGameCheckpoint(session.plan, command.checkpoint);
    } catch {
      throw new BadRequestException("Invalid checkpoint references");
    }
    const saved = await this.sessions.saveCheckpoint(
      accountId,
      childId,
      sessionId,
      command.expectedRevision,
      command.checkpoint
    );
    // Sync acknowledgment never returns premium plan/media or acts as an access grant.
    return {
      schemaVersion: 1 as const,
      sessionId,
      revision: saved.revision,
      checkpoint: saved.checkpoint,
      completedAt: saved.completedAt?.toISOString() ?? null
    };
  }

  async reserve(accountId: string, childId: string, sessionId: string, body: unknown) {
    this.ids(childId, sessionId);
    const { kind } = parse(kindBody, body);
    await this.status(accountId, childId);
    return this.rewards.reserve(accountId, childId, sessionId, kind, this.content.rewards());
  }

  async rewardState(accountId: string, childId: string, sessionId: string) {
    this.ids(childId, sessionId);
    return this.rewards.state(accountId, childId, sessionId);
  }

  async claim(accountId: string, childId: string, sessionId: string, body: unknown) {
    this.ids(childId, sessionId);
    const { boxIndex } = parse(boxBody, body);
    const receipt = await this.rewards.claim(accountId, childId, sessionId, boxIndex);
    return {
      schemaVersion: 1 as const,
      id: receipt.id,
      sessionId,
      boxIndex: receipt.boxIndex,
      itemId: receipt.inventory.itemId,
      catalogId: receipt.inventory.catalogId,
      catalogVersion: receipt.inventory.catalogVersion,
      claimedAt: receipt.claimedAt.toISOString()
    };
  }

  async inventory(accountId: string, childId: string) {
    this.ids(childId);
    const result = await this.rewards.inventory(
      accountId,
      childId,
      this.content.ready ? this.content.rewards() : undefined
    );
    return {
      schemaVersion: 1 as const,
      profileRequired: result.profileRequired,
      remaining: result.remaining,
      items: result.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        catalogId: item.catalogId,
        catalogVersion: item.catalogVersion,
        acquiredAt: item.acquiredAt.toISOString()
      }))
    };
  }
}
