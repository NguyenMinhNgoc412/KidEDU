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
  return {
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
    createChild: (familyId: string, displayName: string) =>
      call<Child>("POST", "/children", { familyId, displayName }),
    listChildren: () => call<Child[]>("GET", "/children"),
    getChild: (childId: string) => call<Child>("GET", childPath(childId)),
    updateChild: (
      childId: string,
      expectedVersion: number,
      changes: Partial<Pick<Child, "displayName" | "birthYear" | "birthMonth">>
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
