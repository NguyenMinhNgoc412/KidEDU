import { Injectable } from "@nestjs/common";

import { EntitlementRepository } from "./entitlement.repository";
import { evaluateEntitlement } from "./entitlement.policy";

@Injectable()
export class SubscriptionService {
  constructor(private readonly repository: EntitlementRepository) {}

  async current(accountId: string) {
    const now = new Date();
    const projection = await this.repository.getForAccount(accountId);
    const access = evaluateEntitlement(projection, now);
    return {
      state: projection?.state ?? "none",
      version: projection?.version ?? 0,
      effectiveUntil: projection?.effectiveUntil ?? null,
      accessUntil: access.effectiveUntil,
      learningAllowed: access.learningAllowed,
      allowedCapabilities: access.allowedCapabilities,
      familyDataAllowed: access.familyDataAllowed,
      serverTime: now
    };
  }
}
