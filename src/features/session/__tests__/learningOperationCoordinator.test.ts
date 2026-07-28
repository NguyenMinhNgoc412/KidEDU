import {
  isLearningSessionActive,
  tryBeginExclusiveDataOperation,
  tryBeginLearningSession
} from "../learningOperationCoordinator";

describe("learningOperationCoordinator", () => {
  it("blocks data operations while a learning session is active", () => {
    const releaseLearning = tryBeginLearningSession();

    expect(releaseLearning).not.toBeNull();
    expect(isLearningSessionActive()).toBe(true);
    expect(tryBeginExclusiveDataOperation()).toBeNull();

    releaseLearning?.();
    expect(isLearningSessionActive()).toBe(false);
  });

  it("blocks learning while an exclusive data operation is active", () => {
    const releaseOperation = tryBeginExclusiveDataOperation();

    expect(releaseOperation).not.toBeNull();
    expect(tryBeginLearningSession()).toBeNull();

    releaseOperation?.();
    const releaseLearning = tryBeginLearningSession();
    expect(releaseLearning).not.toBeNull();
    releaseLearning?.();
  });

  it("makes release functions idempotent", () => {
    const releaseLearning = tryBeginLearningSession();
    releaseLearning?.();
    releaseLearning?.();

    const releaseOperation = tryBeginExclusiveDataOperation();
    expect(releaseOperation).not.toBeNull();
    releaseOperation?.();
  });
});
