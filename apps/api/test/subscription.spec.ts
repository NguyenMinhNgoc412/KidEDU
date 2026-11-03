import type { EntitlementRepository } from "../src/entitlement/entitlement.repository";
import { SubscriptionService } from "../src/entitlement/subscription.service";

describe("subscription read model", () => {
  it("does not grant learning when no verified entitlement exists", async () => {
    const repository = { getForAccount: jest.fn().mockResolvedValue(null) };
    const service = new SubscriptionService(repository as unknown as EntitlementRepository);
    const result = await service.current("account-1");
    expect(result).toMatchObject({
      state: "none",
      version: 0,
      learningAllowed: false,
      allowedCapabilities: [],
      familyDataAllowed: true
    });
  });

  it("returns only capabilities from a current trusted projection", async () => {
    const repository = {
      getForAccount: jest.fn().mockResolvedValue({
        state: "active",
        effectiveUntil: new Date(Date.now() + 60_000),
        capabilities: ["learning.plan.full", "content.pack.full"],
        billingRetryAllowsAccess: false,
        version: 3,
        updatedAt: new Date()
      })
    };
    const service = new SubscriptionService(repository as unknown as EntitlementRepository);
    const result = await service.current("account-1");
    expect(result).toMatchObject({
      state: "active",
      version: 3,
      learningAllowed: true,
      allowedCapabilities: ["learning.plan.full", "content.pack.full"]
    });
  });
});
