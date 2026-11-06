import { ApiRequestError, type createLocalApiClient } from "../../api/localClient";
import type { DailyGameLocalRepository } from "./localRepository";

/** Call at preparation/foreground/pause/completion boundaries, never per game input.
 * Two writes cover the durable first payload and a coalesced newer checkpoint.
 * Conflict/expiry retain local progress for reconciliation; neither awards a reward.
 */
export async function flushDailyCheckpoint(
  repository: DailyGameLocalRepository,
  childId: string,
  sessionId: string,
  api: Pick<ReturnType<typeof createLocalApiClient>, "saveDailyGameCheckpoint">
): Promise<"synced" | "pending" | "conflict" | "expired" | "retry"> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const sent = (await repository.pending(childId)).find((item) => item.sessionId === sessionId);
    if (!sent) return "synced";
    let ack;
    try {
      ack = await api.saveDailyGameCheckpoint(
        childId,
        sessionId,
        sent.expectedRevision,
        sent.checkpoint
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) return "conflict";
      if (error instanceof ApiRequestError && error.status === 410) return "expired";
      // Authorization/validation errors require coordinator handling, not blind retries.
      if (error instanceof ApiRequestError && error.status < 500) throw error;
      return "retry";
    }
    await repository.acknowledge(sent, ack);
  }
  return (await repository.pending(childId)).some((item) => item.sessionId === sessionId)
    ? "pending"
    : "synced";
}
