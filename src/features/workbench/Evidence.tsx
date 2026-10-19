import { EvidenceCard } from "oldif-web-ui-components";
import { safeUrl } from "@/lib/api/client";
import type { Copy } from "@/lib/i18n";
import type { Citation, Result } from "@/lib/models/types";
import s from "./AppStyles.module.css";
export function Evidence({
  citation,
  result,
  t,
}: {
  citation?: Citation;
  result?: Result;
  t: Copy;
}) {
  const url = safeUrl(citation?.url);
  return (
    <aside className={s.evidence} aria-label={t.evidence}>
      <div className={s.evidenceTitle}>
        <div>
          <span className={s.eyebrow}>DOSSIER</span>
          <h2>{t.evidence}</h2>
        </div>
        <span aria-hidden="true">↗</span>
      </div>
      {citation ? (
        <EvidenceCard
          title={
            citation.title ?? citation.source_id ?? citation.id ?? t.sourceLabel
          }
          sourceLabel={t.sourceLabel}
          quote={citation.quote ?? citation.text ?? t.selectSource}
          locator={
            citation.locator ??
            (citation.page ? `p. ${citation.page}` : undefined)
          }
          sourceUrl={url}
        />
      ) : (
        <div className={s.emptyEvidence}>
          <span className={s.brandMark} aria-hidden="true">
            ⌑
          </span>
          <p>{t.emptySources}</p>
        </div>
      )}
      {result?.entities?.length ? (
        <section>
          <h3>{t.entities}</h3>
          <div className={s.citations}>
            {result.entities.map((entity) => (
              <span key={JSON.stringify(entity)} className={s.badge}>
                {typeof entity === "string" ? entity : JSON.stringify(entity)}
              </span>
            ))}
          </div>
        </section>
      ) : null}
      {result?.timeline?.length ? (
        <section>
          <h3>{t.timeline}</h3>
          {result.timeline.map((item) => (
            <p key={JSON.stringify(item)} className={s.small}>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </p>
          ))}
        </section>
      ) : null}
      {result?.uncertainty != null && (
        <section>
          <h3>{t.review}</h3>
          <pre className={s.json}>
            {typeof result.uncertainty === "string"
              ? result.uncertainty
              : JSON.stringify(result.uncertainty, null, 2)}
          </pre>
        </section>
      )}
    </aside>
  );
}
