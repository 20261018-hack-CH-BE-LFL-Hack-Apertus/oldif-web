import type { ReportCopy } from "./copy";
import { evidence, referenceLinks } from "./data";
import s from "./styles";
export function Metrics({ copy }: { copy: ReportCopy }) {
  const items = [
    [evidence.dataset.records, copy.records],
    [evidence.public_checks.http_preflight_passed, copy.checks],
    [evidence.public_checks.provider_attempts, copy.runs],
    [7, copy.languages],
  ];
  return (
    <dl className={s.metrics}>
      {items.map(([n, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{n}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Provenance({ copy }: { copy: ReportCopy }) {
  const source = evidence.dataset;
  return (
    <div className={s.provenance}>
      <span className={s.eyebrow}>{copy.quoteLabel}</span>
      <blockquote lang="de">“{source.quote}”</blockquote>
      <p>{copy.intention}</p>
      <dl>
        <dt>{copy.original}</dt>
        <dd>
          {source.source_id} · {source.char_start}–{source.char_end}
        </dd>
        <dt>SHA-256 · text</dt>
        <dd>
          <code>{source.text_sha256}</code>
        </dd>
        <dt>SHA-256 · record</dt>
        <dd>
          <code>{source.record_sha256}</code>
        </dd>
      </dl>
      <small>{copy.notPage}</small>
    </div>
  );
}
export function Workflow({ copy }: { copy: ReportCopy }) {
  return (
    <ol className={s.workflow}>
      {copy.workflow.map((step, i) => (
        <li key={step}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
export function Architecture({ copy }: { copy: ReportCopy }) {
  return (
    <div className={s.architecture}>
      <ol>
        {copy.architecture.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <p>{copy.trust}</p>
    </div>
  );
}
function ComparisonHeader({ copy }: { copy: ReportCopy }) {
  return (
    <thead>
      <tr>
        {[copy.model, copy.completed, copy.referencePasses, copy.abstained].map(
          (label) => (
            <th key={label}>{label}</th>
          ),
        )}
      </tr>
    </thead>
  );
}
export function Comparison({ copy }: { copy: ReportCopy }) {
  return (
    <div className={s.comparison}>
      <p>{copy.comparison}</p>
      <table>
        <ComparisonHeader copy={copy} />
        <tbody>
          {evidence.reference_comparison.models.map((m) => (
            <tr key={m.model}>
              <th>{m.model}</th>
              <td>
                {m.completed}/{m.cases}
              </td>
              <td>
                {m.reference_case_passes}/{m.cases}
              </td>
              <td>{m.abstentions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.notice}>{copy.reviewNotice}</p>
    </div>
  );
}
export function References({ copy }: { copy: ReportCopy }) {
  return (
    <div className={s.references}>
      <h3>{copy.references}</h3>
      <ul>
        {referenceLinks.map((r) => (
          <li key={r.url}>
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              {r.title} ↗
            </a>
          </li>
        ))}
      </ul>
      <p>
        NVIDIA · Antonio Rueda-Toicen · Nemotron Agentic AI Challenge · Berlin,
        18 October 2026 · pp. 2, 5, 7
      </p>
      <p>
        <a href="/reports/evidence-snapshot.json" download>
          {copy.downloadEvidence} ↓
        </a>
      </p>
      <small>{evidence.source_receipts.join(" · ")}</small>
    </div>
  );
}
