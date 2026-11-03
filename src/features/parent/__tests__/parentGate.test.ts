import {
  createParentGateChallenge,
  isParentGateAnswerCorrect,
  useParentGateStore
} from "../parentGate";

describe("parentGate", () => {
  it("starts locked and can explicitly relock parent access", () => {
    useParentGateStore.getState().lock();
    expect(useParentGateStore.getState().isUnlocked).toBe(false);
    useParentGateStore.getState().unlock();
    expect(useParentGateStore.getState().isUnlocked).toBe(true);
    useParentGateStore.getState().lock();
    expect(useParentGateStore.getState().isUnlocked).toBe(false);
  });

  it("accepts the exact math answer", () => {
    const challenge = createParentGateChallenge(1000);

    expect(isParentGateAnswerCorrect(String(challenge.answer), challenge)).toBe(true);
  });

  it("rejects wrong answer", () => {
    const challenge = createParentGateChallenge(1000);

    expect(isParentGateAnswerCorrect(String(challenge.answer + 1), challenge)).toBe(false);
  });

  it.each(["8garbage", "8.1", "8e0", "", "8 0", "+8"])(
    "rejects malformed legacy answer %s",
    (input) => {
      expect(
        isParentGateAnswerCorrect(input, { left: 3, right: 5, prompt: "3 + 5 = ?", answer: 8 })
      ).toBe(false);
    }
  );
});
