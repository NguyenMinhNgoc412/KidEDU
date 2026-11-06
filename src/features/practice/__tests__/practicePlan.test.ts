import {
  changePracticeGoal,
  composePractice,
  setPracticeLessons,
  type PracticeCatalog,
  type PracticeDocument
} from "../practicePlan";

const catalog: PracticeCatalog = {
  schemaVersion: 1,
  version: "release_a",
  source: "development_fixture",
  learningAllowed: true,
  goals: [
    { id: "request", title: "Yêu cầu", description: "", prerequisiteIds: [] },
    { id: "command", title: "Hiểu", description: "", prerequisiteIds: [] }
  ],
  lessons: [
    {
      id: "request_a",
      goalId: "request",
      title: "A",
      preparation: "",
      itemId: "a",
      version: 1,
      activityTypes: [],
      prerequisiteLessonIds: []
    },
    {
      id: "command_two",
      goalId: "command",
      title: "B",
      preparation: "",
      itemId: "a",
      version: 1,
      activityTypes: [],
      prerequisiteLessonIds: ["command_one"]
    },
    {
      id: "command_one",
      goalId: "command",
      title: "C",
      preparation: "",
      itemId: "a",
      version: 1,
      activityTypes: [],
      prerequisiteLessonIds: []
    }
  ]
};
test("a session contains every available lesson; goals prioritize an opportunity rather than replacing the session", () => {
  expect(composePractice(catalog, null).lessons.map((item) => item.id)).toEqual([
    "request_a",
    "command_two",
    "command_one"
  ]);
  const command = changePracticeGoal(catalog, null, "command");
  expect(command.selectedLessonId).toBe("command_one");
  const both = changePracticeGoal(catalog, command, "request");
  expect(both.goalIds).toEqual(["command", "request"]);
  expect(both.selectedLessonId).toBe("command_one");
  expect(() => changePracticeGoal(catalog, null, "unknown")).toThrow("UNKNOWN_GOAL");
});
test("explicit selection persists order, addition/removal and an intentionally empty session", () => {
  const document = setPracticeLessons(catalog, null, ["command_one", "request_a"]);
  expect(composePractice(catalog, document).lessons.map((item) => item.id)).toEqual([
    "command_one",
    "request_a"
  ]);
  const reordered = setPracticeLessons(catalog, document, ["request_a", "command_one"]);
  expect(composePractice(catalog, reordered).lessons.map((item) => item.id)).toEqual([
    "request_a",
    "command_one"
  ]);
  expect(changePracticeGoal(catalog, reordered, "request").lessonIds).toEqual(reordered.lessonIds);
  const empty = setPracticeLessons(catalog, reordered, []);
  expect(composePractice(catalog, empty).lessons).toEqual([]);
  expect(composePractice(catalog, empty).lesson).toBeNull();
  expect(() => setPracticeLessons(catalog, document, ["unknown"])).toThrow(
    "INVALID_SESSION_LESSONS"
  );
  expect(() => setPracticeLessons(catalog, document, ["request_a", "request_a"])).toThrow(
    "INVALID_SESSION_LESSONS"
  );
});
test("deferral excludes a lesson across composition; no replacement goal is invented", () => {
  const document: PracticeDocument = {
    ...changePracticeGoal(catalog, null, "command"),
    deferredLessonIds: ["command_one", "command_two"]
  };
  expect(composePractice(catalog, document).lessons.map((item) => item.id)).toEqual(["request_a"]);
  expect(changePracticeGoal(catalog, document, "command").goalIds).toEqual([]);
  expect(changePracticeGoal(catalog, document, "command").selectedLessonId).toBeNull();
});
