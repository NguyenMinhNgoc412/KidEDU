import { DailyGameLocalRepository } from "../localRepository";
import { DailyGameSessionCoordinator } from "../sessionCoordinator";
import { DailyGameAccountRuntime } from "../accountRuntime";
import { TestDailyDatabase } from "./sqliteTestDatabase";
import { localPreviewPlan as plan } from "../localPreviewPlan";
import { initialDailyGameCheckpoint } from "../sessionEngine";
import { ApiRequestError } from "../../../api/localClient";
import type { components } from "../../../api/generated";

type Session = components["schemas"]["DailyGameSession"];
function fixture() {
  const db = new TestDailyDatabase();
  const repository = new DailyGameLocalRepository(db, "synthetic-account");
  let remote: Session = {
    schemaVersion: 1,
    id: "11111111-1111-4111-8111-111111111111",
    playDay: "2026-11-06",
    resetAt: "2026-11-06T17:00:00.000Z",
    revision: 1,
    completedAt: null,
    plan,
    checkpoint: initialDailyGameCheckpoint(plan)
  };
  let usable = true;
  const leases: { assertUsable: jest.Mock; close: jest.Mock }[] = [];
  const boundary = {
    prepare: jest.fn(async () => {
      const lease = {
        assertUsable: jest.fn(() => {
          if (!usable) throw new Error("ACCESS_OR_RESET_EXPIRED");
        }),
        close: jest.fn()
      };
      leases.push(lease);
      return lease;
    })
  };
  const api = {
    getDailyGameStatus: jest.fn(async () => ({
      schemaVersion: 1 as const,
      serverNow: "2026-11-06T10:00:00.000Z",
      playDay: remote.playDay,
      resetAt: remote.resetAt,
      tier: "basic" as const,
      contentReady: true,
      state: "resumable" as const,
      sessionId: remote.id,
      canStart: true
    })),
    startDailyGame: jest.fn(async () => structuredClone(remote)),
    saveDailyGameCheckpoint: jest.fn(
      async (_child: string, _id: string, revision: number, checkpoint: Session["checkpoint"]) => {
        if (revision !== remote.revision) throw new ApiRequestError(409, "CONFLICT");
        remote = {
          ...remote,
          revision: revision + 1,
          checkpoint: structuredClone(checkpoint),
          completedAt:
            checkpoint.memoryMatchedTargetIds.length === 5 ? "2026-11-06T10:00:00.000Z" : null
        };
        return {
          schemaVersion: 1 as const,
          sessionId: remote.id,
          revision: remote.revision,
          checkpoint: structuredClone(remote.checkpoint),
          completedAt: remote.completedAt
        };
      }
    )
  };
  const runtime = new DailyGameAccountRuntime(repository);
  const coordinator = runtime.createSession("child-a", () => api, boundary);
  const place = (id: string, index = 0) =>
    coordinator.apply({
      type: "place_shadow",
      roundId: `shadow_${index}`,
      targetId: id,
      slotTargetId: id
    });
  return {
    db,
    repository,
    api,
    boundary,
    leases,
    coordinator,
    runtime,
    place,
    expire: () => {
      usable = false;
    },
    getRemote: () => remote,
    setRemote: (session: Session) => {
      remote = structuredClone(session);
    },
    dispose: async () => {
      await runtime.close();
      db.close();
    }
  };
}

