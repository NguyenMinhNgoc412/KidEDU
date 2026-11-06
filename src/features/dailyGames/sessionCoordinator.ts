import type { components } from "../../api/generated";
import type { createLocalApiClient } from "../../api/localClient";
import type { DailyGameLocalRepository } from "./localRepository";
import { flushDailyCheckpoint } from "./flushCheckpoint";
import { dailyGamePhase, type DailyGameAction } from "./sessionEngine";

type Session = components["schemas"]["DailyGameSession"];
export type DailyGameSessionApi = Pick<
  ReturnType<typeof createLocalApiClient>,
  "getDailyGameStatus" | "startDailyGame" | "saveDailyGameCheckpoint"
>;

/** Supplied by the signed-pack/activation loader after checking account, child,
 * pinned generation, local media/key readiness and trusted monotonic deadline.
 * No default/fake production permit is supplied by this module.
 */
export interface DailyGamePreparationBoundary {
  prepare(input: { accountId: string; childId: string; session: Session }): Promise<{
    assertUsable(): void;
    close(): void;
  }>;
}
type Lease = Awaited<ReturnType<DailyGamePreparationBoundary["prepare"]>>;
export type DailyGameLocalState = {
  session: Session;
  localRevision: number;
};
function immutable<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(immutable);
    Object.freeze(value);
  }
  return value;
}

/** API only in explicit preparation/pause/completion boundaries. Inputs commit
 * checkpoint + outbox before returning; no observation or reward authority here.
 */
