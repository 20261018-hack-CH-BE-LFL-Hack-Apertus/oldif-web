"use client";
import { useState } from "react";
import { Button } from "oldif-web-ui-components";
import { AcquisitionFields } from "./AcquisitionFields";
import { newAcquisition } from "./acquisition";
import type { acquisitionCopy } from "./acquisitionCopy";
import type { ArchiveCopy } from "./copy";
import type { ArchiveState } from "./useArchive";
import s from "./ArchiveStyles.module.css";
export function RightsReview({
  data,
  t,
  a,
}: {
  data: ArchiveState;
  t: ArchiveCopy;
  a: ReturnType<typeof acquisitionCopy>;
}) {
  const doc = data.detail!.document;
  const [acquisition, setAcquisition] = useState(() =>
    newAcquisition(doc.acquisition),
  );
  const [rightsIdentifier, setRightsIdentifier] = useState(
    doc.acquisition?.rights_identifier || doc.licence || "",
  );
  const [confirmed, setConfirmed] = useState(false);
  return (
    <form
      className={`${s.panel} ${s.stack}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (confirmed)
          void data.releaseAcquisition(acquisition, rightsIdentifier);
      }}
    >
      <h2>{doc.status === "quarantined" ? a.quarantine : a.permissions}</h2>
      <p>{doc.title}</p>
      <p className={s.warning}>
        {doc.status === "quarantined" ? a.retained : a.guidance}
      </p>
      <p className={s.hash}>SHA-256 · {doc.original_sha256}</p>
      <a
        className={s.link}
        href={`/api/documents/${encodeURIComponent(doc.id)}/original`}
        download
      >
        {t.download}
      </a>
      <label className={s.field}>
        {t.licence}
        <input
          value={rightsIdentifier}
          onChange={(event) => setRightsIdentifier(event.target.value)}
          required
          maxLength={200}
        />
      </label>
      <AcquisitionFields
        value={acquisition}
        change={setAcquisition}
        t={a}
        disabled={data.busy}
      />
      <label className={s.check}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        {t.rights}
      </label>
      <Button
        type="submit"
        variant="primary"
        disabled={
          !confirmed ||
          data.busy ||
          !rightsIdentifier.trim() ||
          !acquisition.dataset_uri ||
          !acquisition.distribution_uri ||
          !acquisition.allowed_uses.includes("local_processing")
        }
      >
        {data.busy ? t.working : a.release}
      </Button>
    </form>
  );
}
