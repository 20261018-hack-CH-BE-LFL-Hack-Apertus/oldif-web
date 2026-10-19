import { uniqueEvents } from "./eventIdentity";
import { latestSequence, type SessionSnapshot } from "./sessionSnapshot";
import type { Event, Result } from "./types";
export type EvidenceState = {
  events: Event[];
  results: Record<string, Result>;
};
export function restoreEvidence(snapshot: SessionSnapshot): EvidenceState {
  const results: Record<string, Result> = {};
  for (const message of snapshot.messages ?? []) {
    if (
      typeof message.run_id === "string" &&
      message.result &&
      typeof message.result === "object"
    )
      results[message.run_id] = message.result as Result;
  }
  return { events: uniqueEvents(snapshot.events ?? []), results };
}
export function applyEvidenceEvent(
  state: EvidenceState,
  event: Event,
): EvidenceState {
  if (
    event.event_id &&
    state.events.some((previous) => previous.event_id === event.event_id)
  )
    return state;
  if (
    typeof event.sequence === "number" &&
    event.sequence <= latestSequence(state.events)
  )
    return state;
  const events = [...state.events, event];
  if (!event.run_id || !["evidence", "final", "done"].includes(event.type))
    return { ...state, events };
  return {
    events,
    results: {
      ...state.results,
      [event.run_id]: {
        ...state.results[event.run_id],
        ...event.data,
      } as Result,
    },
  };
}
