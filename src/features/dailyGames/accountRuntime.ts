import type { DailyGameLocalRepository } from "./localRepository";
import {
  DailyGameSessionCoordinator,
  type DailyGameSessionApi,
  type DailyGamePreparationBoundary
} from "./sessionCoordinator";

/** Owns all prepared leases in one account namespace, before closing its SQLite. */
export class DailyGameAccountRuntime {
  private readonly sessions = new Map<string, DailyGameSessionCoordinator>();
  private closing: Promise<void> | null = null;
  private closed = false;
  constructor(readonly repository: DailyGameLocalRepository) {}
  createSession(
    childId: string,
    getApi: () => DailyGameSessionApi,
    content: DailyGamePreparationBoundary
  ) {
    if (this.closed) throw new Error("DAILY_NAMESPACE_CLOSED");
    // One active game screen per device/account; changing child also closes media/access.
    for (const old of this.sessions.values()) void old.close().catch(() => undefined);
    this.sessions.clear();
    const session = new DailyGameSessionCoordinator(
      this.repository.accountId,
      childId,
      this.repository,
      getApi,
      content
    );
    this.sessions.set(childId, session);
    return session;
  }
  close() {
    if (this.closing) return this.closing;
    this.closed = true;
    // close() invalidates each coordinator synchronously before its first await.
    const drained = [...this.sessions.values()].map((session) => session.close());
    this.sessions.clear();
    this.closing = Promise.allSettled([...drained, this.repository.close()]).then((results) => {
      const failed = results.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
    });
    return this.closing;
  }
}
