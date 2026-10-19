import { validResult } from "./resultValidation";
import {
  exact,
  integer,
  nullable,
  object,
  oneOf,
  optional,
  text,
} from "./strict";
import type { Event } from "./types";

const identifier = (value: unknown): value is string =>
  text(value) && /^[A-Za-z0-9_.:@-]{1,400}$/.test(value);
const diagnostic = {
  kind: optional(text),
  agent: optional(nullable(text)),
  core_sequence: optional(nullable(integer)),
};
function eventData(type: string, value: unknown) {
  if (["evidence", "final", "done"].includes(type)) return validResult(value);
  if (type === "delta") return exact(value, { text, ...diagnostic });
  if (type === "error" || type === "cancelled")
    return exact(value, {
      message: optional(text),
      error: optional(text),
      code: optional(text),
    });
  return object(value);
}
export function validEvent(value: unknown): value is Event {
  if (!object(value)) return false;
  if (value.type === "run_reused")
    return exact(value, {
      type: oneOf("run_reused"),
      data: (v): v is unknown =>
        exact(v, {
          run_id: identifier,
          session_id: identifier,
          status: oneOf(
            "running",
            "complete",
            "done",
            "failed",
            "error",
            "cancelled",
          ),
        }),
    });
  if (
    !value.run_id &&
    (value.type === "resync_required" || value.type === "error")
  )
    return exact(value, {
      type: oneOf("resync_required", "error"),
      data: (v): v is unknown =>
        exact(v, { message: text, code: optional(text) }),
    });
  return (
    exact(value, {
      type: oneOf(
        "started",
        "trace",
        "delta",
        "evidence",
        "final",
        "done",
        "cancelled",
        "error",
      ),
      event_id: identifier,
      run_id: identifier,
      session_id: identifier,
      sequence: (v): v is number => integer(v) && v > 0,
      created_at: optional((v): v is unknown => text(v) || integer(v)),
      data: object,
    }) && eventData(String(value.type), value.data)
  );
}
