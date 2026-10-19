export type Language = "en" | "es" | "de" | "de-CH" | "fr" | "it" | "rm";
export type Model = {
  id: string;
  name: string;
  available: boolean;
  capabilities?: string[];
};
export type Dataset = {
  kind?: string;
  document_id?: string;
  id: string;
  name?: string;
  title?: string;
  description?: string;
  records?: number;
  source_url?: string;
};
export type Citation = {
  id?: string;
  source_id?: string;
  title?: string;
  text?: string;
  quote?: string;
  url?: string;
  page?: number | null;
  sha256?: string;
  text_sha256?: string;
  char_start?: number;
  char_end?: number;
  licence?: string;
  dataset_id?: string;
  locator?: string;
};
export type Assertion = {
  assertion_id: string;
  kind: "title" | "date" | "entity" | "relation";
  subject: string;
  predicate: string;
  value: string;
  source_id: string;
  state: "proposed";
  human_reviewed: false;
  evidence: Citation;
  potential_conflict: boolean;
  conflict_group: string | null;
};
export type Result = {
  assertions?: Assertion[];
  assertion_validation?: {
    accepted: number;
    rejected: number;
    reasons: string[];
    policy: string;
  };
  abstained?: boolean;
  evidence_only?: boolean;
  interpretation_status?: string;
  interpretation_draft?: {
    answer?: string;
    entities?: unknown[];
    timeline?: unknown[];
    state?: string;
    human_reviewed?: boolean;
  };
  answer?: string;
  citations?: Citation[];
  entities?: unknown[];
  timeline?: unknown[];
  uncertainty?: unknown;
  verification?: unknown;
  review_version?: number;
  proposals?: unknown[];
};
export type Trace = {
  agent?: string;
  kind?: string;
  message?: string;
  [key: string]: unknown;
};
export type Run = {
  startedAt?: number;
  lastSequence?: number;
  eventIds?: string[];
  idempotencyKey?: string;
  id: string;
  question: string;
  text: string;
  traces: Trace[];
  result?: Result;
  status: "running" | "done" | "cancelled" | "error";
  error?: string;
};
export type Session = {
  id: string;
  title?: string;
  created_at?: string | number;
  messages?: unknown[];
  runs?: unknown[];
};
export type Event = {
  event_id?: string;
  created_at?: string | number;
  type: string;
  run_id?: string;
  session_id?: string;
  sequence?: number;
  data?: Record<string, unknown>;
};
