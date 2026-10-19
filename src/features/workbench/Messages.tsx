import type { Copy } from "@/lib/i18n";
import type { Citation, Language, Run } from "@/lib/models/types";
import { Activity } from "./Activity";
import { AssertionProposals } from "./AssertionProposals";
import s from "./AppStyles.module.css";
import { ResultVerification } from "./ResultVerification";
import { Review } from "./Review";
import { workbenchCopy } from "./workbenchCopy";
export function Messages({
  runs,
  t,
  language,
  onCitation,
}: {
  runs: Run[];
  t: Copy;
  language: Language;
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
                    ? workbenchCopy[language].stopped
                    : run.result?.abstained
                      ? t.uncertain
                      : t.evidence}
            </span>
          </div>
          <Activity run={run} language={language} />
          {(run.result?.answer || run.text) && (
            <p className={s.answer}>{run.result?.answer ?? run.text}</p>
          )}
          {run.error && (
            <p role="alert" className={s.error}>
              {run.error}
            </p>
          )}
          <div className={s.citations}>
            {run.result?.citations?.map((citation, index) => (
              <button
                type="button"
                className={s.citation}
                key={citation.id ?? index}
                onClick={() => onCitation(citation)}
                title={t.selectSource}
              >
                ↗ {index + 1}.{" "}
                {citation.title ??
                  citation.source_id ??
                  citation.id ??
                  t.sourceLabel}
                {citation.page ? ` · p. ${citation.page}` : ""}
              </button>
            ))}
          </div>
          {run.result && (
            <>
              <ResultVerification result={run.result} language={language} />
              <AssertionProposals result={run.result} language={language} onCitation={onCitation} />
            </>
          )}
          {run.status === "done" && run.result && (
            <Review runId={run.id} version={run.result.review_version} t={t} />
          )}
        </article>
      ))}
    </>
  );
}
