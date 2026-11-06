import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException
} from "@nestjs/common";
import { PracticeService } from "../src/practice/practice.service";
import { practiceCatalog } from "../src/practice/practice.catalog";
import { checkpointSchema } from "../src/practice/practice.schemas";
import type { PrismaService } from "../src/database/prisma.service";
import type { SubscriptionService } from "../src/entitlement/subscription.service";

const child = "11111111-1111-4111-8111-111111111111";
const document = {
  schemaVersion: 1,
  curriculumVersion: "practice_fixture_v1",
  goalIds: ["command"],
  selectedLessonId: "fixture_lesson_put_ball",
  deferredLessonIds: []
};
const checkpoint = {
  schemaVersion: 1,
  lessonId: "fixture_lesson_put_ball",
  lessonVersion: 1,
  revision: 4,
  index: 0,
  phase: "paused",
  resumePhase: "waiting",
  promptLevel: 0,
  repeats: 0,
  waitRemainingMs: 1000,
  deferred: false
};
function setup() {
  const db = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    childProfile: { findFirst: jest.fn().mockResolvedValue({ id: child }) },
    practicePlan: {
      create: jest.fn().mockResolvedValue({ revision: 1, document }),
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ revision: 2, document })
    },
    practiceCheckpoint: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    $transaction: jest.fn()
  };
  db.$transaction.mockImplementation((callback: (tx: typeof db) => unknown) => callback(db));
  const access = { current: jest.fn().mockResolvedValue({ learningAllowed: true }) };
  return {
    db,
    access,
    service: new PracticeService(
      db as unknown as PrismaService,
      access as unknown as SubscriptionService
    )
  };
}
const previousEnv = process.env.APP_ENV;
const previousCutover = process.env.C50_DAILY_GAMES_CUTOVER;
test("partial game progress is bounded and completed pieces cannot be erased during sync", async () => {
  const { service, db } = setup();
  const id = "fixture_play_today_words_practice";
  const progress = {
    schemaVersion: 1,
    memoryOpen: [],
    memoryMatched: ["ball"],
    found: [],
    placed: []
  };
  const previous = { ...checkpoint, gameProgress: { [id]: progress } };
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: 4, document: previous } as never);
  await expect(
    service.saveCheckpoint("account", child, "partial_game", { ...checkpoint, revision: 5 })
  ).rejects.toBeInstanceOf(ConflictException);
  await expect(
    service.saveCheckpoint("account", child, "partial_game", {
      ...previous,
      revision: 5,
      gameProgress: { [id]: { ...progress, memoryMatched: [] } }
    })
  ).rejects.toBeInstanceOf(ConflictException);
  await expect(
    service.saveCheckpoint("account", child, "partial_game", {
      ...previous,
      revision: 5,
      gameProgress: { [id]: { ...progress, memoryOpen: ["bear_a"] } }
    })
  ).resolves.toEqual({ revision: 5 });
  expect(
    checkpointSchema.safeParse({
      ...previous,
      gameProgress: { [id]: { ...progress, placed: ["ball", "ball"] } }
    }).success
  ).toBe(false);
});
test("game rounds accept bounded progress and reject loss of already earned stickers", async () => {
  const { service, db } = setup();
  const previous = { ...checkpoint, gameRounds: { fixture_play_today_words_practice: 2 } };
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: 4, document: previous } as never);
  await expect(
    service.saveCheckpoint("account", child, "game_session", {
      ...previous,
      revision: 5,
      gameRounds: { fixture_play_today_words_practice: 1 }
    })
  ).rejects.toBeInstanceOf(ConflictException);
  await expect(
    service.saveCheckpoint("account", child, "game_session", {
      ...previous,
      revision: 5,
      gameRounds: { fixture_play_today_words_practice: 3 }
    })
  ).resolves.toEqual({ revision: 5 });
  expect(
    checkpointSchema.safeParse({
      ...previous,
      gameRounds: { fixture_play_today_words_practice: 4 }
    }).success
  ).toBe(false);
});
test("sticker choices require completed games, are immutable, and collection is family data", async () => {
  const { service, db, access } = setup();
  const id = "fixture_play_today_words_practice";
  const reward = { ...checkpoint, gameRounds: { [id]: 3 }, gameStickers: { [id]: "item-bong" } };
  expect(checkpointSchema.safeParse({ ...reward, gameRounds: { [id]: 2 } }).success).toBe(false);
  expect(checkpointSchema.safeParse({ ...reward, gameStickers: { [id]: "unknown" } }).success).toBe(
    false
  );
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: 4, document: reward } as never);
  await expect(
    service.saveCheckpoint("account", child, "gift_test", {
      ...reward,
      revision: 5,
      gameStickers: { [id]: "item-gau" }
    })
  ).rejects.toBeInstanceOf(ConflictException);
  access.current.mockResolvedValue({ learningAllowed: false });
  db.$queryRaw.mockResolvedValue([{ id: "item-bong" }]);
  expect((await service.checkpoints("account", child)).stickers).toEqual(["item-bong"]);
});
beforeEach(() => {
  process.env.APP_ENV = "local";
  delete process.env.C50_DAILY_GAMES_CUTOVER;
});
afterAll(() => {
  if (previousEnv === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = previousEnv;
  if (previousCutover === undefined) delete process.env.C50_DAILY_GAMES_CUTOVER;
  else process.env.C50_DAILY_GAMES_CUTOVER = previousCutover;
});

test("C50 cutover removes only the retired word-game course from new learning preparation", async () => {
  process.env.C50_DAILY_GAMES_CUTOVER = "1";
  const { service } = setup();
  const catalog = practiceCatalog();
  expect(catalog.lessons.some((lesson) => lesson.id === "fixture_play_today_words")).toBe(false);
  expect(catalog.lessons.some((lesson) => lesson.id === "fixture_play_pairs")).toBe(true);
  expect(catalog.lessons.some((lesson) => lesson.id === "fixture_lesson_request")).toBe(true);
  await expect(
    service.prepare("account", child, "fixture_play_today_words")
  ).rejects.toBeInstanceOf(NotFoundException);
});

test("C50 keeps legacy word-game checkpoints readable and exact ACK retryable, but rejects new awards/writes", async () => {
  process.env.C50_DAILY_GAMES_CUTOVER = "1";
  const { service, db } = setup();
  const old = { ...checkpoint, lessonId: "fixture_play_today_words" };
  await expect(service.saveCheckpoint("account", child, "legacy_game", old)).rejects.toBeInstanceOf(
    ConflictException
  );
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: old.revision, document: old });
  await expect(service.saveCheckpoint("account", child, "legacy_game", old)).resolves.toEqual({
    revision: old.revision
  });
  await expect(
    service.saveCheckpoint("account", child, "legacy_game", { ...old, revision: old.revision + 1 })
  ).rejects.toBeInstanceOf(ConflictException);
  expect(db.practiceCheckpoint.create).not.toHaveBeenCalled();
  expect(db.practiceCheckpoint.updateMany).not.toHaveBeenCalled();
});