it("finishes all Ready games without network requests, then waits for server-confirmed completion", async () => {
  const f = fixture();
  try {
    await f.repository.initialize();
    const first = await f.coordinator.prepare();
    expect(Object.isFrozen(first.state.session.plan)).toBe(true);
    expect(first.playable).toBe(true);
    for (let index = 0; index < plan.shadowScreens.length; index++)
      for (const id of plan.shadowScreens[index]!.targetIds) await f.place(id, index);
    expect(f.api.saveDailyGameCheckpoint).not.toHaveBeenCalled();
    await expect(
      f.coordinator.apply({ type: "choose_listen", roundId: "listen_0", targetId: "target_bong" })
    ).rejects.toThrow("DAILY_SESSION_PAUSED");
    expect(f.leases[0]!.close).not.toHaveBeenCalled();
    await f.coordinator.continuePrepared();
    expect(f.api.saveDailyGameCheckpoint).not.toHaveBeenCalled();
    for (const round of plan.listenRounds)
      await f.coordinator.apply({
        type: "choose_listen",
        roundId: round.id,
        targetId: round.targetId
      });
    expect(f.api.saveDailyGameCheckpoint).not.toHaveBeenCalled();
    await f.coordinator.continuePrepared();
    for (const target of plan.memoryTargetIds) {
      await f.coordinator.apply({ type: "open_memory", cardId: `${target}:a` });
      await f.coordinator.apply({ type: "open_memory", cardId: `${target}:b` });
    }
    expect(f.api.saveDailyGameCheckpoint).not.toHaveBeenCalled();
    expect(f.api.getDailyGameStatus).toHaveBeenCalledTimes(1);
    expect(f.api.startDailyGame).toHaveBeenCalledTimes(1);
    expect(f.leases[0]!.close).toHaveBeenCalledTimes(1);
    expect((await f.repository.load("child-a", f.getRemote().id))!.session.completedAt).toBeNull();
    const finished = await f.coordinator.pauseAndSync();
    expect(finished.outcome).toBe("synced");
    // Exact first payload, then the latest coalesced checkpoint, with consecutive revisions.
    expect(f.api.saveDailyGameCheckpoint).toHaveBeenCalledTimes(2);
    expect(finished.state!.session.completedAt).not.toBeNull();
    expect(await f.repository.pending("child-a")).toEqual([]);
    expect((await f.coordinator.prepare()).playable).toBe(false);
    expect(f.boundary.prepare).toHaveBeenCalledTimes(1);
  } finally {
    await f.dispose();
  }
});

it("denies the next prepared game and closes its lease when access/reset expires at the transition", async () => {
  const f = fixture();
  try {
    await f.repository.initialize();
    await f.coordinator.prepare();
    for (let index = 0; index < plan.shadowScreens.length; index++)
      for (const id of plan.shadowScreens[index]!.targetIds) await f.place(id, index);
    f.expire();
    await expect(f.coordinator.continuePrepared()).rejects.toThrow("ACCESS_OR_RESET_EXPIRED");
    expect(f.leases[0]!.close).toHaveBeenCalledTimes(1);
    expect(f.api.saveDailyGameCheckpoint).not.toHaveBeenCalled();
    expect(
      (await f.repository.load("child-a", f.getRemote().id))!.session.checkpoint.shadowScreenIndex
    ).toBe(2);
    await expect(
      f.coordinator.apply({ type: "choose_listen", roundId: "listen_0", targetId: "target_bong" })
    ).rejects.toThrow("DAILY_SESSION_PAUSED");
  } finally {
    await f.dispose();
  }
});

it("rolls back checkpoint and outbox when reset/access expires during an asynchronous write", async () => {
  const f = fixture();
  try {
    await f.repository.initialize();
    await f.coordinator.prepare();
    f.db.afterOutbox = f.expire;
    await expect(f.place("target_bong")).rejects.toThrow("ACCESS_OR_RESET_EXPIRED");
    const local = await f.repository.load("child-a", f.getRemote().id);
    expect(local!.session.checkpoint.placedTargetIds).toEqual([]);
    expect(await f.repository.pending("child-a")).toEqual([]);
    expect(f.api.saveDailyGameCheckpoint).not.toHaveBeenCalled();
    expect(f.leases[0]!.close).toHaveBeenCalledTimes(1);
  } finally {
    await f.dispose();
  }
});

