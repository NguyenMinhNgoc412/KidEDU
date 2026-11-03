import { getDevelopmentLesson } from "../developmentLesson";
import { prepareSampleLesson, sampleLessons } from "../lessonCatalog";

test("each sample prepares its own valid immutable lesson and matching response", () => {
  const generations = new Set<string>();
  for (const sample of sampleLessons) {
    const lesson = prepareSampleLesson(true, sample.id);
    generations.add(lesson.generation);
    expect(lesson.lesson.id).toBe(sample.id);
    expect(lesson.activities[0]!.expectedResponse.canonical).toBe(sample.response);
    expect(lesson.activities[0]!.transfer.preparation).toBe(sample.preparation);
    expect(lesson.activities[1]!.type).toBe("parent_transfer");
    expect(Object.isFrozen(lesson)).toBe(true);
    expect(() => prepareSampleLesson(false, sample.id)).toThrow("FIXTURE_NOT_ALLOWED");
  }
  expect(generations.size).toBe(sampleLessons.length);
  expect(prepareSampleLesson(true, sampleLessons[0].id)).toEqual(getDevelopmentLesson(true));
  expect(() => prepareSampleLesson(true, "unknown")).toThrow("UNKNOWN_LESSON");
});
