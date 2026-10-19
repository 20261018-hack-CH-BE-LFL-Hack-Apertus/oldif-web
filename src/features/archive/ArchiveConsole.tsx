"use client";
import { Button } from "oldif-web-ui-components";
import { Header } from "@/features/workbench/Header";
import { WorkspaceNavigation } from "@/features/navigation/WorkspaceNavigation";
import { usePreferences } from "@/hooks/usePreferences";
import { archiveCopy } from "./copy";
import { useArchive } from "./useArchive";
import { ImportDocument } from "./ImportDocument";
import { PageWorkspace } from "./PageWorkspace";
import { detailCopy } from "./detailCopy";
import { processingCopy } from "./processingCopy";
import { StructurePanel } from "./StructurePanel";
import { DiarizationPanel } from "./DiarizationPanel";
import { SourceExplorer } from "./SourceExplorer";
import s from "./ArchiveStyles.module.css";
export function ArchiveConsole({ path = "/archive" }: { path?: string }) {
  const prefs = usePreferences();
  const t = archiveCopy(prefs.language);
  const data = useArchive(prefs.language);
  const d = detailCopy(prefs.language);
  const processing = processingCopy(prefs.language);
  return (
    <main className={s.shell}>
      <Header prefs={prefs} workspace />
      <div className={s.layout}>
        <WorkspaceNavigation language={prefs.language} activePath={path} />
        <div className={s.content}>
          <header className={s.hero}>
            <div>
              <p>OLDIF / {t.document}</p>
              <h1>{t.title}</h1>
              <p>{t.intro}</p>
            </div>
            {!data.ready && (
              <Button variant="primary" onClick={data.demo}>
                {prefs.t.demo}
              </Button>
            )}
          </header>
          {data.error && (
            <p role="alert" className={s.error}>
              {data.error}
            </p>
          )}
          <div className={s.grid}>
            <ImportDocument data={data} t={t} d={d} />
            <section className={`${s.panel} ${s.stack}`}>
              <h2>
                {t.document} · {data.documents.length}
              </h2>
              <div className={s.list}>
                {data.documents.map((doc) => (
                  <button
                    type="button"
                    key={doc.id}
                    className={s.document}
                    aria-pressed={doc.id === data.detail?.document.id}
                    onClick={() => data.select(doc.id)}
                  >
                    <strong>{doc.title}</strong>
                    <span className={s.muted}>
                      {doc.page_count} {t.pages} · {doc.status} · {t.revision}{" "}
                      {doc.version}
                    </span>
                  </button>
                ))}
              </div>
              <h3>{t.collections}</h3>
              {data.datasets.map((dataset) => (
                <div key={dataset.id} className={s.row}>
                  <span>{dataset.name || dataset.title || dataset.id}</span>
                  {["json", "tsv"].map((format) => (
                    <a
                      key={format}
                      className={s.badge}
                      href={`/api/datasets/${encodeURIComponent(dataset.id)}/export?format=${format}`}
                      download
                    >
                      {format.toUpperCase()} ↓
                    </a>
                  ))}
                </div>
              ))}
            </section>
          </div>
          {path === "/data" && <SourceExplorer data={data} t={t} d={d} />}
          <PageWorkspace data={data} t={t} d={d} />
          {data.detail?.document.media_type === "application/pdf" && (
            <StructurePanel
              key={data.detail.document.id}
              data={data}
              t={processing}
            />
          )}
          <DiarizationPanel t={processing} ready={data.ready} />
        </div>
      </div>
    </main>
  );
}
