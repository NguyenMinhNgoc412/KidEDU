import { activityMediaSlots, orderRecognitionOptions } from "../activityMedia";
import {
  buildMediaSampleGraph,
  mediaSampleLessons
} from "@/features/lessonRuntime/mediaSampleLessons";
import { validatePublishedLessonGraph } from "@/content/contracts/validateLessonGraph";
function activity(id: string) {
  const graph = validatePublishedLessonGraph(
    buildMediaSampleGraph(mediaSampleLessons.find((sample) => sample.id === id)!)
  );
  if (!graph.ok) throw new Error("INVALID_GRAPH");
  return graph.activities[0]!;
}
test("naming cannot play its authored model before assistance; cloze uses pre-authored segments", () => {
  const naming = activity("fixture_lesson_naming");
  expect(activityMediaSlots(naming, false).audio).toBeNull();
  expect(activityMediaSlots(naming, true).audio).toBe("practice_prompt_ba");
  const cloze = activity("fixture_lesson_cloze");
  expect(activityMediaSlots(cloze, false).audio).toBe("practice_segment_ba");
  expect(activityMediaSlots(cloze, true).audio).toBe("practice_segment_family");
});
test("recognition shuffles per attempt reproducibly without mutating options or deriving a score", () => {
  const options = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  expect(orderRecognitionOptions(options, "session:1")).toEqual(
    orderRecognitionOptions(options, "session:1")
  );
  const layouts = new Set(
    Array.from({ length: 20 }, (_, index) =>
      orderRecognitionOptions(options, `session:${index}`)
        .map((option) => option.id)
        .join("")
    )
  );
  expect(layouts.size).toBeGreaterThan(1);
  expect(options.map((option) => option.id)).toEqual(["a", "b", "c", "d"]);
});