it("keeps network failures durable, then reconciles a different device without merging answers", async () => {
  const f = fixture();
  try {
    await f.repository.initialize();
    await f.coordinator.prepare();
    await f.place("target_bong");
    f.api.saveDailyGameCheckpoint.mockRejectedValueOnce(new Error("OFFLINE"));
    expect((await f.coordinator.pauseAndSync()).outcome).toBe("retry");
    expect(await f.repository.pending("child-a")).toHaveLength(1);
    const remote = f.getRemote();
    f.setRemote({
      ...remote,
      revision: remote.revision + 1,
      checkpoint: { ...remote.checkpoint, placedTargetIds: ["target_gau"] }
    });
    const result = await f.coordinator.prepare();
    expect(result.reconciled).toBe(true);
    expect(result.state.session.checkpoint.placedTargetIds).toEqual(["target_gau"]);
    const branch = await f.db.getFirstAsync<{ document: string }>(
      "SELECT document FROM daily_checkpoint_conflicts",
      []
    );
    expect(JSON.parse(branch!.document).checkpoint.placedTargetIds).toEqual(["target_bong"]);
    expect(await f.repository.pending("child-a")).toEqual([]);
  } finally {
    await f.dispose();
  }
});

it("invalidates leases/old handles on account close and closes a late preparation response", async () => {
  const f = fixture();
  try {
    await f.repository.initialize();
    await f.coordinator.prepare();
    let resolve!: (lease: { assertUsable: jest.Mock; close: jest.Mock }) => void;
    let entered!: () => void;
    const entering = new Promise<void>((done) => {
      entered = done;
    });
    f.boundary.prepare.mockImplementationOnce(() => {
      entered();
      return new Promise((done) => {
        resolve = done;
      });
    });
    const pending = f.coordinator.prepare();
    await entering;
    const closing = f.runtime.close();
    expect(f.leases[0]!.close).toHaveBeenCalled();
    const late = { assertUsable: jest.fn(), close: jest.fn() };
    resolve(late);
    await expect(pending).rejects.toThrow("DAILY_COORDINATOR_CLOSED");
    await closing;
    expect(late.close).toHaveBeenCalledTimes(1);
    expect(() => f.runtime.createSession("child-b", () => f.api, f.boundary)).toThrow(
      "DAILY_NAMESPACE_CLOSED"
    );
    await expect(f.repository.load("child-a", f.getRemote().id)).rejects.toThrow(
      "NAMESPACE_CLOSED"
    );
    await expect(f.place("target_bong")).rejects.toThrow("DAILY_COORDINATOR_CLOSED");
  } finally {
    await f.dispose();
  }
});

it("rejects a coordinator bound to a different account namespace", async () => {
  const f = fixture();
  try {
    expect(
      () =>
        new DailyGameSessionCoordinator(
          "other-account",
          "child-a",
          f.repository,
          () => f.api,
          f.boundary
        )
    ).toThrow("DAILY_NAMESPACE_MISMATCH");
  } finally {
    await f.dispose();
  }
});

it.each(["child-a", "child-b"])(
  "opening %s closes the previous screen's prepared lease before the new one starts",
  async (childId) => {
    const f = fixture();
    try {
      await f.repository.initialize();
      await f.coordinator.prepare();
      const replacement = f.runtime.createSession(childId, () => f.api, f.boundary);
      expect(f.leases[0]!.close).toHaveBeenCalledTimes(1);
      await expect(f.place("target_bong")).rejects.toThrow("DAILY_COORDINATOR_CLOSED");
      if (childId === "child-a") expect((await replacement.prepare()).playable).toBe(true);
      else await expect(replacement.prepare()).rejects.toThrow("CHILD_MISMATCH");
      // The synthetic API intentionally returns child-a's session; no cross-child install.
      await f.runtime.close();
      if (childId === "child-a") expect(f.leases[1]!.close).toHaveBeenCalledTimes(1);
    } finally {
      await f.dispose();
    }
  }
);
