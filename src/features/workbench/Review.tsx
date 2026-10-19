"use client";
import { useState } from "react";
import { post } from "@/lib/api/client";
import type { Copy } from "@/lib/i18n";
import s from "./AppStyles.module.css";
export function Review({
  runId,
  version = 1,
  t,
}: {
  runId: string;
  version?: number;
  t: Copy;
}) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(version);
  async function submit(decision: string) {
    setBusy(true);
    try {
      const result = await post<{ version?: number }>(
        `/runs/${encodeURIComponent(runId)}/review`,
        { decision, reason, expected_version: revision },
      );
      setRevision(result.version ?? revision + 1);
      setStatus(t.reviewSaved);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t.failed);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className={s.trace}>
      <summary>{t.review}</summary>
      <label className={s.field}>
        {t.reviewReason}
        <textarea
          className={s.input}
          value={reason}
          maxLength={2000}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <div className={s.commands}>
        <button
          type="button"
          className={s.button}
          disabled={busy || !reason.trim()}
          onClick={() => submit("accepted")}
        >
          {t.accept} ✓
        </button>
        <button
          type="button"
          className={s.button}
          disabled={busy || !reason.trim()}
          onClick={() => submit("rejected")}
        >
          {t.reject} ×
        </button>
      </div>
      {status && <output>{status}</output>}
    </details>
  );
}
