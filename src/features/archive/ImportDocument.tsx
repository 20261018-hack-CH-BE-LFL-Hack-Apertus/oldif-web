"use client";
import { Button } from "oldif-web-ui-components";
import { useState } from "react";
import type { ArchiveCopy } from "./copy";
import type { detailCopy } from "./detailCopy";
import type { ArchiveState } from "./useArchive";
import s from "./ArchiveStyles.module.css";
export function ImportDocument({
  data,
  t,
  d,
}: {
  data: ArchiveState;
  t: ArchiveCopy;
  d: ReturnType<typeof detailCopy>;
}) {
  const [file, setFile] = useState<File>();
  const [licence, setLicence] = useState("");
  const [title, setTitle] = useState("");
  const [rights, setRights] = useState(false);
  return (
    <form
      className={`${s.panel} ${s.stack}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (file && rights) void data.upload(file, licence, title);
      }}
    >
      <h2>{t.upload}</h2>
      <p className={s.muted}>PDF · TXT · JSON · 16 MiB</p>
      <label className={s.field}>
        {t.document}
        <input
          type="file"
          accept=".pdf,.txt,.json"
          required
          disabled={data.busy}
          onChange={(e) => setFile(e.target.files?.[0])}
        />
      </label>
      <label className={s.field}>
        {d.documentTitle}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={240}
        />
      </label>
      <label className={s.field}>
        {t.licence}
        <input
          value={licence}
          required
          onChange={(e) => setLicence(e.target.value)}
          maxLength={1000}
        />
      </label>
      <label className={s.check}>
        <input
          type="checkbox"
          checked={rights}
          onChange={(e) => setRights(e.target.checked)}
        />
        {t.rights}
      </label>
      <Button
        variant="primary"
        type="submit"
        disabled={
          !data.ready || !file || !rights || !licence.trim() || data.busy
        }
      >
        {data.busy ? t.working : t.upload}
      </Button>
      {data.busy && <progress className={s.progress} aria-label={t.working} />}
    </form>
  );
}
