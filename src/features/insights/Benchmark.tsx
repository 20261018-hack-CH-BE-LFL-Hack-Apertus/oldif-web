"use client";
import { useEffect, useState } from "react";
import { Button } from "oldif-web-ui-components";
import type { InsightsCopy } from "./copy";
import type { useInsights } from "./useInsights";
import s from "@/features/archive/ArchiveStyles.module.css";
type Snapshot = {
  batch_id: string;
  source_artifact_sha256: string;
  models: {
    model: string;
    cases: number;
    reference_case_passes: number;
    abstentions: number;
    with_exact_quote: number;
    mean_seconds: number;
    tokens: number;
  }[];
};
export function Benchmark({
  t,
  data,
}: {
  t: InsightsCopy;
  data: ReturnType<typeof useInsights>;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [question, setQuestion] = useState(
    "In source stapfer-2027, quote the original words listing what children were intended to learn. Do not infer observed outcomes.",
  );
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/data/benchmark-reference.json")
      .then((response) => {
        if (!response.ok) throw new Error("Benchmark receipt unavailable");
        return response.json();
      })
      .then(setSnapshot)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className={s.stack}>
      <section className={`${s.panel} ${s.stack}`}>
        <h2>{t.historical}</h2>
        <p className={s.warning}>{t.referenceLimit}</p>
        {snapshot && (
          <>
            <p className={s.muted}>{snapshot.batch_id}</p>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    {[
                      t.model,
                      t.samples,
                      t.passes,
                      t.abstentions,
                      t.citations,
                      t.seconds,
                      t.tokens,
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshot.models.map((model) => (
                    <tr key={model.model}>
                      <td>{model.model}</td>
                      <td>{model.cases}</td>
                      <td>{model.reference_case_passes}</td>
                      <td>{model.abstentions}</td>
                      <td>{model.with_exact_quote}</td>
                      <td>{model.mean_seconds.toFixed(2)}</td>
                      <td>{model.tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a
              className={s.link}
              href="/data/benchmark-reference.json"
              download
            >
              JSON ↓
            </a>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </section>
      <form
        className={`${s.panel} ${s.stack}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (consent) void data.compare(question);
        }}
      >
        <label className={s.field}>
          {t.prompt}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            maxLength={4000}
          />
        </label>
        <label className={s.check}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          {t.consent}
        </label>
        <div className={s.row}>
          <Button
            variant="primary"
            type="submit"
            disabled={!data.ready || !consent || !!data.active.length}
          >
            {t.compare}
          </Button>
          {!!data.active.length && (
            <Button onClick={data.cancel}>{t.stop}</Button>
          )}
        </div>
        {!!data.active.length && (
          <progress className={s.progress} aria-label={t.compare} />
        )}
      </form>
    </section>
  );
}