test("C50 cannot mint a legacy receipt by disguising a game as a normal learning lesson", async () => {
  process.env.C50_DAILY_GAMES_CUTOVER = "1";
  const { service, db } = setup();
  const forged = {
    ...checkpoint,
    rewardReceipts: {
      "fixture_play_today_words_practice:round_1": { kind: "sticker", itemId: "sticker_animals_1" }
    }
  };
  expect(checkpointSchema.safeParse(forged).success).toBe(true);
  await expect(
    service.saveCheckpoint("account", child, "disguised_game", forged)
  ).rejects.toBeInstanceOf(ConflictException);
  expect(db.practiceCheckpoint.create).not.toHaveBeenCalled();
  db.practiceCheckpoint.findUnique.mockResolvedValue({
    revision: checkpoint.revision,
    document: checkpoint
  });
  await expect(
    service.saveCheckpoint("account", child, "existing_lesson", {
      ...forged,
      revision: checkpoint.revision + 1
    })
  ).rejects.toBeInstanceOf(ConflictException);
  expect(db.practiceCheckpoint.updateMany).not.toHaveBeenCalled();
});

test("catalog is unavailable outside explicit local environment even with active access", () => {
  for (const environment of [undefined, "staging", "production"]) {
    if (environment) process.env.APP_ENV = environment;
    else delete process.env.APP_ENV;
    expect(practiceCatalog().lessons).toEqual([]);
  }
});
test("ownership is checked before every plan/catalog/checkpoint operation", async () => {
  const { service, db, access } = setup();
  db.childProfile.findFirst.mockResolvedValue(null);
  for (const operation of [
    () => service.plan("account", child),
    () => service.catalog("account", child),
    () => service.savePlan("account", child, { expectedRevision: 0, document }),
    () => service.prepare("account", child, "fixture_lesson_put_ball"),
    () => service.checkpoints("account", child),
    () => service.saveCheckpoint("account", child, "session_a", checkpoint)
  ]) {
    await expect(operation()).rejects.toBeInstanceOf(NotFoundException);
  }
  expect(db.practicePlan.findUnique).not.toHaveBeenCalled();
  expect(db.practiceCheckpoint.findMany).not.toHaveBeenCalled();
  expect(access.current).not.toHaveBeenCalled();
});
test("expired accounts keep family plan/checkpoints, cannot prepare or change learning plan", async () => {
  const { service, access } = setup();
  access.current.mockResolvedValue({ learningAllowed: false });
  expect(await service.plan("account", child)).toEqual({ revision: 0, document: null });
  expect((await service.catalog("account", child)).lessons).toEqual([]);
  await expect(service.prepare("account", child, "fixture_lesson_put_ball")).rejects.toBeInstanceOf(
    ForbiddenException
  );
  await expect(
    service.savePlan("account", child, { expectedRevision: 0, document })
  ).rejects.toBeInstanceOf(ForbiddenException);
  expect(await service.saveCheckpoint("account", child, "session_a", checkpoint)).toEqual({
    revision: 4
  });
});
test("plan rejects unknown/duplicate goals, invalid selection, stale curriculum and revisions", async () => {
  const { service, db } = setup();
  for (const changes of [
    { goalIds: ["invalid"] },
    { goalIds: ["command", "command"] },
    { selectedLessonId: "fixture_lesson_ball" },
    { curriculumVersion: "old" },
    { deferredLessonIds: ["fixture_lesson_put_ball"] },
    { lessonIds: ["unknown"] },
    { lessonIds: ["fixture_lesson_put_ball", "fixture_lesson_put_ball"] },
    { lessonIds: [] },
    { lessonIds: ["fixture_lesson_naming", "fixture_lesson_put_ball"] }
  ]) {
    await expect(
      service.savePlan("account", child, {
        expectedRevision: 0,
        document: { ...document, ...changes }
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  }
  db.practicePlan.updateMany.mockResolvedValue({ count: 0 });
  await expect(
    service.savePlan("account", child, { expectedRevision: 1, document })
  ).rejects.toBeInstanceOf(ConflictException);
});
test("plan accepts explicit ordered lessons and an empty selection without changing family history", async () => {
  const { service, db } = setup();
  const ordered = {
    ...document,
    goalIds: ["command", "naming"],
    lessonIds: ["fixture_lesson_put_ball", "fixture_lesson_naming"]
  };
  await service.savePlan("account", child, { expectedRevision: 0, document: ordered });
  expect(db.practicePlan.create).toHaveBeenCalledWith({
    data: { childId: child, document: ordered }
  });
  await service.savePlan("account", child, {
    expectedRevision: 0,
    document: { ...ordered, lessonIds: [], selectedLessonId: null }
  });
  expect(db.practiceCheckpoint.create).not.toHaveBeenCalled();
});
test("checkpoint identical retry succeeds; regression/lesson switch/terminal rewind conflicts", async () => {
  const { service, db } = setup();
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: 4, document: checkpoint });
  expect(await service.saveCheckpoint("account", child, "session_a", checkpoint)).toEqual({
    revision: 4
  });
  expect(db.practiceCheckpoint.updateMany).not.toHaveBeenCalled();
  for (const changes of [
    { revision: 3 },
    { revision: 4, waitRemainingMs: 0 },
    { revision: 5, lessonId: "other_lesson" }
  ]) {
    await expect(
      service.saveCheckpoint("account", child, "session_a", { ...checkpoint, ...changes })
    ).rejects.toBeInstanceOf(ConflictException);
  }
  db.practiceCheckpoint.findUnique.mockResolvedValue({
    revision: 4,
    document: { ...checkpoint, phase: "finished", resumePhase: null }
  });
  await expect(
    service.saveCheckpoint("account", child, "session_a", { ...checkpoint, revision: 5 })
  ).rejects.toBeInstanceOf(ConflictException);
});
test("checkpoint rejects PII/media payloads, negative timers and invalid pause state", () => {
  for (const changes of [
    { media: "file://private" },
    { revision: 2147483648 },
    { waitRemainingMs: -1 },
    { phase: "waiting" }
  ])
    expect(checkpointSchema.safeParse({ ...checkpoint, ...changes }).success).toBe(false);
});
test("course preparation authorizes every lesson and rejects duplicates/unknown entries", async () => {
  const { service } = setup();
  const lessonIds = ["fixture_lesson_put_ball", "fixture_lesson_naming"];
  expect((await service.prepare("account", child, lessonIds[0]!, { lessonIds })).lessonIds).toEqual(
    lessonIds
  );
  for (const ids of [[...lessonIds, "unknown"], [lessonIds[0], lessonIds[0]], [lessonIds[1]]])
    await expect(
      service.prepare("account", child, lessonIds[0]!, { lessonIds: ids })
    ).rejects.toBeInstanceOf(BadRequestException);
});
test("course review checkpoints require all learning attempts and cannot rewind or rewrite evidence", async () => {
  const { service, db } = setup();
  const course = {
    lessonIds: ["fixture_lesson_put_ball", "fixture_lesson_naming"],
    reviewIndex: 0,
    attempts: [0, 1].map((index) => ({
      index,
      promptLevel: 0,
      repeats: 0,
      deferred: false,
      occurredAt: "2026-11-03T00:00:00Z"
    }))
  };
  const state = { ...checkpoint, index: 1, phase: "observation", resumePhase: null, course };
  expect(checkpointSchema.safeParse(state).success).toBe(true);
  expect(
    checkpointSchema.safeParse({
      ...state,
      course: { ...course, attempts: course.attempts.slice(0, 1) }
    }).success
  ).toBe(false);
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: 4, document: state });
  const next = { ...state, revision: 5, course: { ...course, reviewIndex: 1 } };
  await expect(service.saveCheckpoint("account", child, "course_a", next)).resolves.toEqual({
    revision: 5
  });
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: 5, document: next });
  await expect(
    service.saveCheckpoint("account", child, "course_a", { ...state, revision: 6 })
  ).rejects.toBeInstanceOf(ConflictException);
  await expect(
    service.saveCheckpoint("account", child, "course_a", {
      ...next,
      revision: 6,
      course: {
        ...next.course,
        attempts: next.course.attempts.map((item) => ({ ...item, repeats: 1 }))
      }
    })
  ).rejects.toBeInstanceOf(ConflictException);
});

