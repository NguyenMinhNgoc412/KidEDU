import { ConflictException, NotFoundException } from "@nestjs/common";

import { LearningService } from "../src/learning/learning.service";
import type { PrismaService } from "../src/database/prisma.service";

const childId = "11111111-1111-4111-8111-111111111111";
const accountId = "22222222-2222-4222-8222-222222222222";

function setup() {
  const db = {
    childProfile: { findFirst: jest.fn().mockResolvedValue({ id: childId }) },
    learningPlan: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ revision: 1, document: {}, updatedAt: new Date() }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ revision: 2, document: {}, updatedAt: new Date() })
    },
    observation: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([])
    }
  };
  return { db, service: new LearningService(db as unknown as PrismaService) };
}

const event = {
  schemaVersion: 1,
  eventId: "event-1",
  eventType: "observation.recorded",
  childId,
  occurredAt: "2026-10-01T10:00:00Z",
  payload: {
    goalId: "goal-1",
    targetId: "target-1",
    activityType: "recognition",
    contentVersion: 1,
    result: "supported",
    promptLevel: 1,
    context: "in_app",
    sessionId: "session-1"
  }
};

describe("learning API policy", () => {
  it("blocks a child outside the account family before reading plan", async () => {
    const { db, service } = setup();
    db.childProfile.findFirst.mockResolvedValue(null);
    await expect(service.getPlan(accountId, childId)).rejects.toBeInstanceOf(NotFoundException);
    expect(db.learningPlan.findUnique).not.toHaveBeenCalled();
  });

  it("rejects stale plan revision without overwriting", async () => {
    const { db, service } = setup();
    db.learningPlan.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.savePlan(accountId, childId, {
        expectedRevision: 1,
        document: { schemaVersion: 1, contentReleaseId: "release-1", goalIds: [], items: [] }
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("accepts first observation and returns duplicate on identical retry", async () => {
    const { db, service } = setup();
    expect(await service.ingest(accountId, childId, { events: [event] })).toEqual({
      results: [{ eventId: "event-1", status: "accepted" }]
    });
    db.observation.findUnique.mockResolvedValue({
      childId,
      eventId: "event-1",
      goalId: "goal-1",
      targetId: "target-1",
      activityType: "recognition",
      contentVersion: 1,
      result: "supported",
      promptLevel: 1,
      context: "in_app",
      sessionId: "session-1",
      occurredAt: new Date(event.occurredAt)
    });
    expect(await service.ingest(accountId, childId, { events: [event] })).toEqual({
      results: [{ eventId: "event-1", status: "duplicate" }]
    });
    expect(db.observation.create).toHaveBeenCalledTimes(1);
  });

  it("rejects a reused event ID with changed payload", async () => {
    const { db, service } = setup();
    db.observation.findUnique.mockResolvedValue({
      childId: "33333333-3333-4333-8333-333333333333"
    });
    expect(await service.ingest(accountId, childId, { events: [event] })).toEqual({
      results: [{ eventId: "event-1", status: "rejected", code: "EVENT_ID_CONFLICT" }]
    });
  });
});
