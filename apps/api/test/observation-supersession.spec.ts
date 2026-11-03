import { ConflictException, NotFoundException } from "@nestjs/common";

import type { PrismaService } from "../src/database/prisma.service";
import { LearningService } from "../src/learning/learning.service";

const accountId = "11111111-1111-4111-8111-111111111111";
const originalId = "22222222-2222-4222-8222-222222222222";
const replacementId = "33333333-3333-4333-8333-333333333333";
const original = {
  id: originalId,
  childId: "44444444-4444-4444-8444-444444444444",
  goalId: "goal-1",
  targetId: "target-1",
  activityType: "recognition",
  contentVersion: 1,
  result: "supported",
  promptLevel: 1,
  context: "in_app",
  sessionId: "session-1",
  occurredAt: new Date(),
  supersededBy: null
};

function setup() {
  const tx = {
    observation: { create: jest.fn().mockResolvedValue({ id: replacementId }) },
    observationSupersession: { create: jest.fn().mockResolvedValue({}) }
  };
  const db = {
    observation: { findFirst: jest.fn().mockResolvedValue(original) },
    observationSupersession: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest
      .fn()
      .mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
  };
  return { db, tx, service: new LearningService(db as unknown as PrismaService) };
}

describe("observation correction", () => {
  const body = { eventId: "correction-1", result: "independent", promptLevel: null };

  it("hides observations outside the account family", async () => {
    const { db, service } = setup();
    db.observation.findFirst.mockResolvedValue(null);
    await expect(service.supersedeObservation(accountId, originalId, body)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(db.observation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          child: {
            deletedAt: null,
            family: { deletedAt: null, members: { some: { accountId } } }
          }
        })
      })
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("appends a replacement and relation in one transaction", async () => {
    const { tx, service } = setup();
    await expect(service.supersedeObservation(accountId, originalId, body)).resolves.toEqual({
      status: "accepted",
      observationId: replacementId,
      supersedesId: originalId
    });
    expect(tx.observation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "correction-1",
          childId: original.childId,
          result: "independent",
          promptLevel: null
        })
      })
    );
    expect(tx.observationSupersession.create).toHaveBeenCalledWith({
      data: {
        accountId,
        originalObservationId: originalId,
        replacementObservationId: replacementId
      }
    });
  });

  it("returns duplicate only for the same correction", async () => {
    const { db, service } = setup();
    db.observation.findFirst.mockResolvedValue({
      ...original,
      supersededBy: {
        replacement: {
          id: replacementId,
          eventId: body.eventId,
          result: body.result,
          promptLevel: body.promptLevel
        }
      }
    });
    await expect(service.supersedeObservation(accountId, originalId, body)).resolves.toMatchObject({
      status: "duplicate"
    });
    await expect(
      service.supersedeObservation(accountId, originalId, { ...body, result: "not_yet" })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("returns duplicate after a concurrent identical correction wins", async () => {
    const { db, tx, service } = setup();
    tx.observationSupersession.create.mockRejectedValue({ code: "P2002" });
    db.observationSupersession.findUnique.mockResolvedValue({
      replacement: {
        id: replacementId,
        eventId: body.eventId,
        result: body.result,
        promptLevel: body.promptLevel
      }
    });
    await expect(service.supersedeObservation(accountId, originalId, body)).resolves.toMatchObject({
      status: "duplicate",
      observationId: replacementId
    });
  });
});
