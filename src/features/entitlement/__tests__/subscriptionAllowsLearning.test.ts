import type { components } from "@/api/generated";

import { subscriptionAllowsLearning } from "../subscriptionAllowsLearning";

type Subscription = components["schemas"]["Subscription"];
const active: Subscription = {
  state: "active",
  version: 1,
  effectiveUntil: "2026-10-08T00:00:00.000Z",
  accessUntil: "2026-10-08T00:00:00.000Z",
  learningAllowed: true,
  allowedCapabilities: ["learning.plan.full"],
  familyDataAllowed: true,
  serverTime: "2026-10-07T00:00:00.000Z"
};

test("learning access fails closed for denied, expired, and malformed projections", () => {
  expect(subscriptionAllowsLearning(active)).toBe(true);
  expect(subscriptionAllowsLearning({ ...active, learningAllowed: false })).toBe(false);
  expect(subscriptionAllowsLearning({ ...active, allowedCapabilities: [] })).toBe(false);
  expect(subscriptionAllowsLearning({ ...active, accessUntil: active.serverTime })).toBe(false);
  expect(subscriptionAllowsLearning({ ...active, serverTime: "invalid" })).toBe(false);
});
