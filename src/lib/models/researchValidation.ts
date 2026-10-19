import { validEvent } from "./eventValidation";
import { validResult } from "./resultValidation";
import {
  bool,
  exact,
  integer,
  list,
  nullable,
  object,
  oneOf,
  optional as opt,
  requireValid,
  text,
  type Validator,
} from "./strict";

const timestamp = (v: unknown): v is unknown => text(v) || integer(v);
const record = { id: text, version: integer, created_at: timestamp };
const strings = list(text);
const maybeText = opt(nullable(text));
const session = (v: unknown): v is unknown =>
  exact(v, {
    ...record,
    title: text,
    language: text,
    model: opt(text),
    updated_at: timestamp,
  });
const user = (v: unknown): v is unknown =>
  exact(v, { id: text, name: text, email: nullable(text), demo: bool });
const observation = (v: unknown): v is unknown =>
  exact(v, {
    access: text,
    http_status: nullable(integer),
    observed_at: text,
    operation: text,
  });
const model = (v: unknown): v is unknown =>
  exact(v, {
    id: text,
    name: text,
    available: bool,
    capabilities: opt(strings),
    access: opt(text),
    challenge_model: opt(bool),
    configured: opt(bool),
    modality: opt(text),
    observation: opt(nullable(observation)),
    provider: opt(text),
    tools: opt(bool),
    unavailable_reason: maybeText,
  });
const dataset = (v: unknown): v is unknown =>
  exact(v, {
    ...record,
    name: text,
    title: opt(text),
    description: opt(text),
    record_count: integer,
    licence: text,
    kind: text,
    provenance: text,
    page_citations: opt(bool),
    document_id: opt(text),
    source_url: opt(text),
    source_sha256: opt(text),
    accepted_answer_rows: opt(integer),
    missing_answer_rows: opt(integer),
    rejected_rows: opt(
      list((v): v is unknown =>
        exact(v, {
          content_retained_in_original: bool,
          locator: text,
          question: text,
          reason: text,
          row: integer,
          row_sha256: text,
          source_sha256: text,
          transcription_id: text,
        }),
      ),
    ),
    import_manifest: opt(object),
  });
const review = (v: unknown): v is unknown =>
  exact(v, {
    decision: oneOf("accepted", "rejected"),
    reason: text,
    actor: text,
  });
const transformation = (v: unknown): v is unknown =>
  exact(v, {
    schema_version: oneOf("1.0"),
    operation: text,
    reason: text,
    actor: text,
    run_id: text,
    parent_revision: object,
    timestamp,
    timestamp_unit: oneOf("unix_seconds"),
    original: object,
    normalized: object,
  });
const run = (v: unknown): v is unknown =>
  exact(v, {
    ...record,
    run_id: text,
    request_id: opt(text),
    terminal_event_id: opt(text),
    transformation: opt(transformation),
    session_id: text,
    status: oneOf(
      "running",
      "complete",
      "done",
      "failed",
      "error",
      "cancelled",
    ),
    model: text,
    language: text,
    question: text,
    sources: list(object),
    started_at: timestamp,
    finished_at: opt(timestamp),
    result: opt(validResult),
    error: opt(text),
    error_code: opt(text),
    review: opt(review),
    idempotency_key: opt(text),
  });
const message = (v: unknown): v is unknown =>
  exact(v, {
    ...record,
    session_id: text,
    role: oneOf("user", "assistant"),
    content: text,
    run_id: text,
    result: opt(validResult),
  });
const snapshot = (v: unknown): v is unknown =>
  exact(v, {
    session,
    messages: list(message),
    runs: list(run),
    events: list(validEvent),
  });
function route(path: string, method: string): Validator | undefined {
  if (/^\/auth\/(session|demo|login|register)$/.test(path))
    return (v): v is unknown => exact(v, { user });
  if (path === "/auth/logout")
    return (v): v is unknown => exact(v, { ok: oneOf(true) });
  if (path === "/models")
    return (v): v is unknown =>
      exact(v, {
        models: list(model),
        data: opt(list(model)),
        default_model: opt(text),
        automatic_fallback: opt(bool),
      });
  if (path === "/datasets")
    return (v): v is unknown => exact(v, { datasets: list(dataset) });
  if (path === "/sessions")
    return method === "POST"
      ? (v): v is unknown => exact(v, { session })
      : (v): v is unknown => exact(v, { sessions: list(session) });
  if (/^\/sessions\/[^/]+$/.test(path)) return snapshot;
  if (/^\/runs\/[^/]+\/review$/.test(path)) return run;
  if (path === "/runs")
    return (v): v is unknown =>
      exact(v, {
        run_id: text,
        session_id: text,
        status: text,
        reused: opt(bool),
        idempotent_replay: opt(bool),
      });
}
export function validateResearchResponse(
  path: string,
  method: string,
  value: unknown,
) {
  const validate = route(path.split("?")[0], method);
  return validate ? requireValid(value, validate, "research API") : value;
}
