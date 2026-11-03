import type { LessonRuntimeRepository } from "./runtimeRepository";
import type { LessonEvent } from "./sessionEngine";

export interface ObservationTransport {
  ingestObservations(
    childId: string,
    events: LessonEvent[]
  ): Promise<{
    results: {
      eventId: string | null;
      status: "accepted" | "duplicate" | "rejected";
      code?: string;
    }[];
  }>;
}
/** Call outside the activity loop. Lost responses retain identical event IDs for retry. */
export async function flushOutbox(
  repository: LessonRuntimeRepository,
  childId: string,
  transport: ObservationTransport
) {
  const events = await repository.pending(childId);
  if (!events.length) return { remaining: 0, rejected: 0 };
  const response = await transport.ingestObservations(childId, events);
  await repository.acknowledge(
    childId,
    events.map((event) => event.eventId),
    response.results
  );
  return {
    remaining: (await repository.pending(childId)).length,
    rejected: response.results.filter((row) => row.status === "rejected").length
  };
}
