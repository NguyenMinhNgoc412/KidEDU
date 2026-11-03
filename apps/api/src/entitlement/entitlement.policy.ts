export type EntitlementState =
  | "trial_active"
  | "active"
  | "grace_period"
  | "billing_retry"
  | "canceled_active"
  | "expired"
  | "refunded"
  | "revoked"
  | "account_hold";

export type EntitlementProjection = {
  state: EntitlementState;
  effectiveUntil: Date | null;
  capabilities: readonly string[];
  /** Set only after a trusted store reconciliation; never from a mobile callback. */
  billingRetryAllowsAccess?: boolean;
};

export type EffectiveAccess = {
  learningAllowed: boolean;
  allowedCapabilities: readonly string[];
  effectiveUntil: Date | null;
  familyDataAllowed: true;
};

export function evaluateEntitlement(
  projection: EntitlementProjection | null,
  now: Date
): EffectiveAccess {
  if (!projection) {
    return {
      learningAllowed: false,
      allowedCapabilities: [],
      effectiveUntil: null,
      familyDataAllowed: true
    };
  }

  const stateAllowsAccess =
    projection.state === "trial_active" ||
    projection.state === "active" ||
    projection.state === "grace_period" ||
    projection.state === "canceled_active" ||
    (projection.state === "billing_retry" && projection.billingRetryAllowsAccess === true);
  const withinWindow =
    projection.effectiveUntil !== null && projection.effectiveUntil.getTime() > now.getTime();
  const learningAllowed =
    stateAllowsAccess && withinWindow && projection.capabilities.includes("learning.plan.full");
  return {
    learningAllowed,
    allowedCapabilities: learningAllowed ? [...new Set(projection.capabilities)] : [],
    effectiveUntil: learningAllowed ? projection.effectiveUntil : null,
    familyDataAllowed: true
  };
}
