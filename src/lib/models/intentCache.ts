import type { ResearchIntent } from "./researchIntent";
import { bool, exact, list, oneOf, optional, text } from "./strict";

type Cached = { intent: ResearchIntent; session_id?: string };
const key = (user: string) =>
  `oldif.pending-intents.v1:${encodeURIComponent(user)}`;
function valid(value: unknown): value is Cached {
  return exact(value, {
    session_id: optional(text),
    intent: (v): v is unknown =>
      exact(v, {
        type: oneOf("message"),
        message: text,
        model: text,
        language: oneOf("en", "es", "de", "de-CH", "fr", "it", "rm"),
        dataset_ids: list(text),
        idempotency_key: text,
        provider_processing_confirmed: bool,
      }),
  });
}
function read(user: string): Cached[] {
  if (!user) return [];
  try {
    const rows = JSON.parse(localStorage.getItem(key(user)) ?? "[]");
    return Array.isArray(rows) ? rows.filter(valid) : [];
  } catch {
    return [];
  }
}
function write(user: string, rows: Cached[]) {
  try {
    if (user) localStorage.setItem(key(user), JSON.stringify(rows));
  } catch {
    /* Draft UI separately reports unavailable browser storage. */
  }
}
const fingerprint = (intent: ResearchIntent) =>
  JSON.stringify({ ...intent, idempotency_key: undefined });
export function cachedIntent(user: string, candidate: ResearchIntent): Cached {
  const rows = read(user);
  const existing = rows.find(
    (row) => fingerprint(row.intent) === fingerprint(candidate),
  );
  if (existing) return existing;
  const row = { intent: candidate };
  write(user, [...rows, row]);
  return row;
}
export function cacheIntentSession(
  user: string,
  intent: ResearchIntent,
  session: string,
) {
  write(
    user,
    read(user).map((row) =>
      row.intent.idempotency_key === intent.idempotency_key
        ? { ...row, session_id: session }
        : row,
    ),
  );
}
export function forgetIntent(user: string, id: string) {
  write(
    user,
    read(user).filter((row) => row.intent.idempotency_key !== id),
  );
}
