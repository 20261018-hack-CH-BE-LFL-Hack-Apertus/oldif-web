import { reduceRun } from "./events";
import type { Event, Run } from "./types";
export function canvasRuns(events: Event[]): Run[] {
  const runs = new Map<string, Run>();
  for (const event of events) {
    if (!event.run_id) continue;
    const run = runs.get(event.run_id) ?? {
      id: event.run_id,
      question: "",
      text: "",
      traces: [],
      status: "running" as const,
    };
    runs.set(event.run_id, reduceRun(run, event));
  }
  return [...runs.values()];
}
