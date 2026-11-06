import { PrismaClient } from "../generated/prisma";
import { createApp } from "../src/main";
import { IdentityService } from "../src/identity/identity.service";
import { createLocalApiClient } from "../../../src/api/localClient";

const url = process.env.DATABASE_POOL_URL;
if (!url || !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):\d+\//.test(url))
  throw new Error("Local PostgreSQL required");
describe("practice frontend client with real PostgreSQL and Nest", () => {
  const db = new PrismaClient({ datasources: { db: { url } } });
  let app: Awaited<ReturnType<typeof createApp>>;
  let account: string, outsider: string, family: string, child: string;
  let ownerApi: ReturnType<typeof createLocalApiClient>, outsiderApi: typeof ownerApi;
  const previousEnv = process.env.APP_ENV;
  beforeAll(async () => {
    process.env.APP_ENV = "local";
    account = (await db.account.create({ data: {} })).id;
    outsider = (await db.account.create({ data: {} })).id;
    family = (
      await db.family.create({
        data: { members: { create: { accountId: account, role: "owner" } } }
      })
    ).id;
    child = (
      await db.childProfile.create({ data: { familyId: family, displayName: "Hồ sơ kiểm thử" } })
    ).id;
    await db.entitlement.create({
      data: {
        accountId: account,
        state: "active",
        source: "local-test",
        effectiveUntil: new Date(Date.now() + 3600000),
        capabilities: ["learning.plan.full"]
      }
    });
    app = await createApp();
    jest
      .spyOn(app.get(IdentityService), "resolveAccount")
      .mockImplementation(async (token) => (token === "owner" ? account : outsider));
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string") throw new Error("Bind failed");
    ownerApi = createLocalApiClient(`http://127.0.0.1:${address.port}`, "owner");
    outsiderApi = createLocalApiClient(`http://127.0.0.1:${address.port}`, "outsider");
  });
  afterAll(async () => {
    await app?.close();
    if (child) {
      await db.practiceCheckpoint.deleteMany({ where: { childId: child } });
      await db.practicePlan.deleteMany({ where: { childId: child } });
      await db.learningPlan.deleteMany({ where: { childId: child } });
      await db.childProfile.delete({ where: { id: child } });
    }
    if (family) {
      await db.familyMember.deleteMany({ where: { familyId: family } });
      await db.family.delete({ where: { id: family } });
    }
    if (account) {
      await db.entitlement.deleteMany({ where: { accountId: account } });
      await db.account.delete({ where: { id: account } });
    }
    if (outsider) await db.account.delete({ where: { id: outsider } });
    await db.$disconnect();
    if (previousEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = previousEnv;
  });
  it("saves independent plan, persisted deferral, CAS conflicts, checkpoint idempotency and family isolation", async () => {
    const catalog = await ownerApi.getPracticeCatalog(child);
    expect(catalog.lessons.length).toBeGreaterThan(0);
    expect(await ownerApi.getPracticePlan(child)).toEqual({ revision: 0, document: null });
    await ownerApi.savePlan(child, 0, {
      schemaVersion: 1,
      contentReleaseId: "learning_release",
      goalIds: ["learning_goal"],
      items: []
    });
    const document = {
      schemaVersion: 1 as const,
      curriculumVersion: catalog.version,
      goalIds: ["command"],
      selectedLessonId: "fixture_lesson_put_ball",
      deferredLessonIds: ["fixture_lesson_two_steps"]
    };
    const race = await Promise.allSettled([
      ownerApi.savePracticePlan(child, 0, document),
      ownerApi.savePracticePlan(child, 0, document)
    ]);
    expect(race.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await ownerApi.getPracticePlan(child)).document).toEqual(document);
    const edited = {
      ...document,
      goalIds: ["command", "naming"],
      selectedLessonId: "fixture_lesson_naming",
      deferredLessonIds: [],
      lessonIds: ["fixture_lesson_naming", "fixture_lesson_put_ball"]
    };
    await ownerApi.savePracticePlan(child, 1, edited);
    expect((await ownerApi.getPracticePlan(child)).document).toEqual(edited);
    expect((await ownerApi.getPlan(child)).document?.contentReleaseId).toBe("learning_release");
    expect(await ownerApi.preparePracticeLesson(child, "fixture_lesson_put_ball")).toMatchObject({
      source: "development_fixture",
      lessonVersion: 1
    });
    await expect(ownerApi.preparePracticeLesson(child, "unknown")).rejects.toMatchObject({
      status: 404
    });
    const checkpoint = {
      schemaVersion: 1 as const,
      lessonId: "fixture_lesson_put_ball",
      lessonVersion: 1,
      revision: 3,
      index: 0,
      phase: "paused" as const,
      resumePhase: "waiting" as const,
      promptLevel: 0,
      repeats: 0,
      waitRemainingMs: 1000,
      deferred: false
    };
    await ownerApi.savePracticeCheckpoint(child, "practice_test", checkpoint);
    await ownerApi.savePracticeCheckpoint(child, "practice_test", checkpoint);
    expect((await ownerApi.getPracticeCheckpoints(child)).checkpoints[0]?.document).toEqual(
      checkpoint
    );
    await expect(
      ownerApi.savePracticeCheckpoint(child, "practice_test", { ...checkpoint, revision: 2 })
    ).rejects.toMatchObject({ status: 409 });
    for (const action of [
      () => outsiderApi.getPracticePlan(child),
      () => outsiderApi.getPracticeCatalog(child),
      () => outsiderApi.getPracticeCheckpoints(child),
      () => outsiderApi.preparePracticeLesson(child, "fixture_lesson_put_ball"),
      () => outsiderApi.savePracticePlan(child, 1, document),
      () => outsiderApi.savePracticeCheckpoint(child, "practice_test", checkpoint)
    ])
      await expect(action()).rejects.toMatchObject({ status: 404 });
    const lessonIds = ["fixture_lesson_put_ball", "fixture_lesson_naming"];
    expect(
      (await ownerApi.preparePracticeLesson(child, lessonIds[0]!, lessonIds)).lessonIds
    ).toEqual(lessonIds);
    await expect(
      ownerApi.preparePracticeLesson(child, lessonIds[0]!, [...lessonIds, "unknown"])
    ).rejects.toMatchObject({ status: 400 });
    const review = {
      ...checkpoint,
      revision: 10,
      index: 1,
      resumePhase: "observation" as const,
      course: {
        lessonIds,
        reviewIndex: 0,
        attempts: [0, 1].map((index) => ({
          index,
          promptLevel: 0,
          repeats: 0,
          deferred: false,
          occurredAt: new Date().toISOString()
        }))
      }
    };
    await ownerApi.savePracticeCheckpoint(child, "practice_course_test", review);
    await ownerApi.savePracticeCheckpoint(child, "practice_course_test", review);
    const nextReview = { ...review, revision: 11, course: { ...review.course, reviewIndex: 1 } };
    await ownerApi.savePracticeCheckpoint(child, "practice_course_test", nextReview);
    await expect(
      ownerApi.savePracticeCheckpoint(child, "practice_course_test", { ...review, revision: 12 })
    ).rejects.toMatchObject({ status: 409 });
    await db.entitlement.update({ where: { accountId: account }, data: { state: "expired" } });
    await ownerApi.savePracticeCheckpoint(child, "practice_course_test", {
      ...nextReview,
      revision: 12
    });
    expect((await ownerApi.getPracticePlan(child)).revision).toBe(2);
    expect((await ownerApi.getPracticeCheckpoints(child)).checkpoints).toHaveLength(2);
    const gameId = "fixture_play_today_words_practice";
    const gift = {
      ...checkpoint,
      lessonId: "fixture_play_today_words",
      gameRounds: { [gameId]: 3 },
      gameStickers: { [gameId]: "item-bong" as const },
      gameProgress: {
        [gameId]: {
          schemaVersion: 1 as const,
          memoryOpen: [],
          memoryMatched: ["ball"],
          found: ["ball"],
          placed: ["ball"]
        }
      }
    };
    await ownerApi.savePracticeCheckpoint(child, "practice_gift_one", gift);
    await ownerApi.savePracticeCheckpoint(child, "practice_gift_two", gift);
    const persisted = (await ownerApi.getPracticeCheckpoints(child)).checkpoints.find(
      (item) => item.sessionId === "practice_gift_one"
    )!;
    expect(persisted.document.gameProgress).toEqual(gift.gameProgress);
    await expect(
      ownerApi.savePracticeCheckpoint(child, "practice_gift_one", {
        ...gift,
        revision: 5,
        gameProgress: { [gameId]: { ...gift.gameProgress[gameId], placed: [] } }
      })
    ).rejects.toMatchObject({ status: 409 });
    expect((await ownerApi.getPracticeCheckpoints(child)).stickers).toEqual(["item-bong"]);
    await expect(
      ownerApi.savePracticeCheckpoint(child, "practice_gift_one", {
        ...gift,
        revision: 5,
        gameStickers: { [gameId]: "item-gau" }
      })
    ).rejects.toMatchObject({ status: 409 });
    expect((await ownerApi.getPracticeCatalog(child)).lessons).toHaveLength(0);
    await expect(
      ownerApi.preparePracticeLesson(child, "fixture_lesson_put_ball")
    ).rejects.toMatchObject({ status: 403 });
  });
});
