import { createParentGateChallenge, isParentGateAnswerCorrect } from "../parentGate";

describe("parentGate", () => {
  it("uses a stable default challenge for e2e flows", () => {
    const challenge = createParentGateChallenge();

    expect(challenge.prompt).toBe("3 + 5 = ?");
    expect(challenge.answer).toBe(8);
  });

  it("accepts the exact math answer", () => {
    const challenge = createParentGateChallenge(1000);

    expect(isParentGateAnswerCorrect(String(challenge.answer), challenge)).toBe(true);
  });

  it("rejects wrong answer", () => {
    const challenge = createParentGateChallenge(1000);

    expect(isParentGateAnswerCorrect(String(challenge.answer + 1), challenge)).toBe(false);
  });
});
