"use client";
import Link from "next/link";
import { Button, PanelFrame, SplitPane } from "oldif-web-ui-components";
import { useEffect, useState } from "react";
import type { ArchiveCopy } from "./copy";
import { PageReview } from "./PageReview";
import type { ArchiveState } from "./useArchive";
import type { detailCopy } from "./detailCopy";
import { useArchiveLayout } from "./useArchiveLayout";
import { LayoutSyncStatus } from "@/features/preferences/LayoutSyncStatus";
import type { Language } from "@/lib/models/types";
import { acquisitionCopy } from "./acquisitionCopy";
import s from "./ArchiveStyles.module.css";
export function PageWorkspace({
  data,
  t,
  d,
  language,
}: {
  data: ArchiveState;
  t: ArchiveCopy;
  d: ReturnType<typeof detailCopy>;
  language: Language;
}) {
  const settings = useArchiveLayout(data.userId);
  const { layout, change, reset } = settings;
  const a = acquisitionCopy(language);
  const [consent, setConsent] = useState(false);
  const [failed, setFailed] = useState("");
  const documentId = data.detail?.document.id;
  useEffect(() => {
    setConsent(false);
  }, [documentId, data.page]);
  const detail = data.detail;
  if (!detail)
    return (
      <section className={s.panel}>
        <p>{t.empty}</p>
      </section>
    );
  const doc = detail.document;
  const exportAllowed =
    doc.acquisition?.allowed_uses?.includes("private_export") === true;
  const providerAllowed =
    doc.acquisition?.allowed_uses?.includes("provider_processing") === true;
  const source = detail.pages.find((p) => p.page === data.page);
  const path = `/api/documents/${doc.id}`;
  const preview = `${path}/pages/${data.page}/preview`;
  const left = (
    <PanelFrame
      title={t.source}
      closeLabel={d.close}
      onClose={() => change({ source: false })}
    >
      <div className={s.scroll}>
        {doc.media_type === "application/pdf" && failed !== preview ? (
          <img
            className={s.pageImage}
            src={preview}
            alt={`${t.source} ${data.page}`}
            onError={() => setFailed(preview)}
          />
        ) : (
          <p>{t.preview}</p>
        )}
      </div>
    </PanelFrame>
  );
  const transcript = (
    <PanelFrame title={t.text}>
      <div className={s.scroll}>
        <pre className={s.text}>{source?.text || t.unknown}</pre>
      </div>
    </PanelFrame>
  );
  const annotation = (
    <PanelFrame
      title={t.review}
      closeLabel={d.close}
      onClose={() => change({ review: false })}
    >
      <div className={s.scroll}>
        <PageReview data={data} t={t} d={d} />
      </div>
    </PanelFrame>
  );
  const right = layout.review ? (
    <SplitPane
      direction="vertical"
      value={layout.height}
      onChange={(height) => change({ height })}
      min={25}
      max={75}
      label={t.review}
      first={transcript}
      second={annotation}
    />
  ) : (
    transcript
  );
  return (
    <section className={s.stack}>
      <div className={`${s.panel} ${s.stack}`}>
        <div className={s.row}>
          <h2>{doc.title}</h2>
          <span className={s.badge}>
            {t.revision} {doc.version}
          </span>
          <span className={s.badge}>{doc.status}</span>
        </div>
        <div className={s.row}>
          <Button
            disabled={data.page <= 1}
            onClick={() => data.setPage(data.page - 1)}
            aria-label={d.previous}
          >
            ←
          </Button>
          <label>
            {t.pages}{" "}
            <select
              value={data.page}
              onChange={(e) => data.setPage(Number(e.target.value))}
            >
              {detail.pages.map((p) => (
                <option key={p.id} value={p.page}>
                  {p.page} / {doc.page_count}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={data.page >= doc.page_count}
            onClick={() => data.setPage(data.page + 1)}
            aria-label={d.next}
          >
            →
          </Button>
          <a className={s.link} href={`${path}/original`} download>
            {t.download} ↗
          </a>
        </div>
        <p className={s.warning}>{t.caution}</p>
      </div>
      <div className={s.row} role="group" aria-label={d.layout}>
        {!layout.source && (
          <Button onClick={() => change({ source: true })}>
            {d.showSource}
          </Button>
        )}
        {!layout.review && (
          <Button onClick={() => change({ review: true })}>
            {d.showReview}
          </Button>
        )}
        <Button onClick={() => change({ reverse: !layout.reverse })}>
          {d.swap}
        </Button>
        <Button onClick={reset}>{d.reset}</Button>
      </div>
      <LayoutSyncStatus settings={settings} language={language} />
      <div className={s.viewer}>
        {layout.source ? (
          <SplitPane
            direction="horizontal"
            value={layout.width}
            onChange={(width) => change({ width })}
            min={25}
            max={70}
            label={t.source}
            first={layout.reverse ? right : left}
            second={layout.reverse ? left : right}
          />
        ) : (
          right
        )}
      </div>
      <div className={s.grid}>
        <section className={`${s.panel} ${s.stack}`}>
          <h2>{t.provenance}</h2>
          {doc.title_method && (
            <p>
              {a.titleOrigin}: {a[doc.title_method]}
            </p>
          )}
          <p className={s.hash}>SHA-256 · {doc.original_sha256}</p>
          <p className={s.hash}>
            {t.text} · {source?.text_sha256}
          </p>
          <div className={s.row}>
            <span className={s.badge}>
              {source?.flags.empty_text ? d.emptyText : d.extracted}
            </span>
            {source?.flags.illegibility_suspected === true && (
              <span className={s.badge}>{d.suspect}</span>
            )}
            <span className={s.badge}>
              {t.handwriting}: {t.unknown}
            </span>
          </div>
          <p>{d.physical}</p>
          <p className={s.muted}>
            {t.revision}: {detail.revisions?.length || 0}
          </p>
        </section>
        <section className={`${s.panel} ${s.stack}`}>
          <h2>{t.exports}</h2>
          <div className={s.row}>
            {exportAllowed &&
              ["json", "jsonl", "tsv", "csv", "manifest"].map((format) => (
                <a
                  key={format}
                  className={s.badge}
                  href={`${path}/export?format=${format}`}
                  download
                >
                  {format.toUpperCase()} ↓
                </a>
              ))}
          </div>
          {!exportAllowed && (
            <p className={s.muted}>
              {a.private_export}: {a.blocked}
            </p>
          )}
          {!providerAllowed && (
            <p className={s.muted}>
              {a.provider_processing}: {a.blocked}
            </p>
          )}
          <label className={s.check}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {t.consent}
          </label>
          <Button
            disabled={
              !consent || data.busy || !source?.text || !providerAllowed
            }
            onClick={() => data.enrich()}
          >
            {t.enrich}
          </Button>
          {data.enrichment && (
            <Link
              className={s.link}
              href={`/results?session=${data.enrichment.session_id}`}
            >
              {t.inspect} → {data.enrichment.run_id.slice(0, 8)}
            </Link>
          )}
        </section>
      </div>
    </section>
  );
}
