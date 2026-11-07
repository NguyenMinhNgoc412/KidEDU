import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";

/** The synthetic Compose identity only; never a production entitlement grant. */
export function isLocalFullAccess(accountId?: string) {
  return accountId === "00000000-0000-4000-8000-000000000002" && localFixtureEnabled();
}
