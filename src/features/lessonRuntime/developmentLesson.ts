import { prepareDevelopmentLesson } from "./prepareLesson";

// Synthetic authoring fixture, never an approved production corpus or pack.
const common = {
  schemaVersion: 1,
  version: 1,
  status: "published",
  goalId: "fixture_goal_request",
  targetIds: ["fixture_target_water"],
  parentInstruction: "Tạo cơ hội yêu cầu, không ép con nói hoặc giữ lại nhu cầu thiết yếu.",
  expectedResponse: { canonical: "nước", acceptedVariants: ["con muốn nước", "cử chỉ yêu cầu"] },
  promptLadder: [
    { level: "natural_cue", parentCue: "Đặt cốc trong tầm nhìn và chờ con đáp lại." },
    { level: "partial_model", parentCue: "Nếu phù hợp, gợi ý ngắn: Con muốn…" },
    { level: "full_model", parentCue: "Nói mẫu một lần: Con muốn nước." }
  ],
  timing: { waitMinMs: 3000, waitMaxMs: 5000 },
  repetitionLimit: 2,
  assets: { required: [], optional: [] },
  observationRubric: {
    independent: "Con chủ động yêu cầu bằng lời hoặc cử chỉ phù hợp.",
    supported: "Con yêu cầu sau gợi ý hoặc làm mẫu.",
    notYet: "Chưa thấy yêu cầu trong cơ hội quan sát.",
    promptLevels: ["natural_cue", "partial_model", "full_model"]
  },
  transfer: {
    preparation: "Một cốc nước phù hợp, phụ huynh ở cạnh con.",
    parentAction: "Trong sinh hoạt, để con có cơ hội yêu cầu rồi đáp lại nhu cầu của con.",
    waitMs: 3000,
    observationHint: "Ghi nhận lời nói, cử chỉ và gợi ý đã dùng."
  },
  skipRule: "Dừng hoặc để lúc khác nếu con không muốn tham gia."
};
const activities = [
  {
    ...common,
    id: "fixture_activity_request",
    type: "functional_communication",
    stimulus: {
      scenario: "request",
      opportunity: "Cùng con nhìn cốc nước thật.",
      partnerAction: "Chờ một cơ hội yêu cầu tự nhiên.",
      naturalConsequence: "Đáp lại và đưa nước cho con."
    }
  },
  {
    ...common,
    id: "fixture_activity_transfer",
    type: "parent_transfer",
    stimulus: {
      preparation: common.transfer.preparation,
      parentAction: common.transfer.parentAction,
      realWorldContext: "Trong bữa ăn hoặc giờ nghỉ."
    }
  }
];
const refs = activities.map(({ id, type }) => ({ id, version: 1, type }));
export const developmentLessonGraph = {
  lesson: {
    schemaVersion: 1,
    id: "fixture_lesson_request",
    version: 1,
    status: "published",
    primaryGoalId: common.goalId,
    supportingGoalId: null,
    parentPurpose: "Cùng con tạo cơ hội yêu cầu trong sinh hoạt.",
    activitySequence: refs,
    transferActivityRef: refs[1]
  },
  activities,
  targets: [
    {
      schemaVersion: 1,
      id: "fixture_target_water",
      version: 1,
      status: "published",
      canonicalText: "nước",
      normalizedSearchText: "nuoc",
      targetType: "object",
      skillDomainId: "fixture_domain_expression",
      topicIds: ["fixture_topic_daily"],
      semanticTags: [],
      complexity: 1,
      regionAccentNote: null,
      prerequisiteTargetIds: [],
      allowedActivityTypes: ["functional_communication", "parent_transfer"],
      safetyNote: null,
      provenanceRef: "fixture_synthetic"
    }
  ]
};
export function getDevelopmentLesson(development: boolean) {
  return prepareDevelopmentLesson(developmentLessonGraph, development);
}
