import { getDevelopmentLesson } from "../developmentLesson";
import { prepareSampleLesson, sampleLessons } from "../lessonCatalog";
import { buildMediaSampleGraph } from "../mediaSampleLessons";
import { validatePublishedLessonGraph } from "@/content/contracts/validateLessonGraph";
import type { LocalActivityAssets } from "@/features/practice/activityMedia";

const accountId = "11111111-1111-4111-8111-111111111111";
const childId = "22222222-2222-4222-8222-222222222222";
export function testMediaResources(sample: (typeof sampleLessons)[number]) {
  if (!("activityType" in sample)) return undefined;
  const graph = validatePublishedLessonGraph(buildMediaSampleGraph(sample));
  if (!graph.ok) throw new Error("INVALID_FIXTURE");
  const media: LocalActivityAssets = {};
  for (const activity of graph.activities)
    for (const ref of activity.assets.required) {
      const type = ref.role.endsWith("audio")
        ? "audio"
        : ref.role === "mouth_video"
          ? "video"
          : "image";
      media[ref.assetId] = {
        uri: `web-media://${accountId}/${ref.assetId}`,
        accountId,
        childId,
        role: ref.role,
        type,
        mimeType: type === "audio" ? "audio/wav" : type === "video" ? "video/mp4" : "image/jpeg"
      };
    }
  return { accountId, childId, media };
}

test("each sample prepares its own valid immutable lesson and matching response", () => {
  const generations = new Set<string>();
  for (const sample of sampleLessons) {
    const lesson = prepareSampleLesson(true, sample.id, testMediaResources(sample));
    generations.add(lesson.generation);
    expect(lesson.lesson.id).toBe(sample.id);
    expect(lesson.activities[0]!.expectedResponse.canonical).toBe(sample.response);
    expect(lesson.activities[0]!.transfer.preparation).toBe(sample.preparation);
    expect(lesson.activities[1]!.type).toBe("parent_transfer");
    expect(lesson.activities[0]!.goalId).toBe(lesson.lesson.primaryGoalId);
    expect(Object.isFrozen(lesson)).toBe(true);
    expect(() => prepareSampleLesson(false, sample.id)).toThrow("FIXTURE_NOT_ALLOWED");
  }
  expect(generations.size).toBe(sampleLessons.length);
  expect(prepareSampleLesson(true, sampleLessons[0].id)).toEqual(getDevelopmentLesson(true));
  expect(() => prepareSampleLesson(true, "unknown")).toThrow("UNKNOWN_LESSON");
});

test("all ten activity types have sample coverage; media readiness is per activity and scope", () => {
  const types = new Set(
    sampleLessons.flatMap((sample) =>
      prepareSampleLesson(true, sample.id, testMediaResources(sample)).activities.map(
        (activity) => activity.type
      )
    )
  );
  expect(types.size).toBe(10);
  const sample = sampleLessons.find((lesson) => lesson.id === "fixture_lesson_naming")!;
  expect(() => prepareSampleLesson(true, sample.id)).toThrow("ACTIVITY_NOT_PREPARED");
  const resources = testMediaResources(sample)!;
  expect(prepareSampleLesson(true, sample.id, resources).activities[0]!.type).toBe("naming");
  const wrongChild = { ...resources, childId: accountId };
  expect(() => prepareSampleLesson(true, sample.id, wrongChild)).toThrow("ACTIVITY_NOT_PREPARED");
  const asset = resources.media["practice_prompt_ba"]!;
  const wrongMime = {
    ...resources,
    media: { ...resources.media, practice_prompt_ba: { ...asset, mimeType: "video/mp4" } }
  };
  expect(() => prepareSampleLesson(true, sample.id, wrongMime)).toThrow("ACTIVITY_NOT_PREPARED");
});

test("commands author ordered real-world actions; choice/refusal never impose a right preference", () => {
  const command = prepareSampleLesson(true, "fixture_lesson_two_steps").activities[0]!;
  expect(command.type).toBe("command");
  if (command.type !== "command") throw new Error("Expected command");
  expect(command.stimulus.orderedActions).toEqual(["Cho bóng vào hộp", "Đưa gấu cho mẹ"]);
  expect(command.observationRubric.independent).toContain("một lần nghe");
  for (const id of ["fixture_lesson_choice", "fixture_lesson_refusal"]) {
    const activity = prepareSampleLesson(true, id).activities[0]!;
    expect(activity.type).toBe("functional_communication");
    expect(activity.promptLadder[0]!.level).toBe("natural_cue");
    expect(activity.promptLadder.at(-1)!.level).toBe("full_model");
  }
});
