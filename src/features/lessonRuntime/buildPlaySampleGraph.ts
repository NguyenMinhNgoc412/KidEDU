import { developmentLessonGraph } from "./developmentLesson";
import type { PlaySample } from "./playSampleLessons";

export function buildPlaySampleGraph(sample: PlaySample) {
  const goalId = `fixture_goal_${sample.goal}`,
    targetId = `${sample.id}_target`;
  const base = {
    ...developmentLessonGraph.activities[0]!,
    goalId,
    targetIds: sample.presentation.wordGames
      ? sample.presentation.pieces.map((piece) => `${targetId}_${piece.id}`)
      : [targetId],
    parentInstruction: sample.preparation,
    expectedResponse: { canonical: sample.response, acceptedVariants: [] },
    observationRubric: {
      independent:
        "Con phản hồi mục tiêu ngôn ngữ/giao tiếp trong cơ hội này; thao tác ghép/chạm riêng không đủ kết luận.",
      supported: "Con phản hồi sau gợi ý hoặc mẫu của phụ huynh. Ghi đúng mức hỗ trợ đã dùng.",
      notYet:
        "Đã có cơ hội nhưng chưa quan sát được phản hồi mục tiêu. Không xem thao tác trên màn hình là đánh giá năng lực.",
      promptLevels: ["natural_cue", "visual_cue", "full_model"]
    },
    promptLadder: [
      { level: "natural_cue", parentCue: "Nói lời mời ngắn rồi chờ con phản hồi." },
      { level: "visual_cue", parentCue: "Chỉ vào hình/ngữ cảnh nếu con cần gợi ý." },
      { level: "full_model", parentCue: `Làm mẫu một lần: ${sample.response}.` }
    ],
    transfer: {
      preparation: sample.preparation,
      parentAction: sample.context,
      waitMs: 3000,
      observationHint:
        "Chỉ ghi nhận điều thực sự đã quan sát; kết quả màn hình và đời thật được tách riêng."
    }
  };
  const primary = {
    ...base,
    id: `${sample.id}_practice`,
    presentation: sample.presentation,
    ...(sample.goal === "command"
      ? {
          type: "command",
          stimulus: {
            preparation: sample.preparation,
            orderedActions: [sample.response],
            objects: [sample.object]
          }
        }
      : {
          type: "functional_communication",
          stimulus: {
            scenario: sample.scenario,
            opportunity: sample.preparation,
            partnerAction: "Chờ con giao tiếp trước khi làm mẫu; người lớn quan sát trực tiếp.",
            naturalConsequence: "Đáp lại lời nói/cử chỉ của con bằng tương tác thật phù hợp."
          }
        })
  };
  const transfer = {
    ...base,
    id: `${sample.id}_transfer`,
    type: "parent_transfer",
    stimulus: {
      preparation: sample.preparation,
      parentAction: sample.context,
      realWorldContext: sample.context
    }
  };
  const activities = [primary, transfer],
    refs = activities.map(({ id, type }) => ({ id, type, version: 1 }));
  return {
    lesson: {
      ...developmentLessonGraph.lesson,
      id: sample.id,
      primaryGoalId: goalId,
      parentPurpose: sample.title,
      activitySequence: refs,
      transferActivityRef: refs[1]
    },
    activities,
    targets: sample.presentation.wordGames
      ? sample.presentation.pieces.map((piece) => ({
          ...developmentLessonGraph.targets[0]!,
          id: `${targetId}_${piece.id}`,
          canonicalText: piece.label,
          normalizedSearchText: piece.id,
          allowedActivityTypes: [primary.type, "parent_transfer"]
        }))
      : [
          {
            ...developmentLessonGraph.targets[0]!,
            id: targetId,
            canonicalText: sample.response,
            normalizedSearchText: sample.search,
            allowedActivityTypes: [primary.type, "parent_transfer"]
          }
        ]
  };
}
