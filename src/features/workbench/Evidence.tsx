import { EvidenceCard } from "oldif-web-ui-components";
import { safeUrl } from "@/lib/api/client";
import type { Copy } from "@/lib/i18n";
import type { Citation, Language, Result } from "@/lib/models/types";
import s from "./ActivityStyles.module.css";
import { workbenchCopy } from "./workbenchCopy";

function readable(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const label = [
    record.name,
    record.label,
    record.description,
    record.event,
    record.text,
  ].find((item) => typeof item === "string");
  if (typeof label !== "string") return undefined;
  return typeof record.date === "string" ? `${record.date} · ${label}` : label;
}
export function Evidence({
  citation,
  result,
  t,
  language,
}: {
  citation?: Citation;
  result?: Result;
  t: Copy;
  language: Language;
}) {
  const copy = workbenchCopy[language];
  const entities = result?.entities?.map(readable).filter(Boolean) ?? [];
  const timeline = result?.timeline?.map(readable).filter(Boolean) ?? [];
  const uncertainty = Array.isArray(result?.uncertainty)
    ? result.uncertainty.map(readable).filter(Boolean)
    : [readable(result?.uncertainty)].filter(Boolean);
  return (
    <div className={s.evidenceContent}>
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
          sourceUrl={safeUrl(citation.url)}
        />
      ) : (
        <p className={s.muted}>{t.emptySources}</p>
      )}
      {entities.length > 0 && (
        <section>
          <h3>{t.entities}</h3>
          <div className={s.evidenceItems}>
            {[...new Set(entities)].map((entity) => (
              <span key={entity} className={s.evidenceItem}>
                {entity}
              </span>
            ))}
          </div>
        </section>
      )}
      {timeline.length > 0 && (
        <section>
          <h3>{t.timeline}</h3>
          {[...new Set(timeline)].map((item) => (
            <p key={item}>{item}</p>
          ))}
        </section>
      )}
      {uncertainty.length > 0 && (
        <section>
          <h3>{t.review}</h3>
          {[...new Set(uncertainty)].map((item) => (
            <p key={item}>{item}</p>
          ))}
        </section>
      )}
      {result && (
        <details className={s.technical}>
          <summary>{copy.technical}</summary>
          <pre>
            {JSON.stringify(
              {
                citation,
                entities: result.entities,
                timeline: result.timeline,
                uncertainty: result.uncertainty,
              },
              null,
              2,
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
