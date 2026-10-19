import type { Assertion, Citation, Language, Result } from "@/lib/models/types";
import s from "./AssertionProposals.module.css";
import { assertionCopy } from "./assertionCopy";

type Props = {
  result: Result;
  language: Language;
  onCitation?: (citation: Citation) => void;
};
export function AssertionProposals({ result, language, onCitation }: Props) {
  const t = assertionCopy[language];
  if (!result.assertions?.length && !result.assertion_validation?.rejected)
    return null;
  return (
    <section className={s.proposals} aria-label={t.heading}>
      <h3>{t.heading}</h3>
      <p>{t.notice}</p>
      {result.assertions?.map((assertion) => (
        <AssertionCard
          key={assertion.assertion_id}
          assertion={assertion}
          language={language}
          onCitation={onCitation}
        />
      ))}
      {!!result.assertion_validation?.rejected && (
        <p>
          {t.rejected}: {result.assertion_validation.rejected}
        </p>
      )}
    </section>
  );
}
function AssertionCard({
  assertion,
  language,
  onCitation,
}: {
  assertion: Assertion;
  language: Language;
  onCitation?: Props["onCitation"];
}) {
  const t = assertionCopy[language];
  return (
    <article
      className={s.card}
      data-assertion-state="proposed"
      data-conflict-group={assertion.conflict_group ?? undefined}
    >
      <h4>
        {t[assertion.kind]} · {assertion.subject}
      </h4>
      <p>{assertion.value}</p>
      {assertion.potential_conflict && (
        <p className={s.conflict}>{t.conflict}</p>
      )}
      <blockquote>{assertion.evidence.quote}</blockquote>
      <span>{assertion.source_id}</span>
      {onCitation && (
        <button type="button" onClick={() => onCitation(assertion.evidence)}>
          {t.source} ↗
        </button>
      )}
    </article>
  );
}
