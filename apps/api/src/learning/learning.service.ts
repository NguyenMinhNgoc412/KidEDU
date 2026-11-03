import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { z } from "zod";

import { PrismaService } from "../database/prisma.service";

const id = z.string().trim().min(1).max(100);
const planSchema = z.strictObject({
  expectedRevision: z.number().int().min(0),
  document: z.strictObject({
    schemaVersion: z.literal(1),
    contentReleaseId: id,
    goalIds: z.array(id).max(30),
    items: z
      .array(z.strictObject({ lessonId: id, lessonVersion: z.number().int().positive() }))
      .max(100)
  })
});
const eventSchema = z.strictObject({
  schemaVersion: z.literal(1),
  eventId: id,
  eventType: z.literal("observation.recorded"),
  childId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  payload: z.strictObject({
    goalId: id,
    targetId: id,
    activityType: z.enum([
      "word_model",
      "recognition",
      "naming",
      "cloze_tail",
      "functional_sentence",
      "yes_no",
      "visual_qa",
      "command",
      "functional_communication",
      "parent_transfer"
    ]),
    contentVersion: z.number().int().positive(),
    result: z.enum(["independent", "supported", "not_yet", "not_observed"]),
    promptLevel: z.number().int().min(0).nullable(),
    context: z.enum(["in_app", "parent_guided"]),
    sessionId: id
  })
});
const correctionSchema = z.strictObject({
  eventId: id,
  result: z.enum(["independent", "supported", "not_yet", "not_observed"]),
  promptLevel: z.number().int().min(0).nullable()
});

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertChild(accountId: string, childId: string) {
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

  async getPlan(accountId: string, childId: string) {
    await this.assertChild(accountId, childId);
    const plan = await this.prisma.learningPlan.findUnique({ where: { childId } });
    return plan
      ? { revision: plan.revision, document: plan.document, updatedAt: plan.updatedAt }
      : { revision: 0, document: null };
  }

  async savePlan(accountId: string, childId: string, body: unknown) {
    const parsed = planSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    await this.assertChild(accountId, childId);
    const { expectedRevision, document } = parsed.data;
    if (expectedRevision === 0) {
      const existing = await this.prisma.learningPlan.findUnique({
        where: { childId },
        select: { revision: true }
      });
      if (existing) throw new ConflictException("Plan revision changed");
      try {
        const created = await this.prisma.learningPlan.create({ data: { childId, document } });
        return {
          revision: created.revision,
          document: created.document,
          updatedAt: created.updatedAt
        };
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        )
          throw new ConflictException("Plan revision changed");
        throw error;
      }
    }
    const result = await this.prisma.learningPlan.updateMany({
      where: { childId, revision: expectedRevision },
      data: { document, revision: { increment: 1 } }
    });
    if (result.count !== 1) throw new ConflictException("Plan revision changed");
    const plan = await this.prisma.learningPlan.findUniqueOrThrow({ where: { childId } });
    return { revision: plan.revision, document: plan.document, updatedAt: plan.updatedAt };
  }

  async ingest(accountId: string, childId: string, body: unknown) {
    const batch = z.strictObject({ events: z.array(z.unknown()).min(1).max(100) }).safeParse(body);
    if (!batch.success) throw new BadRequestException();
    await this.assertChild(accountId, childId);
    const results = [];
    for (const raw of batch.data.events) {
      const parsed = eventSchema.safeParse(raw);
      if (!parsed.success || parsed.data.childId !== childId) {
        results.push({
          eventId:
            typeof raw === "object" &&
            raw !== null &&
            "eventId" in raw &&
            typeof raw.eventId === "string"
              ? raw.eventId
              : null,
          status: "rejected",
          code: "VALIDATION_ERROR"
        });
        continue;
      }
      const event = parsed.data;
      const existing = await this.prisma.observation.findUnique({
        where: { eventId: event.eventId }
      });
      if (existing) {
        const same =
          existing.childId === childId &&
          existing.goalId === event.payload.goalId &&
          existing.targetId === event.payload.targetId &&
          existing.activityType === event.payload.activityType &&
          existing.contentVersion === event.payload.contentVersion &&
          existing.result === event.payload.result &&
          existing.promptLevel === event.payload.promptLevel &&
          existing.context === event.payload.context &&
          existing.sessionId === event.payload.sessionId &&
          existing.occurredAt.getTime() === new Date(event.occurredAt).getTime();
        results.push({
          eventId: event.eventId,
          status: same ? "duplicate" : "rejected",
          code: same ? undefined : "EVENT_ID_CONFLICT"
        });
        continue;
      }
      try {
        await this.prisma.observation.create({
          data: {
            eventId: event.eventId,
            childId,
            goalId: event.payload.goalId,
            targetId: event.payload.targetId,
            activityType: event.payload.activityType,
            contentVersion: event.payload.contentVersion,
            result: event.payload.result,
            promptLevel: event.payload.promptLevel,
            context: event.payload.context,
            sessionId: event.payload.sessionId,
            occurredAt: new Date(event.occurredAt)
          }
        });
        results.push({ eventId: event.eventId, status: "accepted" });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        ) {
          results.push({ eventId: event.eventId, status: "rejected", code: "EVENT_ID_CONFLICT" });
        } else throw error;
      }
    }
    return { results };
  }

  async observations(accountId: string, childId: string, cursor?: string) {
    await this.assertChild(accountId, childId);
    if (cursor && !z.uuid().safeParse(cursor).success) throw new BadRequestException();
    const anchor = cursor
      ? await this.prisma.observation.findFirst({
          where: { id: cursor, childId },
          select: { receivedAt: true, id: true }
        })
      : null;
    if (cursor && !anchor) throw new BadRequestException();
    const rows = await this.prisma.observation.findMany({
      where: {
        childId,
        ...(anchor
          ? {
              OR: [
                { receivedAt: { gt: anchor.receivedAt } },
                { receivedAt: anchor.receivedAt, id: { gt: anchor.id } }
              ]
            }
          : {})
      },
      orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
      take: 101,
      include: {
        supersededBy: { select: { replacementObservationId: true } },
        supersedes: { select: { originalObservationId: true } }
      }
    });
    const page = rows.slice(0, 100);
    return {
      observations: page.map(
        ({
          id,
          eventId,
          goalId,
          targetId,
          activityType,
          contentVersion,
          result,
          promptLevel,
          context,
          sessionId,
          occurredAt,
          receivedAt,
          supersededBy,
          supersedes
        }) => ({
          id,
          eventId,
          goalId,
          targetId,
          activityType,
          contentVersion,
          result,
          promptLevel,
          context,
          sessionId,
          occurredAt,
          receivedAt,
          supersededById: supersededBy?.replacementObservationId ?? null,
          supersedesId: supersedes?.originalObservationId ?? null
        })
      ),
      nextCursor: rows.length > 100 ? page.at(-1)?.id : null
    };
  }

  async supersedeObservation(accountId: string, observationId: string, body: unknown) {
    const parsed = correctionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    if (!z.uuid().safeParse(observationId).success) throw new NotFoundException();
    const original = await this.prisma.observation.findFirst({
      where: {
        id: observationId,
        child: {
          deletedAt: null,
          family: { deletedAt: null, members: { some: { accountId } } }
        }
      },
      include: {
        supersededBy: {
          include: {
            replacement: { select: { id: true, eventId: true, result: true, promptLevel: true } }
          }
        }
      }
    });
    if (!original) throw new NotFoundException();
    const { eventId, result, promptLevel } = parsed.data;
    if (original.supersededBy) {
      const replacement = original.supersededBy.replacement;
      if (
        replacement.eventId === eventId &&
        replacement.result === result &&
        replacement.promptLevel === promptLevel
      ) {
        return { status: "duplicate", observationId: replacement.id, supersedesId: original.id };
      }
      throw new ConflictException();
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const replacement = await tx.observation.create({
          data: {
            eventId,
            childId: original.childId,
            goalId: original.goalId,
            targetId: original.targetId,
            activityType: original.activityType,
            contentVersion: original.contentVersion,
            result,
            promptLevel,
            context: original.context,
            sessionId: original.sessionId,
            occurredAt: original.occurredAt
          },
          select: { id: true }
        });
        await tx.observationSupersession.create({
          data: {
            accountId,
            originalObservationId: original.id,
            replacementObservationId: replacement.id
          }
        });
        return { status: "accepted", observationId: replacement.id, supersedesId: original.id };
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const raced = await this.prisma.observationSupersession.findUnique({
          where: { originalObservationId: original.id },
          include: {
            replacement: { select: { id: true, eventId: true, result: true, promptLevel: true } }
          }
        });
        if (
          raced?.replacement.eventId === eventId &&
          raced.replacement.result === result &&
          raced.replacement.promptLevel === promptLevel
        ) {
          return {
            status: "duplicate",
            observationId: raced.replacement.id,
            supersedesId: original.id
          };
        }
        throw new ConflictException();
      }
      throw error;
    }
  }
}
