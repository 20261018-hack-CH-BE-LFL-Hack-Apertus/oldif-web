import type { Run, Trace } from "@/lib/models/types";
import type { ActivityLabel } from "./workbenchCopy";
export type ActivityItem = {
  id: string;
  label: ActivityLabel;
  detail?: string;
  state: "running" | "done" | "stopped" | "error" | "attention";
  durationMs?: number;
  events: Trace[];
};
const text = (value: unknown) =>
  typeof value === "string" ? value.slice(0, 180) : undefined;
function labelFor(trace: Trace): ActivityLabel {
  const kind = trace.kind ?? "";
  if (kind === "review.output_bounded") return "reviewNeeded";
  if (kind === "proposals.withheld") return "withheld";
  if (kind === "proposals.unavailable") return "unavailable";
  if (kind === "tool.denied") return "denied";
  if (kind.startsWith("tool."))
    return trace.tool === "read_source"
      ? "reading"
      : trace.tool === "search_sources"
        ? "searching"
        : "tool";
  if (kind.startsWith("model.")) {
    if (trace.agent?.startsWith("planner")) return "planning";
    if (trace.agent?.startsWith("researcher")) return "researching";
    if (trace.agent === "verifier") return "verifying";
    if (trace.agent === "dreamer") return "proposing";
  }
  if (kind === "run.started") return "preparing";
  if (kind === "tools.evidence_complete") return "reading";
  return "updated";
}
function stateFor(trace: Trace): ActivityItem["state"] {
  if (trace.kind?.endsWith(".started") && trace.kind !== "run.started")
    return "running";
  if (trace.kind?.endsWith(".failed")) return "error";
  if (
    [
      "tool.denied",
      "review.output_bounded",
      "proposals.withheld",
      "proposals.unavailable",
    ].includes(trace.kind ?? "")
  )
    return "attention";
  return "done";
}
function detailFor(trace: Trace): string | undefined {
  const result =
    trace.result && typeof trace.result === "object"
      ? (trace.result as Record<string, unknown>)
      : undefined;
  const args =
    trace.arguments && typeof trace.arguments === "object"
      ? (trace.arguments as Record<string, unknown>)
      : undefined;
  if (trace.kind?.startsWith("tool."))
    return text(result?.title) ?? text(args?.query) ?? text(args?.source_id);
  return undefined;
}
export function summarizeActivity(
  traces: Trace[],
  status: Run["status"],
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const calls = new Map<string, ActivityItem>();
  const seen = new Set<number>();
  for (const trace of traces) {
    if (typeof trace.sequence === "number" && seen.has(trace.sequence))
      continue;
    if (typeof trace.sequence === "number") seen.add(trace.sequence);
    const family = trace.kind?.split(".")[0] ?? "event";
    const key =
      typeof trace.call_id === "string"
        ? `${family}:${trace.call_id}`
        : undefined;
    let item = key ? calls.get(key) : undefined;
    if (!item) {
      item = {
        id: key ?? `event:${trace.sequence ?? items.length}`,
        label: labelFor(trace),
        state: stateFor(trace),
        events: [],
      };
      items.push(item);
      if (key) calls.set(key, item);
    }
    item.events.push(trace);
    item.state = stateFor(trace);
    item.detail = detailFor(trace) ?? item.detail;
    if (
      typeof trace.duration_ms === "number" &&
      Number.isFinite(trace.duration_ms) &&
      trace.duration_ms >= 0
    )
      item.durationMs = trace.duration_ms;
  }
  return items.map((item) =>
    item.state === "running" && status !== "running"
      ? { ...item, state: status === "error" ? "error" : "stopped" }
      : item,
  );
}
