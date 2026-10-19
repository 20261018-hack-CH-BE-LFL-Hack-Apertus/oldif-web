import type { ResearchIntent } from "./researchIntent";
import type { Run } from "./types";
export function pendingRun(
  runs: Run[],
  id: string,
  intent: ResearchIntent,
): Run[] {
  return runs.some((run) => run.id === id)
    ? runs.map((run) =>
        run.id === id ? { ...run, status: "running", error: undefined } : run,
      )
    : [
        ...runs,
        {
          id,
          idempotencyKey: intent.idempotency_key,
          question: intent.message,
          text: "",
          traces: [],
          status: "running",
          startedAt: Date.now(),
        },
      ];
}
export const failedRun = (runs: Run[], id: string, error: string): Run[] =>
  runs.map((run) => (run.id === id ? { ...run, status: "error", error } : run));
