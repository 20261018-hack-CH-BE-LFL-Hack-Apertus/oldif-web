import type { Event, Result, Run } from "./types";
export function decodeEvent(value: string): Event | undefined {
  try {
    const parsed = JSON.parse(value);
    return parsed &&
      typeof parsed.type === "string" &&
      (!parsed.data || typeof parsed.data === "object")
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}
export function reduceRun(run: Run, event: Event): Run {
  if (event.run_id && event.run_id !== run.id) return run;
  if (
    typeof event.sequence === "number" &&
    event.sequence <= (run.lastSequence ?? -1)
  )
    return run;
  const current =
    typeof event.sequence === "number"
      ? { ...run, lastSequence: event.sequence }
      : run;
  const data = event.data ?? {};
  if (event.type === "trace")
    return {
      ...current,
      traces: [...run.traces, { ...data, sequence: event.sequence }].slice(
        -200,
      ),
    };
  if (event.type === "delta")
    return {
      ...current,
      text: run.text + (typeof data.text === "string" ? data.text : ""),
    };
  if (["evidence", "final"].includes(event.type))
    return { ...current, result: data as Result };
  if (event.type === "done")
    return {
      ...current,
      status: "done",
      result: {
        ...run.result,
        ...data,
        review_version:
          Math.max(
            run.result?.review_version ?? 0,
            typeof data.review_version === "number" ? data.review_version : 0,
          ) || undefined,
      } as Result,
    };
  if (event.type === "cancelled") return { ...current, status: "cancelled" };
  if (event.type === "error")
    return {
      ...current,
      status: "error",
      error: String(data.message ?? data.error ?? "Run failed"),
    };
  return run;
}
