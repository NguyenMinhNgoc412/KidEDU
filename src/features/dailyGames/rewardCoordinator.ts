import type { createLocalApiClient } from "../../api/localClient";
import type { DailyGameLocalRepository } from "./localRepository";

type Api = Pick<
  ReturnType<typeof createLocalApiClient>,
  "getDailyRewardState" | "reserveDailyReward" | "claimDailyReward"
>;

/** Server owns the draw. SQLite only pins this device's first box before I/O. */
export class DailyRewardCoordinator {
  private closed = false;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private readonly repository: DailyGameLocalRepository,
    private readonly childId: string,
    private readonly sessionId: string,
    private readonly getApi: () => Api
  ) {}
  private assertOpen() {
    if (this.closed) throw new Error("DAILY_REWARD_CLOSED");
  }
  private run<T>(operation: () => Promise<T>) {
    const task = this.queue.then(async () => {
      this.assertOpen();
      const result = await operation();
      this.assertOpen();
      return result;
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
  recover() {
    return this.run(async () => {
      const state = await this.getApi().getDailyRewardState(this.childId, this.sessionId);
      this.assertOpen();
      const pendingBox = await this.repository.rewardBoxChoice(this.childId, this.sessionId);
      return { state, pendingBox };
    });
  }
  chooseKind(kind: "sticker" | "puzzle_piece") {
    return this.run(async () => {
      await this.getApi().reserveDailyReward(this.childId, this.sessionId, kind);
      this.assertOpen();
      return this.getApi().getDailyRewardState(this.childId, this.sessionId);
    });
  }
  claim(box: number) {
    return this.run(async () => {
      const savedBox = await this.repository.chooseRewardBox(this.childId, this.sessionId, box);
      this.assertOpen();
      return this.getApi().claimDailyReward(this.childId, this.sessionId, savedBox);
    });
  }
  close() {
    this.closed = true;
  }
}