test("new reward receipts cannot be erased or changed and pending candidates cannot reroll", async () => {
  const { service, db } = setup();
  const activityId = "fixture_play_today_words_practice",
    key = `${activityId}:round_1`;
  const pendingReward = {
    key,
    activityId,
    slot: "round_1",
    selectedKind: "sticker",
    stickerCandidate: "sticker_animals_1",
    pieceCandidate: "piece_garden_0"
  };
  const receipt = { kind: "sticker", itemId: "sticker_animals_1" };
  const previous = { ...checkpoint, pendingReward, rewardReceipts: { [key]: receipt } };
  expect(checkpointSchema.safeParse(previous).success).toBe(true);
  expect(
    checkpointSchema.safeParse({
      ...previous,
      rewardReceipts: { [key]: { kind: "puzzle_piece", itemId: "sticker_animals_1" } }
    }).success
  ).toBe(false);
  db.practiceCheckpoint.findUnique.mockResolvedValue({ revision: 4, document: previous } as never);
  await expect(
    service.saveCheckpoint("account", child, "reward_test", {
      ...previous,
      revision: 5,
      rewardReceipts: {}
    })
  ).rejects.toBeInstanceOf(ConflictException);
  await expect(
    service.saveCheckpoint("account", child, "reward_test", {
      ...previous,
      revision: 5,
      pendingReward: undefined,
      rewardReceipts: { [key]: { kind: "sticker", itemId: "sticker_animals_2" } }
    })
  ).rejects.toBeInstanceOf(ConflictException);
  await expect(
    service.saveCheckpoint("account", child, "reward_test", {
      ...previous,
      revision: 5,
      pendingReward: { ...pendingReward, pieceCandidate: "piece_space_0" }
    })
  ).rejects.toBeInstanceOf(ConflictException);
  await expect(
    service.saveCheckpoint("account", child, "reward_test", {
      ...previous,
      revision: 5,
      pendingReward: undefined,
      gameRounds: { [activityId]: 1 }
    })
  ).resolves.toEqual({ revision: 5 });
});
