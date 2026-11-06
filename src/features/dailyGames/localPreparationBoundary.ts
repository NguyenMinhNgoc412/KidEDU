import type { PlayPiece } from "../../content/contracts/playPresentation";
import type { createLocalApiClient } from "../../api/localClient";
import type { DailyGamePreparationBoundary } from "./sessionCoordinator";
import { localFixtureEnabled } from "../lessonRuntime/fixtureBoundary";

export const localDailyTargets: Readonly<Record<string, PlayPiece>> = Object.fromEntries(
  (
    [
      ["bong", "Bóng"],
      ["gau", "Gấu"],
      ["xe", "Xe"],
      ["banh", "Bánh"],
      ["sua", "Sữa"],
      ["ly", "Ly"],
      ["meo", "Mèo"],
      ["cho", "Chó"],
      ["ca", "Cá"],
      ["me", "Mẹ"],
      ["chim", "Chim"],
      ["ba", "Ba"]
    ] as const
  ).map(([id, label]) => [
    `target_${id}`,
    { id: `target_${id}`, label, picture: `item-${id}` as const }
  ])
);

/** Test-only bundled art. This is deliberately not a signed production pack loader. */
export function localDailyPreparation(
  getApi: () => ReturnType<typeof createLocalApiClient>,
  assertIdentity: () => void,
  monotonic: () => number = () => performance.now()
): DailyGamePreparationBoundary {
  return {
    async prepare({ childId, session }) {
      if (!localFixtureEnabled() || session.plan.contentVersion !== "local_daily_integration_v1")
        throw new Error("DAILY_CONTENT_UNAVAILABLE");
      const ids = [
        ...session.plan.shadowScreens.flatMap((screen) => screen.targetIds),
        ...session.plan.listenRounds.flatMap((round) => round.optionTargetIds),
        ...session.plan.memoryTargetIds
      ];
      if (ids.some((id) => !localDailyTargets[id])) throw new Error("DAILY_CONTENT_UNAVAILABLE");
      assertIdentity();
      const started = monotonic();
      const [status, subscription] = await Promise.all([
        getApi().getDailyGameStatus(childId),
        session.plan.tier === "full" ? getApi().getSubscription() : Promise.resolve(null)
      ]);
      if (
        status.sessionId !== session.id ||
        status.playDay !== session.playDay ||
        status.resetAt !== session.resetAt ||
        !status.canStart
      )
        throw new Error("DAILY_SESSION_EXPIRED");
      let allowance = Date.parse(status.resetAt) - Date.parse(status.serverNow);
      if (session.plan.tier === "full") {
        if (!subscription?.learningAllowed || !subscription.accessUntil)
          throw new Error("DAILY_ACCESS_EXPIRED");
        allowance = Math.min(
          allowance,
          Date.parse(subscription.accessUntil) - Date.parse(status.serverNow)
        );
      }
      if (!Number.isFinite(allowance) || allowance <= 0) throw new Error("DAILY_SESSION_EXPIRED");
      const deadline = started + allowance;
      let closed = false;
      return {
        assertUsable() {
          assertIdentity();
          const now = monotonic();
          if (
            closed ||
            !localFixtureEnabled() ||
            !Number.isFinite(now) ||
            now < started ||
            now >= deadline
          )
            throw new Error("DAILY_SESSION_EXPIRED");
        },
        close() {
          closed = true;
        }
      };
    }
  };
}
