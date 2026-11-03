import { developmentLessonGraph } from "./developmentLesson";
import { prepareDevelopmentLesson } from "./prepareLesson";

/** Synthetic local lessons; these are not a published production curriculum. */
export const sampleLessons = [
  {
    id: "fixture_lesson_request",
    title: "Con muốn nước",
    itemId: "item-ly",
    object: "cốc nước",
    response: "nước",
    preparation: "Một cốc nước phù hợp, phụ huynh ở cạnh con.",
    context: "Trong bữa ăn hoặc giờ nghỉ.",
    search: "nuoc"
  },
  {
    id: "fixture_lesson_ball",
    title: "Con muốn bóng",
    itemId: "item-bong",
    object: "quả bóng",
    response: "bóng",
    preparation: "Một quả bóng mềm phù hợp, phụ huynh ở cạnh con.",
    context: "Trong giờ chơi bóng cùng gia đình.",
    search: "bong"
  },
  {
    id: "fixture_lesson_bear",
    title: "Con muốn gấu",
    itemId: "item-gau",
    object: "gấu bông",
    response: "gấu",
    preparation: "Một gấu bông quen thuộc, phụ huynh ở cạnh con.",
    context: "Trong lúc chơi hoặc chuẩn bị nghỉ.",
    search: "gau"
  }
] as const;
export function findSampleLesson(id: string) {
  return sampleLessons.find((lesson) => lesson.id === id);
}
export function prepareSampleLesson(development: boolean, id: string) {
  const sample = findSampleLesson(id);
  if (!sample) throw new Error("UNKNOWN_LESSON");
  // Preserve the original fixture generation so existing water sessions resume unchanged.
  if (id === sampleLessons[0].id)
    return prepareDevelopmentLesson(developmentLessonGraph, development);
  const graph = JSON.parse(JSON.stringify(developmentLessonGraph)) as typeof developmentLessonGraph;
  graph.lesson.id = sample.id;
  graph.lesson.parentPurpose = `Cùng con tạo cơ hội yêu cầu ${sample.response} trong sinh hoạt.`;
  const target = graph.targets[0]!;
  target.id = `${sample.id}_target`;
  target.canonicalText = sample.response;
  target.normalizedSearchText = sample.search;
  graph.activities.forEach((activity, index) => {
    activity.id = `${sample.id}_${index === 0 ? "request" : "transfer"}`;
    activity.targetIds = [target.id];
    activity.expectedResponse = {
      canonical: sample.response,
      acceptedVariants: [`con muốn ${sample.response}`, "cử chỉ yêu cầu"]
    };
    activity.promptLadder[0]!.parentCue = `Đặt ${sample.object} trong tầm nhìn và chờ con đáp lại.`;
    activity.promptLadder[2]!.parentCue = `Nói mẫu một lần: Con muốn ${sample.response}.`;
    activity.transfer.preparation = sample.preparation;
    if (activity.type === "functional_communication") {
      activity.stimulus = {
        scenario: "request",
        opportunity: `Cùng con nhìn ${sample.object} thật.`,
        partnerAction: "Chờ một cơ hội yêu cầu tự nhiên.",
        naturalConsequence: `Đáp lại và đưa ${sample.object} cho con.`
      };
    } else {
      activity.stimulus = {
        preparation: sample.preparation,
        parentAction: activity.transfer.parentAction,
        realWorldContext: sample.context
      };
    }
  });
  graph.lesson.activitySequence = graph.activities.map((activity) => ({
    id: activity.id,
    version: activity.version,
    type: activity.type
  }));
  graph.lesson.transferActivityRef = graph.lesson.activitySequence[1];
  return prepareDevelopmentLesson(graph, development);
}
