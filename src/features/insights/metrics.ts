export type StoredRun = {
  id: string;
  run_id?: string;
  session_id: string;
  model: string;
  question: string;
  status: string;
  started_at?: number;
  finished_at?: number;
  version: number;
  result?: {
    answer?: string;
    citations?: Array<{
      source_id?: string;
      quote?: string;
      page?: number;
      title?: string;
    }>;
    abstained?: boolean;
    evidence_only?: boolean;
    interpretation_draft?: {
      answer?: string;
      human_reviewed?: boolean;
      state?: string;
    };
  };
  review?: { decision: string; reason?: string };
};
export type StoredEvent = {
  run_id?: string;
  type: string;
  data?: {
    kind?: string;
    data?: { usage?: { total_tokens?: number }; duration_ms?: number };
    usage?: { total_tokens?: number };
    duration_ms?: number;
  };
};
export function metrics(run: StoredRun, events: StoredEvent[]) {
  const selected = events.filter(
    (e) =>
      e.run_id === (run.run_id || run.id) && e.data?.kind === "model.completed",
  );
  const tokens = selected.reduce(
    (n, e) =>
      n +
      (e.data?.data?.usage?.total_tokens || e.data?.usage?.total_tokens || 0),
    0,
  );
  const milliseconds = selected.reduce(
    (n, e) => n + (e.data?.data?.duration_ms || e.data?.duration_ms || 0),
    0,
  );
  return {
    tokens: tokens || null,
    seconds:
      run.finished_at && run.started_at
        ? run.finished_at - run.started_at
        : milliseconds
          ? milliseconds / 1000
          : null,
    citations: run.result?.citations?.length || 0,
  };
}
