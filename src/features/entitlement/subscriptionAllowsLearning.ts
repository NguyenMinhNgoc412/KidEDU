import type { components } from "@/api/generated";

type Subscription = components["schemas"]["Subscription"];

export function subscriptionAllowsLearning(subscription: Subscription): boolean {
  const expiry = subscription.accessUntil ? Date.parse(subscription.accessUntil) : 0;
  const serverTime = Date.parse(subscription.serverTime);
  return (
    subscription.learningAllowed &&
    subscription.allowedCapabilities.includes("learning.plan.full") &&
    Number.isFinite(expiry) &&
    Number.isFinite(serverTime) &&
    expiry > serverTime
  );
}
