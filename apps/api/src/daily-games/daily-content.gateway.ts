import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { DailyGamePlanV1 } from "./daily-game.contract";
import type { PublishedRewardPool } from "./daily-reward.repository";

export const DAILY_CONTENT_GATEWAY = Symbol("DAILY_CONTENT_GATEWAY");
export interface DailyContentGateway {
  readonly ready: boolean;
  plan(tier: "basic" | "full"): DailyGamePlanV1;
  rewards(): PublishedRewardPool;
}

// Fail closed until the signed, reviewed catalog/pack resolver is available.
// Synthetic test plans must only be injected by tests, never activated in production.
@Injectable()
export class UnavailableDailyContentGateway implements DailyContentGateway {
  readonly ready = false;
  plan(): never {
    throw new ServiceUnavailableException("Daily content is not ready");
  }
  rewards(): never {
    throw new ServiceUnavailableException("Reward catalog is not ready");
  }
}
