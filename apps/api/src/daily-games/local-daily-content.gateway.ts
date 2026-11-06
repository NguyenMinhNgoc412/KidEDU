import { dailyGamePlanSchemaV1 } from "./daily-game.contract";
import type { DailyContentGateway } from "./daily-content.gateway";

/** Synthetic integration corpus, isolated from release IDs and publication. */
export const LOCAL_DAILY_VERSION = "local_daily_integration_v1";
const targets = [
  "bong",
  "gau",
  "xe",
  "banh",
  "sua",
  "ly",
  "meo",
  "cho",
  "ca",
  "me",
  "chim",
  "ba"
].map((id) => `target_${id}`);

export class LocalDailyContentGateway implements DailyContentGateway {
  readonly ready = true;
  constructor() {
    if (process.env.APP_ENV !== "local" || process.env.C50_LOCAL_DAILY_FIXTURE !== "1")
      throw new Error("Local daily fixture is not permitted");
  }
  plan(tier: "basic" | "full") {
    const ids = tier === "basic" ? targets.slice(0, 5) : targets;
    return dailyGamePlanSchemaV1.parse({
      schemaVersion: 1,
      kind: "daily_game",
      contentVersion: LOCAL_DAILY_VERSION,
      tier,
      shadowScreens: Array.from({ length: tier === "basic" ? 2 : 5 }, (_, index) => ({
        id: `shadow_${index}`,
        targetIds: [0, 1, 2].map((offset) => ids[(index * 2 + offset) % ids.length])
      })),
      listenRounds: ids.map((targetId, index) => ({
        id: `listen_${index}`,
        targetId,
        optionTargetIds: [targetId, ids[(index + 1) % ids.length], ids[(index + 2) % ids.length]]
      })),
      memoryTargetIds: ids.slice(0, 5)
    });
  }
  rewards() {
    return {
      catalogId: "local_daily_rewards",
      version: 1,
      items: [
        ...["animals", "heroes", "princesses"].flatMap((theme) =>
          Array.from({ length: 6 }, (_, index) => ({
            id: `local_sticker_${theme}_${index + 1}`,
            kind: "sticker" as const,
            groups:
              theme === "heroes"
                ? ["boy" as const]
                : theme === "princesses"
                  ? ["girl" as const]
                  : ["boy" as const, "girl" as const]
          }))
        ),
        ...["garden", "space"].flatMap((puzzle) =>
          Array.from({ length: 6 }, (_, index) => ({
            id: `local_piece_${puzzle}_${index}`,
            kind: "puzzle_piece" as const,
            groups: ["boy" as const, "girl" as const]
          }))
        )
      ]
    };
  }
}
