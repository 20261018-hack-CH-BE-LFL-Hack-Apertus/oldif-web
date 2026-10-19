import type { Event } from "./types";
export function uniqueEvents(events: Event[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const id = event.event_id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
