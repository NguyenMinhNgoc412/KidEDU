import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../database/prisma.service";
import { SubscriptionService } from "../entitlement/subscription.service";
import { practiceCatalog } from "./practice.catalog";
import {
  checkpointSchema,
  practiceSaveSchema,
  practicePrepareSchema,
  sessionIdSchema
} from "./practice.schemas";

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscription: SubscriptionService
  ) {}

  private async ownedChild(accountId: string, childId: string) {
    if (!z.uuid().safeParse(childId).success) throw new NotFoundException();
    const child = await this.prisma.childProfile.findFirst({
      where: {
        id: childId,
        deletedAt: null,
        family: { deletedAt: null, members: { some: { accountId } } }
      },
      select: { id: true }
    });
    if (!child) throw new NotFoundException();
  }
  private async learningAccess(accountId: string) {
    if (!(await this.subscription.current(accountId)).learningAllowed)
      throw new ForbiddenException();
  }
  async catalog(accountId: string, childId: string) {
    await this.ownedChild(accountId, childId);
    const access = await this.subscription.current(accountId);
    const catalog = practiceCatalog();
    return {
      ...catalog,
      lessons: access.learningAllowed ? catalog.lessons : [],
      learningAllowed: access.learningAllowed
    };
  }
  async plan(accountId: string, childId: string) {
    await this.ownedChild(accountId, childId);
    const plan = await this.prisma.practicePlan.findUnique({ where: { childId } });
    return plan
      ? { revision: plan.revision, document: plan.document }
      : { revision: 0, document: null };
  }
  async savePlan(accountId: string, childId: string, body: unknown) {
    await this.ownedChild(accountId, childId);
    await this.learningAccess(accountId);
    const parsed = practiceSaveSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    const { expectedRevision, document } = parsed.data;
    const catalog = practiceCatalog();
    if (
      document.curriculumVersion !== catalog.version ||
      (document.lessonIds &&
        (document.lessonIds.some(
          (id) =>
            !catalog.lessons.some((lesson) => lesson.id === id) ||
            document.deferredLessonIds.includes(id)
        ) ||
          (document.selectedLessonId !== null &&
            document.lessonIds[0] !== document.selectedLessonId))) ||
      document.goalIds.some((id) => !catalog.goals.some((goal) => goal.id === id)) ||
      document.deferredLessonIds.some(
        (id) => !catalog.lessons.some((lesson) => lesson.id === id)
      ) ||
      (document.selectedLessonId !== null &&
        !catalog.lessons.some(
          (lesson) =>
            lesson.id === document.selectedLessonId &&
            document.goalIds.includes(lesson.goalId) &&
            !document.deferredLessonIds.includes(lesson.id)
        ))
    )
      throw new BadRequestException();
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (expectedRevision === 0) {
          const created = await tx.practicePlan.create({ data: { childId, document } });
          return { revision: created.revision, document: created.document };
        }
        const changed = await tx.practicePlan.updateMany({
          where: { childId, revision: expectedRevision },
          data: { document, revision: { increment: 1 } }
        });
        if (changed.count !== 1) throw new ConflictException();
        const saved = await tx.practicePlan.findUniqueOrThrow({ where: { childId } });
        return { revision: saved.revision, document: saved.document };
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002")
        throw new ConflictException();
      throw error;
    }
  }
  async prepare(accountId: string, childId: string, lessonId: string, body: unknown = {}) {
    await this.ownedChild(accountId, childId);
    await this.learningAccess(accountId);
    const catalog = practiceCatalog();
    const lesson = catalog.lessons.find((lesson) => lesson.id === lessonId);
    if (!lesson) throw new NotFoundException();
    const parsed = practicePrepareSchema.safeParse(body ?? {});
    if (!parsed.success) throw new BadRequestException();
    const lessonIds = parsed.data.lessonIds ?? [lessonId];
    if (
      lessonIds[0] !== lessonId ||
      lessonIds.some((id) => !catalog.lessons.some((item) => item.id === id))
    )
      throw new BadRequestException();
    return {
      lessonId: lesson.id,
      lessonVersion: lesson.version,
      source: catalog.source,
      curriculumVersion: catalog.version,
      lessonIds
    };
  }
  async checkpoints(accountId: string, childId: string) {
    await this.ownedChild(accountId, childId);
    const checkpoints = await this.prisma.practiceCheckpoint.findMany({
      where: { childId },
      orderBy: { updatedAt: "desc" },
      take: 30
    });
    const collection = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT id FROM (
        SELECT entry.value AS id FROM practice_checkpoints c
        CROSS JOIN LATERAL jsonb_each_text(COALESCE(c.document->'gameStickers', '{}'::jsonb)) entry
        WHERE c.child_id=${childId}::uuid
        UNION ALL
        SELECT entry.value->>'itemId' AS id FROM practice_checkpoints c
        CROSS JOIN LATERAL jsonb_each(COALESCE(c.document->'rewardReceipts', '{}'::jsonb)) entry
        WHERE c.child_id=${childId}::uuid
      ) rewards WHERE id IS NOT NULL`;
    return {
      checkpoints: checkpoints.map(({ sessionId, document }) => ({ sessionId, document })),
      stickers: collection.map(({ id }) => id)
    };
  }
  async saveCheckpoint(accountId: string, childId: string, sessionId: string, body: unknown) {
    // Family-authored checkpoint remains synchronizable after subscription expiry.
    await this.ownedChild(accountId, childId);
    const parsed = checkpointSchema.safeParse(body);
    if (!parsed.success || !sessionIdSchema.safeParse(sessionId).success)
      throw new BadRequestException();
    const document = parsed.data;
    if (
      process.env.C50_DAILY_GAMES_CUTOVER === "1" &&
      document.lessonId === "fixture_play_today_words"
    ) {
      const old = await this.prisma.practiceCheckpoint.findUnique({
        where: { childId_sessionId: { childId, sessionId } }
      });
      if (old && JSON.stringify(checkpointSchema.parse(old.document)) === JSON.stringify(document))
        return { revision: old.revision };
      throw new ConflictException("Legacy word game is read-only; use daily games");
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const where = { childId_sessionId: { childId, sessionId } };
        const current = await tx.practiceCheckpoint.findUnique({ where });
        if (process.env.C50_DAILY_GAMES_CUTOVER === "1") {
          const old = current ? checkpointSchema.parse(current.document) : undefined;
          const addedReceipt = Object.entries(document.rewardReceipts ?? {}).some(
            ([key, receipt]) =>
              JSON.stringify(old?.rewardReceipts?.[key]) !== JSON.stringify(receipt)
          );
          const addedSticker = Object.entries(document.gameStickers ?? {}).some(
            ([key, sticker]) => old?.gameStickers?.[key] !== sticker
          );
          if (addedReceipt || addedSticker || (document.pendingReward && !old?.pendingReward))
            throw new ConflictException("Legacy awards are read-only; use daily games");
        }
        if (!current)
          await tx.practiceCheckpoint.create({
            data: { childId, sessionId, revision: document.revision, document }
          });
        else {
          const previous = checkpointSchema.parse(current.document);
          if (
            document.revision === current.revision &&
            JSON.stringify(document) === JSON.stringify(previous)
          )
            return { revision: current.revision };
          if (
            document.revision <= current.revision ||
            document.lessonId !== previous.lessonId ||
            document.lessonVersion !== previous.lessonVersion ||
            document.index < previous.index ||
            Object.entries(previous.rewardReceipts ?? {}).some(
              ([key, receipt]) =>
                document.rewardReceipts?.[key]?.kind !== receipt.kind ||
                document.rewardReceipts?.[key]?.itemId !== receipt.itemId
            ) ||
            (previous.pendingReward &&
              document.pendingReward?.key === previous.pendingReward.key &&
              (previous.pendingReward.stickerCandidate !==
                document.pendingReward.stickerCandidate ||
                previous.pendingReward.pieceCandidate !== document.pendingReward.pieceCandidate)) ||
            Object.entries(previous.gameProgress ?? {}).some(([id, progress]) => {
              const next = document.gameProgress?.[id];
              return (
                !next ||
                ["memoryMatched", "found", "placed"].some((key) => {
                  const field = key as "memoryMatched" | "found" | "placed";
                  return progress[field].some((piece) => !next[field].includes(piece));
                })
              );
            }) ||
            Object.entries(previous.gameStickers ?? {}).some(
              ([id, sticker]) => document.gameStickers?.[id] !== sticker
            ) ||
            Object.entries(previous.gameRounds ?? {}).some(
              ([id, round]) => (document.gameRounds?.[id] ?? 0) < round
            ) ||
            JSON.stringify(document.course?.lessonIds) !==
              JSON.stringify(previous.course?.lessonIds) ||
            (document.course &&
              previous.course &&
              (document.course.attempts.length < previous.course.attempts.length ||
                document.course.reviewIndex < previous.course.reviewIndex ||
                JSON.stringify(
                  document.course.attempts.slice(0, previous.course.attempts.length)
                ) !== JSON.stringify(previous.course.attempts))) ||
            previous.phase === "finished"
          )
            throw new ConflictException();
          const updated = await tx.practiceCheckpoint.updateMany({
            where: { childId, sessionId, revision: current.revision },
            data: { revision: document.revision, document }
          });
          if (updated.count !== 1) throw new ConflictException();
        }
        return { revision: document.revision };
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002")
        throw new ConflictException();
      throw error;
    }
  }
}
