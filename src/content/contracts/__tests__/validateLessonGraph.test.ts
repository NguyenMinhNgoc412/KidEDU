import { validatePublishedLessonGraph } from "../validateLessonGraph";

const target = {
  schemaVersion: 1,
  id: "target_water",
  version: 1,
  status: "published",
  canonicalText: "nước",
  normalizedSearchText: "nuoc",
  targetType: "object",
  skillDomainId: "domain_expression",
  topicIds: ["topic_daily_life"],
  semanticTags: ["drink"],
  complexity: 1,
  regionAccentNote: null,
  prerequisiteTargetIds: [],
  allowedActivityTypes: ["functional_communication", "parent_transfer"],
  safetyNote: null,
  provenanceRef: "provenance_editorial_001"
};

const activityBase = {
  schemaVersion: 1,
  version: 1,
  status: "published",
  goalId: "goal_request",
  targetIds: ["target_water"],
  parentInstruction: "Cho con cơ hội yêu cầu nước.",
  expectedResponse: { canonical: "nước", acceptedVariants: ["con muốn nước"] },
  promptLadder: [{ level: "natural_cue", parentCue: "Chờ con đáp lại." }],
  timing: { waitMinMs: 3000, waitMaxMs: 5000 },
  repetitionLimit: 3,
  assets: { required: [], optional: [] },
  observationRubric: {
    independent: "Con tự yêu cầu.",
    supported: "Con yêu cầu sau gợi ý.",
    notYet: "Con chưa yêu cầu.",
    promptLevels: ["natural_cue"]
  },
  transfer: {
    preparation: "Chuẩn bị cốc nước.",
    parentAction: "Mời con yêu cầu.",
    waitMs: 4000,
    observationHint: "Ghi nhận cách con đáp lại."
  },
  skipRule: "Dừng khi con không muốn tiếp tục."
};

const activity = {
  ...activityBase,
  id: "activity_request_01",
  type: "functional_communication",
  stimulus: {
    scenario: "request",
    opportunity: "Đặt nước trong tầm nhìn.",
    partnerAction: "Chờ con yêu cầu.",
    naturalConsequence: "Đưa nước cho con."
  }
};
const transfer = {
  ...activityBase,
  id: "activity_transfer_01",
  type: "parent_transfer",
  stimulus: {
    preparation: "Chuẩn bị cốc nước.",
    parentAction: "Chờ con yêu cầu.",
    realWorldContext: "Trong bữa ăn."
  }
};
const lesson = {
  schemaVersion: 1,
  id: "lesson_request_water",
  version: 1,
  status: "published",
  primaryGoalId: "goal_request",
  supportingGoalId: null,
  parentPurpose: "Tạo cơ hội để con yêu cầu nước.",
  activitySequence: [
    { id: "activity_request_01", version: 1, type: "functional_communication" },
    { id: "activity_transfer_01", version: 1, type: "parent_transfer" }
  ],
  transferActivityRef: { id: "activity_transfer_01", version: 1, type: "parent_transfer" }
};

const graph = { lesson, activities: [activity, transfer], targets: [target] };

describe("published lesson graph validation", () => {
  it("resolves a synthetic lesson to published activities and targets", () => {
    const result = validatePublishedLessonGraph(graph);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.activities.map((item) => item.id)).toEqual([
        "activity_request_01",
        "activity_transfer_01"
      ]);
      expect(result.targets.map((item) => item.id)).toEqual(["target_water"]);
    }
  });

  it("rejects wrong activity versions and unpublished content", () => {
    const wrongVersion = validatePublishedLessonGraph({
      ...graph,
      lesson: {
        ...lesson,
        activitySequence: [
          { ...lesson.activitySequence[0], version: 2 },
          lesson.activitySequence[1]
        ]
      }
    });
    expect(wrongVersion.ok).toBe(false);
    const draft = validatePublishedLessonGraph({
      ...graph,
      targets: [{ ...target, status: "draft" }]
    });
    expect(draft.ok).toBe(false);
  });

  it("rejects target/activity incompatibility and ambiguous target versions", () => {
    expect(
      validatePublishedLessonGraph({
        ...graph,
        targets: [{ ...target, allowedActivityTypes: ["parent_transfer"] }]
      }).ok
    ).toBe(false);
    expect(
      validatePublishedLessonGraph({ ...graph, targets: [target, { ...target, version: 2 }] }).ok
    ).toBe(false);
  });

  it("rejects an activity whose goal or type differs from the lesson", () => {
    expect(
      validatePublishedLessonGraph({
        ...graph,
        activities: [{ ...activity, goalId: "goal_other" }, transfer]
      }).ok
    ).toBe(false);
    expect(
      validatePublishedLessonGraph({
        ...graph,
        lesson: {
          ...lesson,
          activitySequence: [
            { ...lesson.activitySequence[0], type: "naming" },
            lesson.activitySequence[1]
          ]
        }
      }).ok
    ).toBe(false);
  });

  it("rejects malformed input before resolving references", () => {
    const result = validatePublishedLessonGraph({
      ...graph,
      activities: [{ ...activity, type: "unknown" }, transfer]
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues.some((issue) => issue.path.startsWith("activities.0"))).toBe(true);
  });

  it("returns issues for malformed graph containers", () => {
    expect(validatePublishedLessonGraph(null as never)).toEqual({
      ok: false,
      issues: [{ path: "", message: "Expected lesson graph object" }]
    });
    expect(
      validatePublishedLessonGraph({ lesson, activities: null, targets: {} } as never)
    ).toEqual({
      ok: false,
      issues: [
        { path: "activities", message: "Expected activity array" },
        { path: "targets", message: "Expected target array" }
      ]
    });
  });
});
