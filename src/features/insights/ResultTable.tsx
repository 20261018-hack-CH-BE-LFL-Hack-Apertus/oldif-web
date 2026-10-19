import { useEffect, useState } from "react";
import { Button } from "oldif-web-ui-components";
import { post } from "@/lib/api/client";
import { metrics, type StoredRun, type StoredEvent } from "./metrics";
import type { InsightsCopy } from "./copy";
import s from "@/features/archive/ArchiveStyles.module.css";
export function ResultTable({
  runs,
  events,
  t,
  refresh,
}: {
  runs: StoredRun[];
  events: StoredEvent[];
  t: InsightsCopy;
  refresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<StoredRun>();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setSelected((previous) =>
      previous ? runs.find((run) => run.id === previous.id) : undefined,
    );
  }, [runs]);
  async function review(decision: string) {
    if (!selected) return;
    try {
      await post(`/runs/${selected.run_id || selected.id}/review`, {
        decision,
        reason,
        expected_version: selected.version,
      });
      await refresh();
      setSelected(undefined);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    }
  }
  return (
    <section className={`${s.panel} ${s.stack}`}>
      <div className={s.row}>
        <h2>{t.results}</h2>
        <a className={s.badge} href="/api/export?format=json" download>
          JSON ↓
        </a>
        <a className={s.badge} href="/api/export?format=tsv" download>
          TSV ↓
        </a>
      </div>
      {!runs.length ? (
        <p>{t.empty}</p>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {[
                  t.question,
                  t.model,
                  t.status,
                  t.citations,
                  t.seconds,
                  t.tokens,
                ].map((title) => (
                  <th key={title}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const m = metrics(run, events);
                return (
                  <tr key={run.id}>
                    <td>
                      <button
                        className={s.document}
                        type="button"
                        onClick={() => {
                          setSelected(run);
                          setReason("");
                        }}
                      >
                        {run.question}
                      </button>
                    </td>
                    <td>{run.model}</td>
                    <td>
                      {run.status}
                      <br />
                      {run.review?.decision || "—"}
                    </td>
                    <td>{m.citations}</td>
                    <td>{m.seconds?.toFixed(1) || "—"}</td>
                    <td>{m.tokens ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <section className={`${s.panel} ${s.stack}`}>
          <h3>{selected.question}</h3>
          <p>{selected.result?.answer || selected.status}</p>
          {selected.result?.citations?.map((c, i) => (
            <blockquote key={`${c.source_id}-${i}`}>
              <p>{c.quote}</p>
              <cite>
                {c.title || c.source_id} {c.page ? `· p. ${c.page}` : ""}
              </cite>
            </blockquote>
          ))}
          {selected.result?.interpretation_draft?.answer && (
            <details>
              <summary>{t.draft}</summary>
              <p className={s.warning}>{t.draftLimit}</p>
              <p>{selected.result.interpretation_draft.answer}</p>
            </details>
          )}
          <p className={s.warning}>{t.limit}</p>
          {selected.status === "complete" && (
            <>
              <label className={s.field}>
                {t.status}
                <input
                  value={reason}
                  required
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={4000}
                />
              </label>
              <div className={s.row}>
                <Button
                  disabled={!reason.trim()}
                  aria-label={t.accept}
                  onClick={() => review("accepted")}
                >
                  {t.accept}
                </Button>
                <Button
                  disabled={!reason.trim()}
                  aria-label={t.reject}
                  onClick={() => review("rejected")}
                >
                  {t.reject}
                </Button>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
        </section>
      )}
    </section>
  );
}
