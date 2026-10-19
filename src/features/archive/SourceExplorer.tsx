"use client";
import { useState } from "react";
import { Button } from "oldif-web-ui-components";
import { api } from "@/lib/api/client";
import type { ArchiveState } from "./useArchive";
import type { ArchiveCopy } from "./copy";
import type { detailCopy } from "./detailCopy";
import s from "./ArchiveStyles.module.css";
type Source = {
  id: string;
  title: string;
  text: string;
  sha256: string;
  text_sha256?: string;
  page?: number;
  licence?: string;
  dataset_id?: string;
};
export function SourceExplorer({
  data,
  t,
  d,
}: {
  data: ArchiveState;
  t: ArchiveCopy;
  d: ReturnType<typeof detailCopy>;
}) {
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState<Source>();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dataset, setDataset] = useState("");
  async function load() {
    setBusy(true);
    setError("");
    setSelected(undefined);
    try {
      const path = dataset
        ? `/datasets/${encodeURIComponent(dataset)}/sources`
        : `/search?q=${encodeURIComponent(query)}`;
      const result = await api<{ sources: Source[] }>(path);
      const needle = query.toLocaleLowerCase();
      setSources(
        dataset
          ? result.sources.filter((row) =>
              `${row.title} ${row.text}`.toLocaleLowerCase().includes(needle),
            )
          : result.sources,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Source lookup failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={`${s.panel} ${s.stack}`}>
      <h2>{d.inspect}</h2>
      <form
        className={s.grid}
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label className={s.field}>
          {t.collections}
          <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
            <option value="">{d.search}</option>
            {data.datasets.map((value) => (
              <option key={value.id} value={value.id}>
                {value.name || value.title || value.id}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          {d.search}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={8000}
          />
        </label>
        <Button type="submit" disabled={!data.ready || busy}>
          {busy ? t.working : d.inspect}
        </Button>
      </form>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      <div className={s.grid}>
        <div className={s.list}>
          {sources.map((source) => (
            <button
              className={s.document}
              key={source.id}
              type="button"
              aria-pressed={selected?.id === source.id}
              onClick={() => setSelected(source)}
            >
              <strong>{source.title}</strong>
              <span>
                {source.id}
                {source.page ? ` · ${t.pages} ${source.page}` : ""}
              </span>
            </button>
          ))}
        </div>
        {selected && (
          <article className={s.stack}>
            <h3>{selected.title}</h3>
            <p>
              {d.sourceId}: {selected.id}
            </p>
            <p>
              {t.licence}: {selected.licence || t.unknown}
            </p>
            <p className={s.hash}>SHA-256 · {selected.sha256}</p>
            <pre className={s.text}>{selected.text}</pre>
          </article>
        )}
      </div>
    </section>
  );
}
