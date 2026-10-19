"use client";
import { Button } from "oldif-web-ui-components";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { ArchiveCopy } from "./copy";
import type { ArchiveState } from "./useArchive";
import type { PageAnnotation } from "./types";
import { editableAnnotation, parseLabels } from "./serialization";
import type { detailCopy } from "./detailCopy";
import type { Language } from "@/lib/models/types";
import { uncertaintyCopy } from "./uncertaintyCopy";
import s from "./ArchiveStyles.module.css";
const empty = (page: number): PageAnnotation => ({
  page,
  labels: [],
  bias: "",
  missingness: "",
  handwriting_status: "unknown",
  legibility_status: "unknown",
  missing_page: false,
  reading_order_status: "unknown",
  note: "",
});
export function PageReview({
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
  const u = uncertaintyCopy(language);
  const [annotation, setAnnotation] = useState(empty(data.page));
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState("needs_review");
  const [error, setError] = useState("");
  const [labels, setLabels] = useState("");
  const [title, setTitle] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const id = data.detail?.document.id;
  useEffect(() => {
    setTitle(data.detail?.document.title || "");
    setMetadata(data.detail?.document.metadata || {});
  }, [data.detail]);
  useEffect(() => {
    let active = true;
    setAnnotation(empty(data.page));
    setLabels("");
    setError("");
    setReason("");
    setDecision("needs_review");
    if (id)
      void api<{ review?: PageAnnotation | null }>(
        `/documents/${id}/pages/${data.page}`,
      )
        .then((value) => {
          if (active && value.review) {
            setAnnotation({
              ...empty(data.page),
              ...editableAnnotation(value.review),
            });
            setLabels(value.review.labels.join(", "));
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [id, data.page]);
  const update = (key: keyof PageAnnotation, value: string) =>
    setAnnotation((previous) => ({ ...previous, [key]: value }));
  const unresolved =
    annotation.missing_page ||
    annotation.reading_order_status === "uncertain" ||
    ["illegible", "partially_legible"].includes(annotation.legibility_status);
  return (
    <form
      className={s.stack}
      onSubmit={(e) => {
        e.preventDefault();
        void data.review(
          unresolved && decision === "accepted" ? "needs_review" : decision,
          reason,
          { ...annotation, labels: parseLabels(labels) },
          { title, metadata },
        );
      }}
    >
      <h2>{t.review}</h2>
      <p className={s.muted}>
        {t.pages} {data.page}
      </p>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      <label className={s.field}>
        {t.labels}
        <input value={labels} onChange={(e) => setLabels(e.target.value)} />
      </label>
      <label className={s.field}>
        {t.handwriting}
        <select
          value={annotation.handwriting_status}
          onChange={(e) => update("handwriting_status", e.target.value)}
        >
          {["unknown", "printed", "handwritten", "mixed"].map((key) => (
            <option key={key} value={key}>
              {t[key as keyof ArchiveCopy]}
            </option>
          ))}
        </select>
      </label>
      <label className={s.field}>
        {t.legibility}
        <select
          value={annotation.legibility_status}
          onChange={(e) => update("legibility_status", e.target.value)}
        >
          {["unknown", "legible", "partially_legible", "illegible"].map(
            (key) => (
              <option key={key} value={key}>
                {t[key as keyof ArchiveCopy]}
              </option>
            ),
          )}
        </select>
      </label>
      <label className={s.field}>
        {t.bias}
        <textarea
          value={annotation.bias}
          onChange={(e) => update("bias", e.target.value)}
          maxLength={4000}
        />
      </label>
      <label className={s.check}>
        <input
          type="checkbox"
          checked={annotation.missing_page ?? false}
          onChange={(e) =>
            setAnnotation((previous) => ({
              ...previous,
              missing_page: e.target.checked,
            }))
          }
        />
        {u.missingPage}
      </label>
      <label className={s.field}>
        {u.readingOrder}
        <select
          value={annotation.reading_order_status ?? "unknown"}
          onChange={(e) => update("reading_order_status", e.target.value)}
        >
          {(["unknown", "verified", "uncertain"] as const).map((value) => (
            <option key={value} value={value}>
              {u[value]}
            </option>
          ))}
        </select>
      </label>
      {unresolved && (
        <p role="status" className={s.muted}>
          {u.reviewRequired}
        </p>
      )}
      <label className={s.field}>
        {t.missing}
        <textarea
          value={annotation.missingness}
          onChange={(e) => update("missingness", e.target.value)}
          maxLength={4000}
        />
      </label>
      <details>
        <summary>{d.metadata}</summary>
        <div className={s.stack}>
          <label className={s.field}>
            {d.documentTitle}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </label>
          {(["language", "date", "place", "description"] as const).map(
            (key) => (
              <label key={key} className={s.field}>
                {d[key]}
                <input
                  value={metadata[key] || ""}
                  maxLength={1000}
                  onChange={(e) =>
                    setMetadata((previous) => ({
                      ...previous,
                      [key]: e.target.value,
                    }))
                  }
                />
              </label>
            ),
          )}
        </div>
      </details>
      <label className={s.field}>
        {t.reason}
        <input
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={4000}
        />
      </label>
      <select
        aria-label={t.review}
        className={s.select}
        value={
          unresolved && decision === "accepted" ? "needs_review" : decision
        }
        onChange={(e) => setDecision(e.target.value)}
      >
        {["needs_review", "accepted", "rejected"].map((key) => (
          <option
            key={key}
            value={key}
            disabled={key === "accepted" && !!unresolved}
          >
            {t[key as keyof ArchiveCopy]}
          </option>
        ))}
      </select>
      <Button
        variant="primary"
        type="submit"
        disabled={data.busy || !reason.trim()}
      >
        {t.save}
      </Button>
    </form>
  );
}