export class DailyGameSessionCoordinator {
  private queue: Promise<unknown> = Promise.resolve();
  private closed = false;
  private paused = true;
  private generation = 0;
  private lease: Lease | null = null;
  private current: DailyGameLocalState | null = null;
  constructor(
    private readonly accountId: string,
    private readonly childId: string,
    private readonly repository: DailyGameLocalRepository,
    private readonly getApi: () => DailyGameSessionApi,
    private readonly content: DailyGamePreparationBoundary
  ) {
    if (repository.accountId !== accountId) throw new Error("DAILY_NAMESPACE_MISMATCH");
  }
  private assertOpen() {
    if (this.closed) throw new Error("DAILY_COORDINATOR_CLOSED");
  }
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      this.assertOpen();
      return operation();
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
  private stop() {
    this.paused = true;
    this.generation++;
    const lease = this.lease;
    this.lease = null;
    lease?.close();
  }
  /** Foreground/preparation only. Exact pending payload is flushed before remote
   * reload. Conflicts preserve the local branch and use the server snapshot.
   */
  prepare() {
    if (this.closed) return Promise.reject(new Error("DAILY_COORDINATOR_CLOSED"));
    this.stop();
    const generation = this.generation;
    return this.enqueue(async () => {
      const assertCurrent = () => {
        this.assertOpen();
        if (generation !== this.generation) throw new Error("DAILY_PREPARATION_CANCELLED");
      };
      const api = this.getApi();
      const status = await api.getDailyGameStatus(this.childId);
      assertCurrent();
      let conflict = false;
      let local: DailyGameLocalState | null = null;
      if (status.sessionId) {
        local = await this.repository.load(this.childId, status.sessionId);
        const outcome = await flushDailyCheckpoint(
          this.repository,
          this.childId,
          status.sessionId,
          api
        );
        assertCurrent();
        if (outcome === "expired") throw new Error("DAILY_SESSION_EXPIRED");
        if (outcome === "retry" || outcome === "pending") throw new Error("DAILY_SYNC_PENDING");
        conflict = outcome === "conflict";
      }
      const remote = await api.startDailyGame(this.childId);
      assertCurrent();
      if (conflict) {
        if (!local || remote.id !== local.session.id) throw new Error("DAILY_DAY_CHANGED");
        await this.repository.reconcile(this.childId, local.localRevision, remote);
      } else await this.repository.install(this.childId, remote);
      assertCurrent();
      const installed = immutable(await this.repository.load(this.childId, remote.id));
      if (!installed) throw new Error("DAILY_SESSION_NOT_FOUND");
      assertCurrent();
      // Completed checkpoints are read-only. A server-confirmed receipt is a separate operation.
      if (dailyGamePhase(installed.session.plan, installed.session.checkpoint) === "completed") {
        this.current = installed;
        return { state: installed, reconciled: conflict, playable: false };
      }
      const lease = await this.content.prepare({
        accountId: this.accountId,
        childId: this.childId,
        session: installed.session
      });
      try {
        assertCurrent();
        lease.assertUsable();
        assertCurrent();
      } catch (error) {
        lease.close();
        throw error;
      }
      this.lease = lease;
      this.current = installed;
      this.paused = false;
      return { state: installed, reconciled: conflict, playable: true };
    });
  }
  apply(action: DailyGameAction) {
    if (this.closed) return Promise.reject(new Error("DAILY_COORDINATOR_CLOSED"));
    if (this.paused || !this.lease) return Promise.reject(new Error("DAILY_SESSION_PAUSED"));
    const generation = this.generation;
    return this.enqueue(async () => {
      const current = this.current;
      const lease = this.lease;
      const assertUsable = () => {
        this.assertOpen();
        if (this.paused || generation !== this.generation || !lease || lease !== this.lease)
          throw new Error("DAILY_SESSION_PAUSED");
        try {
          lease.assertUsable();
        } catch (error) {
          this.stop();
          throw error;
        }
      };
      assertUsable();
      if (!current) throw new Error("DAILY_SESSION_NOT_PREPARED");
      const before = dailyGamePhase(current.session.plan, current.session.checkpoint);
      const result = await this.repository.apply(
        this.childId,
        current.session.id,
        current.localRevision,
        action,
        assertUsable
      );
      // A pause/account switch during disk commit must not present a late frame.
      assertUsable();
      const session = { ...current.session, checkpoint: result.checkpoint };
      this.current = immutable({ session, localRevision: result.localRevision });
      const requiresBoundary = before !== dailyGamePhase(session.plan, session.checkpoint);
      if (requiresBoundary) {
        if (dailyGamePhase(session.plan, session.checkpoint) === "completed") this.stop();
        else {
          this.paused = true;
          this.generation++;
        }
      }
      return { state: this.current, feedback: result.feedback, requiresBoundary };
    });
  }
  /** Between prepared games, re-check the existing signed/time/media boundary
   * locally. A Ready session does not require a network call to finish its next game.
   * Background/foreground and a discarded lease still require prepare().
   */
  continuePrepared() {
    const generation = this.generation;
    const lease = this.lease;
    return this.enqueue(async () => {
      const current = this.current;
      if (!lease || lease !== this.lease || generation !== this.generation || !current)
        throw new Error("DAILY_SESSION_NOT_PREPARED");
      if (dailyGamePhase(current.session.plan, current.session.checkpoint) === "completed")
        throw new Error("DAILY_SESSION_COMPLETED");
      try {
        lease.assertUsable();
      } catch (error) {
        this.stop();
        throw error;
      }
      this.paused = false;
      return current;
    });
  }
  /** Call before leaving/backgrounding and after the completed game. Stops inputs
   * immediately, drains SQLite work, then retries the durable command at most twice.
   */
  pauseAndSync() {
    if (this.closed) return Promise.reject(new Error("DAILY_COORDINATOR_CLOSED"));
    this.stop();
    return this.enqueue(async () => {
      if (!this.current) return { outcome: "synced" as const, state: null };
      const id = this.current.session.id;
      const outcome = await flushDailyCheckpoint(this.repository, this.childId, id, this.getApi());
      this.assertOpen();
      this.current = immutable(await this.repository.load(this.childId, id));
      return { outcome, state: this.current };
    });
  }
  async close() {
    this.closed = true;
    try {
      this.stop();
    } finally {
      this.current = null;
      await this.queue;
    }
  }
}
