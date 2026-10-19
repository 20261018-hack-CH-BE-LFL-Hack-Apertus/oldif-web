import type { Copy } from "@/lib/i18n";
import type { Citation, Run } from "@/lib/models/types";
import s from "./AppStyles.module.css";
import { Review } from "./Review";
export function Messages({
  runs,
  t,
  onCitation,
}: {
  runs: Run[];
  t: Copy;
  onCitation: (citation: Citation) => void;
}) {
  return (
    <>
      {runs.map((run) => (
        <article key={run.id} className={s.message}>
          <div className={s.question}>{run.question}</div>
          <div className={s.answerHead}>
            <span className={s.brandMark} aria-hidden="true">
              o.
            </span>
            Oldif{" "}
            <span className={s.badge}>
              {run.status === "running"
                ? t.working
                : run.status === "error"
                  ? t.failed
                  : run.status === "cancelled"
                    ? t.cancel
                    : t.evidence}
            </span>
          </div>
          {run.traces.length > 0 && (
            <details className={s.trace} open={run.status === "running"}>
              <summary>
                {t.trace} · {run.traces.length}
              </summary>
              {run.traces.map((trace) => (
                <div
                  className={s.traceRow}
                  key={String(trace.sequence ?? JSON.stringify(trace))}
                >
                  <strong>{trace.agent ?? trace.kind ?? "Oldif"}</strong>
                  <span>{trace.message ?? trace.kind}</span>
                  <details>
                    <summary>JSON</summary>
                    <pre>{JSON.stringify(trace, null, 2)}</pre>
                  </details>
                </div>
              ))}
            </details>
          )}
          <p className={s.answer}>{run.result?.answer ?? run.text}</p>
          {run.error && (
            <p role="alert" className={s.error}>
              {run.error}
            </p>
          )}
          <div className={s.citations}>
            {run.result?.citations?.map((c, index) => (
              <button
                type="button"
                className={s.citation}
                key={c.id ?? index}
                onClick={() => onCitation(c)}
                title={t.selectSource}
              >
                ↗ {index + 1}. {c.title ?? c.source_id ?? c.id ?? t.sourceLabel}
                {c.page ? ` · p. ${c.page}` : ""}
              </button>
            ))}
          </div>
          {run.result?.verification != null && (
            <details className={s.trace}>
              <summary>{t.review}</summary>
              <pre>{JSON.stringify(run.result.verification, null, 2)}</pre>
            </details>
          )}
          {run.status === "done" && run.result && (
            <Review runId={run.id} version={run.result.review_version} t={t} />
          )}
        </article>
      ))}
    </>
  );
}
