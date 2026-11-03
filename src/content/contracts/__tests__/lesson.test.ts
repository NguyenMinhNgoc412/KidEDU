import { lessonJsonSchemaV1, lessonSchemaV1 } from "../lesson";

const lesson = {
  schemaVersion: 1,
  id: "lesson_request_water",
  version: 1,
  status: "published",
  primaryGoalId: "goal_request",
  supportingGoalId: null,
  parentPurpose: "Tạo cơ hội để con yêu cầu nước trong sinh hoạt.",
  activitySequence: [
    { id: "activity_request_01", version: 1, type: "functional_communication" },
    { id: "activity_transfer_01", version: 1, type: "parent_transfer" }
  ],
  transferActivityRef: { id: "activity_transfer_01", version: 1, type: "parent_transfer" }
};

describe("lesson schema v1", () => {
  it("accepts a version-pinned lesson with parent transfer", () => {
    expect(lessonSchemaV1.safeParse(lesson).success).toBe(true);
    expect(lessonJsonSchemaV1.$id).toBe("urn:kidedu:content:lesson:v1");
  });

  it("rejects a transfer outside the sequence or wrong type", () => {
    expect(
      lessonSchemaV1.safeParse({
        ...lesson,
        transferActivityRef: { id: "activity_missing", version: 1, type: "parent_transfer" }
      }).success
    ).toBe(false);
    expect(
      lessonSchemaV1.safeParse({
        ...lesson,
        transferActivityRef: {
          id: "activity_request_01",
          version: 1,
          type: "functional_communication"
        }
      }).success
    ).toBe(false);
  });

  it("rejects duplicate activity versions and same supporting goal", () => {
    expect(
      lessonSchemaV1.safeParse({
        ...lesson,
        activitySequence: [
          lesson.activitySequence[0],
          lesson.activitySequence[0],
          lesson.activitySequence[1]
        ]
      }).success
    ).toBe(false);
    expect(lessonSchemaV1.safeParse({ ...lesson, supportingGoalId: "goal_request" }).success).toBe(
      false
    );
  });
});
