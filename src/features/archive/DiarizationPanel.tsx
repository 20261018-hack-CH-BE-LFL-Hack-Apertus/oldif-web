"use client";
import { useEffect, useState } from "react";
import { Button } from "oldif-web-ui-components";
import type { ProcessingCopy } from "./processingCopy";
import s from "./ArchiveStyles.module.css";
type Receipt = {
  status: string;
  model: string;
  model_sha256: string;
  input_sha256: string;
  speaker_count: number;
  audio_seconds: number;
  segments: Array<{ start: number; end: number; speaker: string }>;
};
export function DiarizationPanel({
  t,
  ready,
}: {
  t: ProcessingCopy;
  ready: boolean;
}) {
  const [file, setFile] = useState<File>();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt>();
  const [download, setDownload] = useState("");
  useEffect(() => {
    if (!receipt) {
      setDownload("");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(receipt, null, 2)], {
        type: "application/json",
      }),
    );
    setDownload(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);
  async function process() {
    if (!file || !consent) return;
    setError("");
    setReceipt(undefined);
    if (!file.name.toLowerCase().endsWith(".wav") || file.size > 2900000) {
      setError(t.fileError);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/diarization", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "audio/wav",
          "X-Local-Processing-Confirmed": "true",
        },
        body: file,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || `Processing failed (${response.status})`);
      setReceipt(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={`${s.panel} ${s.stack}`}>
      <h2>{t.audio}</h2>
      <p>{t.audioLimit}</p>
      <label className={s.field}>
        {t.file}
        <input
          type="file"
          accept="audio/wav,.wav"
          disabled={busy}
          onChange={(e) => {
            setFile(e.target.files?.[0]);
            setReceipt(undefined);
            setConsent(false);
            setError("");
          }}
        />
      </label>
      <label className={s.check}>
        <input
          type="checkbox"
          checked={consent}
          disabled={busy}
          onChange={(e) => setConsent(e.target.checked)}
        />
        {t.audioConsent}
      </label>
      <Button disabled={!ready || !file || !consent || busy} onClick={process}>
        {t.start}
      </Button>
      {busy && (
        <div role="status">
          <p>{t.pending}</p>
          <progress className={s.progress} aria-label={t.pending} />
        </div>
      )}
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {receipt && (
        <>
          <p>
            {receipt.model} · {receipt.speaker_count} ·{" "}
            {receipt.audio_seconds.toFixed(2)} s
          </p>
          <p className={s.hash}>SHA-256 · {receipt.input_sha256}</p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t.speaker}</th>
                  <th>{t.startTime}</th>
                  <th>{t.endTime}</th>
                </tr>
              </thead>
              <tbody>
                {receipt.segments.map((segment, i) => (
                  <tr key={`${segment.start}-${i}`}>
                    <td>{segment.speaker}</td>
                    <td>{segment.start.toFixed(2)}</td>
                    <td>{segment.end.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {download && (
            <a
              className={s.link}
              href={download}
              download="diarization-receipt.json"
            >
              {t.download} ↓
            </a>
          )}
        </>
      )}
    </section>
  );
}
