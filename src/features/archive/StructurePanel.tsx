"use client";
import { useEffect, useState } from "react";
import { Button } from "oldif-web-ui-components";
import type { ProcessingCopy } from "./processingCopy";
import type { ArchiveState } from "./useArchive";
import { usePageStructure } from "./usePageStructure";
import s from "./ArchiveStyles.module.css";
export function StructurePanel({
  data,
  t,
}: {
  data: ArchiveState;
  t: ProcessingCopy;
}) {
  const doc = data.detail?.document;
  const extraction = usePageStructure(doc?.id || "", data.page);
  const [consent, setConsent] = useState(false);
  const [providerConsent, setProviderConsent] = useState(false);
  const [language, setLanguage] = useState("eng");
  const [overlay, setOverlay] = useState(false);
  useEffect(() => {
    setConsent(false);
    setProviderConsent(false);
  }, [doc?.id, data.page]);
  const structure = extraction.structure;
  if (!doc || doc.media_type !== "application/pdf") return null;
  return (
    <section className={`${s.panel} ${s.stack}`}>
      <h2>{t.structure}</h2>
      <p className={s.warning}>{t.limit}</p>
      <label className={s.check}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        {t.localConsent}
      </label>
      <div className={s.row}>
        <Button
          disabled={!consent || extraction.busy}
          onClick={() => extraction.extract(false, language)}
        >
          {t.layout}
        </Button>
        <label className={s.field}>
          {t.language}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="eng">English</option>
            <option value="deu">Deutsch</option>
            <option value="fra">Français</option>
            <option value="ita">Italiano</option>
          </select>
        </label>
        <Button
          disabled={!consent || extraction.busy}
          onClick={() => extraction.extract(true, language)}
        >
          {t.ocr}
        </Button>
      </div>
      {extraction.busy && (
        <div role="status">
          <p>{t.pending}</p>
          <progress className={s.progress} aria-label={t.pending} />
        </div>
      )}
      {extraction.error && (
        <p role="alert" className={s.error}>
          {extraction.error}
        </p>
      )}
      {!structure ? (
        <p className={s.muted}>{t.none}</p>
      ) : (
        <>
          <p className={s.hash}>
            {structure.method} · SHA-256 {structure.text_sha256}
          </p>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={overlay}
              onChange={(e) => setOverlay(e.target.checked)}
            />
            {t.geometry} ({structure.lines.length})
          </label>
          {overlay && (
            <svg
              className={s.geometry}
              role="img"
              aria-label={t.geometry}
              viewBox={`0 0 ${structure.dimensions.width} ${structure.dimensions.height}`}
            >
              <image
                href={`/api/documents/${encodeURIComponent(doc.id)}/pages/${data.page}/preview`}
                width={structure.dimensions.width}
                height={structure.dimensions.height}
              />
              {structure.lines.map((line, i) => (
                <rect
                  className={s.lineBox}
                  key={`${line.id}-${i}`}
                  x={line.bbox[0]}
                  y={line.bbox[1]}
                  width={Math.max(0, line.bbox[2] - line.bbox[0])}
                  height={Math.max(0, line.bbox[3] - line.bbox[1])}
                >
                  <title>{line.text}</title>
                </rect>
              ))}
            </svg>
          )}
          <details>
            <summary>{t.derived}</summary>
            <pre className={s.text}>{structure.text}</pre>
          </details>
          <h3>
            {t.review} · {structure.table_candidates.length}
          </h3>
          {structure.table_candidates.map((table, i) => (
            <div className={s.tableWrap} key={`table-${i}`}>
              <table className={s.table}>
                <caption>
                  {table.row_count} × {table.column_count} · {t.review}
                </caption>
                <tbody>
                  {table.rows.map((row, r) => (
                    <tr key={`${i}-${r}`}>
                      {row.map((cell, c) => (
                        <td key={`${i}-${r}-${c}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {structure.ocr_source_id && (
            <>
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={providerConsent}
                  onChange={(e) => setProviderConsent(e.target.checked)}
                />
                {t.providerConsent}
              </label>
              <Button
                disabled={!providerConsent || data.busy}
                onClick={() =>
                  data.enrich(structure.ocr_source_id || undefined)
                }
              >
                {t.enrich}
              </Button>
            </>
          )}
        </>
      )}
    </section>
  );
}
