import { randomInt } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { lockDailyGameChild } from "./lock-child";
import {
  remainingRewardPool,
  reserveFourBoxes,
  rewardClaimBoundary,
  type RewardPoolItem
} from "./daily-game.policy";

// Internal adapter input only. Publication/readiness verification belongs to the catalog
// resolver; never deserialize this projection from a mobile request.
export type PublishedRewardPool = {
  catalogId: string;
  version: number;
  items: readonly RewardPoolItem[];
};

@Injectable()
export class DailyRewardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Recovery is read-only and does not depend on the current catalog or entitlement.
   * Never expose the reserved candidates before a box is committed. */
  async state(
    accountId: string,
    childId: string,
    sessionId: string,
    clock: () => Date = () => new Date()
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockDailyGameChild(tx, accountId, childId);
      const session = await tx.dailyGameSession.findFirst({ where: { id: sessionId, childId } });
      if (!session) throw new NotFoundException("Session not found");
      const receipt = await tx.dailyRewardReceipt.findUnique({
        where: { sessionId },
        include: { inventory: true }
      });
      const reservation = await tx.dailyRewardReservation.findUnique({ where: { sessionId } });
      const now = clock();
      if (!Number.isFinite(now.getTime())) throw new Error("Invalid server time");
      return {
        schemaVersion: 1 as const,
        sessionId,
        state: receipt
          ? ("claimed" as const)
          : now >= session.resetAt || now < session.startsAt
            ? ("expired" as const)
            : !session.completedAt
              ? ("incomplete" as const)
              : reservation
                ? ("boxes" as const)
                : ("choose_kind" as const),
        kind: reservation?.kind ?? null,
        receipt: receipt
          ? {
              schemaVersion: 1 as const,
              id: receipt.id,
              sessionId,
              boxIndex: receipt.boxIndex,
              itemId: receipt.inventory.itemId,
              catalogId: receipt.inventory.catalogId,
              catalogVersion: receipt.inventory.catalogVersion,
              claimedAt: receipt.claimedAt.toISOString()
            }
          : null
      };
    });
  }

  async reserve(
    accountId: string,
    childId: string,
    sessionId: string,
    kind: "sticker" | "puzzle_piece",
    catalog: PublishedRewardPool,
    clock: () => Date = () => new Date()
  ) {
    return this.prisma.$transaction(async (tx) => {
      const child = await lockDailyGameChild(tx, accountId, childId);
      const session = await tx.dailyGameSession.findFirst({ where: { id: sessionId, childId } });
      if (!session) throw new NotFoundException("Session not found");
      const boundary = rewardClaimBoundary({
        serverNow: clock(),
        startsAt: session.startsAt,
        resetAt: session.resetAt,
        completed: session.completedAt !== null,
        hasConfirmedReceipt: false
      });
      if (boundary === "expired") throw new GoneException("Reward expired");
      if (boundary !== "claimable") throw new ConflictException("Complete all three games first");
      const existing = await tx.dailyRewardReservation.findUnique({ where: { sessionId } });
      if (existing) {
        if (existing.kind !== kind) throw new ConflictException("Reward kind already selected");
        return { sessionId, kind: existing.kind, boxCount: 4 as const };
      }
      if (!child.gender) throw new ConflictException("Parent must complete the child profile");
      const owned = await tx.rewardInventory.findMany({
        where: { childId },
        select: { itemId: true }
      });
      const pool = remainingRewardPool(
        catalog.items,
        child.gender,
        new Set(owned.map((i) => i.itemId))
      );
      if (pool[kind].disabled) throw new ConflictException("Reward kind exhausted");
      if (
        !/^[a-z][a-z0-9_:-]{2,159}$/.test(catalog.catalogId) ||
        !Number.isSafeInteger(catalog.version) ||
        catalog.version < 1 ||
        catalog.items.some((item) => !/^[a-z][a-z0-9_:-]{2,159}$/.test(item.id))
      )
        throw new Error("Invalid published catalog projection");
      const candidates = reserveFourBoxes(pool[kind].items, randomInt);
      await tx.dailyRewardReservation.create({
        data: {
          sessionId,
          catalogId: catalog.catalogId,
          catalogVersion: catalog.version,
          kind,
          rewardGroup: child.gender,
          candidates
        }
      });
      // Box contents stay on the server until one choice is committed.
      return { sessionId, kind, boxCount: 4 as const };
    });
  }

  async claim(
    accountId: string,
    childId: string,
    sessionId: string,
    boxIndex: number,
    clock: () => Date = () => new Date()
  ) {
    if (!Number.isInteger(boxIndex) || boxIndex < 0 || boxIndex > 3)
      throw new BadRequestException("Invalid box index");
    return this.prisma.$transaction(async (tx) => {
      await lockDailyGameChild(tx, accountId, childId);
      const session = await tx.dailyGameSession.findFirst({ where: { id: sessionId, childId } });
      if (!session) throw new NotFoundException("Session not found");
      const existing = await tx.dailyRewardReceipt.findUnique({
        where: { sessionId },
        include: { inventory: true }
      });
      // Session identity is the stable idempotency key across devices. First choice wins;
      // every retry returns that receipt, including after midnight or subscription expiry.
      if (existing) return existing;
      const boundary = rewardClaimBoundary({
        serverNow: clock(),
        startsAt: session.startsAt,
        resetAt: session.resetAt,
        completed: session.completedAt !== null,
        hasConfirmedReceipt: false
      });
      if (boundary === "expired") throw new GoneException("Reward expired");
      if (boundary !== "claimable") throw new ConflictException("Complete all three games first");
      const reservation = await tx.dailyRewardReservation.findUnique({ where: { sessionId } });
      if (!reservation) throw new ConflictException("Choose a reward kind first");
      const itemId = reservation.candidates[boxIndex];
      if (!itemId) throw new Error("Invalid persisted reward reservation");
      const owned = await tx.rewardInventory.findUnique({
        where: { childId_itemId: { childId, itemId } }
      });
      if (owned)
        throw new ConflictException("Reserved reward already owned; reconciliation required");
      const now = clock();
      // Recheck before mutation; a long wait/query must not award after reset.
      if (now >= session.resetAt || now < session.startsAt || !Number.isFinite(now.getTime()))
        throw new GoneException("Reward expired");
      const inventory = await tx.rewardInventory.create({
        data: {
          childId,
          itemId,
          catalogId: reservation.catalogId,
          catalogVersion: reservation.catalogVersion,
          acquiredAt: now
        }
      });
      return tx.dailyRewardReceipt.create({
        data: {
          sessionId,
          inventoryId: inventory.id,
          boxIndex,
          claimedAt: now
        },
        include: { inventory: true }
      });
    });
  }

  async inventory(accountId: string, childId: string, catalog?: PublishedRewardPool) {
    return this.prisma.$transaction(async (tx) => {
      const child = await lockDailyGameChild(tx, accountId, childId);
      // Family-owned rewards remain readable without paid entitlement or a gender match.
      const items = await tx.rewardInventory.findMany({
        where: { childId },
        orderBy: [{ acquiredAt: "asc" }, { id: "asc" }]
      });
      const pool = remainingRewardPool(
        catalog?.items ?? [],
        child.gender,
        new Set(items.map((item) => item.itemId))
      );
      return {
        items,
        profileRequired: pool.profileRequired,
        remaining: catalog
          ? {
              sticker: pool.sticker.remaining,
              puzzle_piece: pool.puzzle_piece.remaining
            }
          : null
      };
    });
  }
}
