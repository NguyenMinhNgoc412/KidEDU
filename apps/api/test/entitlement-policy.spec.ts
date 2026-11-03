import { evaluateEntitlement, type EntitlementState } from "../src/entitlement/entitlement.policy";

const now = new Date("2026-10-07T00:00:00.000Z");
const future = new Date("2026-10-08T00:00:00.000Z");
const past = new Date("2026-10-06T00:00:00.000Z");

describe("server entitlement policy", () => {
  it.each<EntitlementState>(["trial_active", "active", "grace_period", "canceled_active"])(
    "allows %s only before its effective end",
    (state) => {
      expect(
        evaluateEntitlement(
          { state, effectiveUntil: future, capabilities: ["learning.plan.full"] },
          now
        ).learningAllowed
      ).toBe(true);
      expect(
        evaluateEntitlement(
          { state, effectiveUntil: past, capabilities: ["learning.plan.full"] },
          now
        ).learningAllowed
      ).toBe(false);
    }
  );

  it.each<EntitlementState>(["expired", "refunded", "revoked", "account_hold"])(
    "denies premium capability for %s while keeping family data available",
    (state) => {
      expect(
        evaluateEntitlement(
          { state, effectiveUntil: future, capabilities: ["learning.plan.full"] },
          now
        )
      ).toMatchObject({
        learningAllowed: false,
        allowedCapabilities: [],
        familyDataAllowed: true
      });
    }
  );

  it("does not infer access from billing retry without a trusted store decision", () => {
    const base = {
      state: "billing_retry" as const,
      effectiveUntil: future,
      capabilities: ["learning.plan.full", "content.pack.full"]
    };
    expect(evaluateEntitlement(base, now).learningAllowed).toBe(false);
    expect(
      evaluateEntitlement({ ...base, billingRetryAllowsAccess: true }, now).learningAllowed
    ).toBe(true);
  });

  it("does not grant access without an entitlement row or expiry", () => {
    expect(evaluateEntitlement(null, now).learningAllowed).toBe(false);
    expect(
      evaluateEntitlement(
        { state: "active", effectiveUntil: null, capabilities: ["learning.plan.full"] },
        now
      ).learningAllowed
    ).toBe(false);
  });
});
