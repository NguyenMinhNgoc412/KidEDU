import type { PrivacyDataSummary } from "@/data/types";

import { getPrivacyActionAvailability, resetPrivacyDataAndExit } from "../privacyScreenActions";

describe("privacy screen actions", () => {
  it("keeps close and reset enabled while disabling empty data actions", () => {
    expect(getPrivacyActionAvailability(emptySummary, false)).toEqual({
      hasLearningHistory: false,
      hasPersonalizedMedia: false,
      canClose: true,
      canClearLearningHistory: false,
      canDeletePersonalizedMedia: false,
      canResetApp: true
    });
  });

  it("treats saved learning progress as history even without sessions or events", () => {
    expect(
      getPrivacyActionAvailability({ ...emptySummary, learningProgressCount: 1 }, false)
    ).toEqual(
      expect.objectContaining({
        hasLearningHistory: true,
        hasPersonalizedMedia: false,
        canClearLearningHistory: true,
        canDeletePersonalizedMedia: false
      })
    );
  });

  it("enables personalized-media deletion independently of learning history", () => {
    expect(
      getPrivacyActionAvailability({ ...emptySummary, personalizedMediaCount: 2 }, false)
    ).toEqual(
      expect.objectContaining({
        hasLearningHistory: false,
        hasPersonalizedMedia: true,
        canClearLearningHistory: false,
        canDeletePersonalizedMedia: true
      })
    );
  });

  it("disables every action while another operation is running", () => {
    expect(
      getPrivacyActionAvailability(
        {
          ...emptySummary,
          practiceSessionCount: 1,
          personalizedMediaCount: 1
        },
        true
      )
    ).toEqual({
      hasLearningHistory: true,
      hasPersonalizedMedia: true,
      canClose: false,
      canClearLearningHistory: false,
      canDeletePersonalizedMedia: false,
      canResetApp: false
    });
  });

  it("locks Parent Zone and replaces the route only after reset succeeds", async () => {
    const events: string[] = [];

    await expect(
      resetPrivacyDataAndExit({
        resetAllLocalData: async () => {
          events.push("reset");
          return true;
        },
        lockParentZone: () => events.push("lock"),
        replaceRoute: (path) => events.push(`replace:${path}`)
      })
    ).resolves.toBe(true);

    expect(events).toEqual(["reset", "lock", "replace:/"]);
  });

  it("does not lock or navigate after reset fails", async () => {
    const lockParentZone = jest.fn();
    const replaceRoute = jest.fn();

    await expect(
      resetPrivacyDataAndExit({
        resetAllLocalData: async () => false,
        lockParentZone,
        replaceRoute
      })
    ).resolves.toBe(false);

    expect(lockParentZone).not.toHaveBeenCalled();
    expect(replaceRoute).not.toHaveBeenCalled();
  });
});

const emptySummary: PrivacyDataSummary = {
  learningItemCount: 12,
  deckCount: 3,
  practiceSessionCount: 0,
  practiceEventCount: 0,
  learningProgressCount: 0,
  personalizedMediaCount: 0,
  personalizedMediaBytes: 0
};
