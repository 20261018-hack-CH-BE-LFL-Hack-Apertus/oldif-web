import type { Language, Result } from "@/lib/models/types";
import s from "./ActivityStyles.module.css";
import { workbenchCopy } from "./workbenchCopy";
export function ResultVerification({
  result,
  language,
}: {
  result: Result;
  language: Language;
}) {
  const t = workbenchCopy[language];
  return (
    <div className={s.verification}>
      <p>
        {result.evidence_only || result.interpretation_status === "needs_review"
          ? t.evidenceOnly
          : t.unreviewed}
      </p>
      {result.interpretation_draft?.answer && (
        <details>
          <summary>{t.draft}</summary>
          <p>{result.interpretation_draft.answer}</p>
          <p>{t.unreviewed}</p>
        </details>
      )}
      {result.verification != null && (
        <details className={s.technical}>
          <summary>
            {t.technical} · {t.verification}
          </summary>
          <pre>{JSON.stringify(result.verification, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
