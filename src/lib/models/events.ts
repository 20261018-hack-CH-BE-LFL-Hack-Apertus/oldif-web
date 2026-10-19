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
  const data = event.data ?? {};
  if (event.type === "trace")
    return {
      ...run,
      traces: [...run.traces, { ...data, sequence: event.sequence }].slice(
        -200,
      ),
    };
  if (event.type === "delta")
    return {
      ...run,
      text: run.text + (typeof data.text === "string" ? data.text : ""),
    };
  if (["evidence", "final"].includes(event.type))
    return { ...run, result: data as Result };
  if (event.type === "done")
    return {
      ...run,
      status: "done",
      result: { ...run.result, ...data } as Result,
    };
  if (event.type === "cancelled") return { ...run, status: "cancelled" };
  if (event.type === "error")
    return {
      ...run,
      status: "error",
      error: String(data.message ?? data.error ?? "Run failed"),
    };
  return run;
}
