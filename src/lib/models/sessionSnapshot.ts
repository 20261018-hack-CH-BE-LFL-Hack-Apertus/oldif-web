import { uniqueEvents } from "./eventIdentity";
import type { Event, Result, Run } from "./types";
export type SessionSnapshot = {
  runs?: Array<Record<string, unknown>>;
  messages?: Array<Record<string, unknown>>;
  events?: Event[];
};
export function latestSequence(events: Event[] = []) {
  return events.reduce(
    (latest, event) => Math.max(latest, event.sequence ?? 0),
    0,
  );
}
export function restoreRuns(data: SessionSnapshot): Run[] {
  return (data.runs ?? []).map((row) => {
    const id = String(row.id ?? row.run_id);
    const user = data.messages?.find(
      (message) => message.run_id === id && message.role === "user",
    );
    const assistant = data.messages?.find(
      (message) => message.run_id === id && message.role === "assistant",
    );
    const events = uniqueEvents(
      data.events?.filter((event) => event.run_id === id) ?? [],
    );
    const result = (assistant?.result ?? row.result ?? row.output) as
      | Result
      | undefined;
    return {
      id,
      startedAt:
        typeof row.created_at === "string"
          ? Date.parse(row.created_at)
          : undefined,
      lastSequence: latestSequence(events),
      eventIds: events.flatMap((event) =>
        event.event_id ? [event.event_id] : [],
      ),
      question: String(user?.content ?? row.message ?? row.question ?? ""),
      text: String(assistant?.content ?? ""),
      error: typeof row.error === "string" ? row.error : undefined,
      traces: events
        .filter((event) => event.type === "trace")
        .map((event) => ({ ...event.data, sequence: event.sequence })),
      result: result
        ? {
            ...result,
            review_version:
              typeof row.version === "number"
                ? row.version
                : result.review_version,
          }
        : undefined,
      status:
        row.status === "running"
          ? "running"
          : row.status === "cancelled"
            ? "cancelled"
            : row.status === "error" || row.status === "failed"
              ? "error"
              : "done",
    };
  });
}
