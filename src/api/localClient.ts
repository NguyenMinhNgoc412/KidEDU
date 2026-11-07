import type { components } from "./generated";
import { requestWithTimeout } from "./requestWithTimeout";

type Child = components["schemas"]["Child"];
type Me = components["schemas"]["Me"];
type Subscription = components["schemas"]["Subscription"];
type Family = components["schemas"]["Family"];
type Plan = components["schemas"]["Plan"];
type PlanDocument = components["schemas"]["PlanDocument"];
type ObservationEvent = components["schemas"]["ObservationEvent"];
type Observation = components["schemas"]["Observation"];

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string
  ) {
    super(`API request failed: ${code} (${status})`);
  }
}

export function createLocalApiClient(
  baseUrl: string,
  accessToken: string,
  fetcher: typeof fetch = fetch
) {
  const root = baseUrl.replace(/\/+$/, "");
  if (!/^https?:\/\//.test(root) || !accessToken.trim()) {
    throw new Error("API URL and access token are required");
  }

  async function call<T>(
    method: "GET" | "PUT" | "POST" | "PATCH",
    path: string,
    body?: unknown
  ): Promise<T> {
    return requestWithTimeout(async (signal) => {
      const response = await fetcher(`${root}/v1${path}`, {
        method,
        signal,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const envelope = data as { error?: { code?: string } };
        throw new ApiRequestError(response.status, envelope?.error?.code ?? "UNKNOWN_ERROR");
      }
      return data as T;
    });
  }

  const childPath = (childId: string) => `/children/${encodeURIComponent(childId)}`;
  const dailySessionPath = (childId: string, sessionId: string) =>
    `${childPath(childId)}/daily-game/${encodeURIComponent(sessionId)}`;
  return {
    getDailyRewardState: (childId: string, sessionId: string) =>
      call<components["schemas"]["DailyRewardState"]>(
        "GET",
        `${dailySessionPath(childId, sessionId)}/reward`
      ),
    getDailyRewardInventory: (childId: string) =>
      call<components["schemas"]["DailyRewardInventory"]>(
        "GET",
        `${childPath(childId)}/daily-game/inventory`
      ),
    getDailyGameStatus: (childId: string) =>
      call<components["schemas"]["DailyGameStatus"]>("GET", `${childPath(childId)}/daily-game`),
    startDailyGame: (childId: string) =>
      call<components["schemas"]["DailyGameSession"]>(
        "POST",
        `${childPath(childId)}/daily-game/start`,
        {}
      ),
    saveDailyGameCheckpoint: (
      childId: string,
      sessionId: string,
      expectedRevision: number,
      checkpoint: components["schemas"]["DailyGameCheckpoint"]
    ) =>
      call<components["schemas"]["DailyGameCheckpointAck"]>(
        "PUT",
        `${dailySessionPath(childId, sessionId)}/checkpoint`,
        { expectedRevision, checkpoint }
      ),
    reserveDailyReward: (childId: string, sessionId: string, kind: "sticker" | "puzzle_piece") =>
      call<components["schemas"]["DailyRewardBoxes"]>(
        "POST",
        `${dailySessionPath(childId, sessionId)}/reward/reserve`,
        { kind }
      ),
    claimDailyReward: (childId: string, sessionId: string, boxIndex: number) =>
      call<components["schemas"]["DailyRewardReceipt"]>(
        "POST",
        `${dailySessionPath(childId, sessionId)}/reward/claim`,
        { boxIndex }
      ),
    restartLocalDailyTest: (childId: string, sessionId: string) =>
      call<{ restarted: true }>("POST", `${childPath(childId)}/daily-game/local-test/restart`, {
        sessionId
      }),
    getPracticeCatalog: (childId: string) =>
      call<components["schemas"]["PracticeCatalog"]>(
        "GET",
        `${childPath(childId)}/practice/catalog`
      ),
    getPracticePlan: (childId: string) =>
      call<components["schemas"]["PracticePlan"]>("GET", `${childPath(childId)}/practice/plan`),
    savePracticePlan: (
      childId: string,
      expectedRevision: number,
      document: components["schemas"]["PracticeDocument"]
    ) =>
      call<components["schemas"]["PracticePlan"]>("PUT", `${childPath(childId)}/practice/plan`, {
        expectedRevision,
        document
      }),
    preparePracticeLesson: (childId: string, lessonId: string, lessonIds?: string[]) =>
      call<components["schemas"]["PracticePreparation"]>(
        "POST",
        `${childPath(childId)}/practice/lessons/${encodeURIComponent(lessonId)}/prepare`,
        lessonIds ? { lessonIds } : {}
      ),
    getPracticeCheckpoints: (childId: string) =>
      call<{
        checkpoints: { sessionId: string; document: components["schemas"]["PracticeCheckpoint"] }[];
        stickers?: string[];
      }>("GET", `${childPath(childId)}/practice/checkpoints`),
    savePracticeCheckpoint: (
      childId: string,
      sessionId: string,
      document: components["schemas"]["PracticeCheckpoint"]
    ) =>
      call<{ revision: number }>(
        "PUT",
        `${childPath(childId)}/practice/checkpoints/${encodeURIComponent(sessionId)}`,
        document
      ),
    getMe: () => call<Me>("GET", "/me"),
    getSubscription: () => call<Subscription>("GET", "/subscription"),
    createFamily: () => call<{ id: string }>("POST", "/families", {}),
    listFamilies: () => call<Family[]>("GET", "/families"),
    grantChildProfileConsent: (documentVersion: string) =>
      call<{ id: string; documentVersion: string; grantedAt: string }>("POST", "/consents", {
        scope: "child_profile",
        documentVersion,
        action: "grant",
        attestsGuardian: true
      }),
    createChild: (familyId: string, displayName: string, gender: NonNullable<Child["gender"]>) =>
      call<Child>("POST", "/children", { familyId, displayName, gender }),
    listChildren: () => call<Child[]>("GET", "/children"),
    getChild: (childId: string) => call<Child>("GET", childPath(childId)),
    updateChild: (
      childId: string,
      expectedVersion: number,
      changes: Partial<Pick<Child, "displayName" | "birthYear" | "birthMonth">> & {
        gender?: NonNullable<Child["gender"]>;
      }
    ) => call<Child>("PATCH", childPath(childId), { expectedVersion, ...changes }),
    getPlan: (childId: string) => call<Plan>("GET", `${childPath(childId)}/plan`),
    savePlan: (childId: string, expectedRevision: number, document: PlanDocument) =>
      call<Plan>("PUT", `${childPath(childId)}/plan`, { expectedRevision, document }),
    ingestObservations: (childId: string, events: ObservationEvent[]) =>
      call<{
        results: {
          eventId: string | null;
          status: "accepted" | "duplicate" | "rejected";
          code?: string;
        }[];
      }>("POST", `${childPath(childId)}/events:batch`, { events }),
    listObservations: (childId: string, cursor?: string) =>
      call<{ observations: Observation[]; nextCursor: string | null }>(
        "GET",
        `${childPath(childId)}/observations${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
      ),
    supersedeObservation: (
      observationId: string,
      eventId: string,
      result: ObservationEvent["payload"]["result"],
      promptLevel: number | null
    ) =>
      call<{ status: "accepted" | "duplicate"; observationId: string; supersedesId: string }>(
        "POST",
        `/observations/${encodeURIComponent(observationId)}:supersede`,
        { eventId, result, promptLevel }
      )
  };
}
