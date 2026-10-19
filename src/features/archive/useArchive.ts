"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, post } from "@/lib/api/client";
import type { Dataset, Language } from "@/lib/models/types";
import type { ArchiveDocument, DocumentDetail, PageAnnotation } from "./types";
import { asciiJson } from "./serialization";
import {
  acquisitionRecord,
  originalHash,
  type AcquisitionDraft,
} from "./acquisition";
import { validateArchiveResponse } from "@/lib/models/archiveValidation";
export function useArchive(language: Language) {
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [detail, setDetail] = useState<DocumentDetail>();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");
  const selection = useRef(0);
  const enrichmentIntent = useRef<
    { signature: string; key: string } | undefined
  >(undefined);
  const [enrichment, setEnrichment] = useState<{
    session_id: string;
    run_id: string;
  }>();
  const refresh = useCallback(async () => {
    const [docs, collections, auth] = await Promise.all([
      api<{ documents: ArchiveDocument[] }>("/documents"),
      api<{ datasets: Dataset[] }>("/datasets"),
      api<{ user: { id: string } }>("/auth/session"),
    ]);
    setDocuments(docs.documents);
    setDatasets(collections.datasets);
    setUserId(auth.user.id);
    setReady(true);
  }, []);
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, [refresh]);
  async function select(id: string) {
    setError("");
    const attempt = ++selection.current;
    try {
      const next = await api<DocumentDetail>(
        `/documents/${encodeURIComponent(id)}`,
      );
      if (attempt !== selection.current) return;
      setDetail(next);
      setPage(1);
      setEnrichment(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }
  async function action(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  async function upload(
    file: File,
    licence: string,
    title: string,
    rights: boolean,
    acquisition: AcquisitionDraft,
  ) {
    await action(async () => {
      if (file.size > 16 * 1024 * 1024)
        throw new Error("Maximum document size: 16 MiB");
      const media = file.name.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : file.name.toLowerCase().endsWith(".json")
          ? "application/json"
          : "text/plain";
      const hash = await originalHash(file);
      const response = await fetch("/api/documents", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": media,
          "X-Document-Filename": file.name.replace(/[^\x20-\x7E]/g, "_"),
          "X-Document-Metadata": asciiJson({
            title: title || undefined,
            licence,
            rights_confirmed: rights,
            acquisition: acquisitionRecord(acquisition, hash, licence),
          }),
        },
        body: file,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || `Import failed (${response.status})`);
      validateArchiveResponse("/documents", "POST", body);
      await refresh();
      await select(body.document.id);
    });
  }
  async function releaseAcquisition(
    acquisition: AcquisitionDraft,
    rights: string,
  ) {
    if (!detail) return;
    await action(async () => {
      await post(`/documents/${detail.document.id}/release`, {
        expected_version: detail.document.version,
        rights_confirmed: true,
        acquisition: acquisitionRecord(
          acquisition,
          detail.document.original_sha256,
          rights,
        ),
      });
      await refresh();
      await select(detail.document.id);
    });
  }
  async function review(
    decision: string,
    reason: string,
    annotation: PageAnnotation,
    updates?: { title: string; metadata: Record<string, string> },
  ) {
    if (!detail) return;
    await action(async () => {
      await post(`/documents/${detail.document.id}/review`, {
        expected_version: detail.document.version,
        decision,
        reason,
        annotations: [annotation],
        ...updates,
      });
      const current = page;
      await select(detail.document.id);
      setPage(current);
      await refresh();
    });
  }
  async function enrich(sourceId?: string) {
    if (!detail) return;
    const signature = JSON.stringify([
      detail.document.id,
      sourceId || page,
      language,
    ]);
    if (enrichmentIntent.current?.signature !== signature)
      enrichmentIntent.current = { signature, key: crypto.randomUUID() };
    await action(async () => {
      const result = await post<{ session_id: string; run_id: string }>(
        `/documents/${detail.document.id}/enrich`,
        {
          language,
          ...(sourceId ? { source_ids: [sourceId] } : { page_numbers: [page] }),
          provider_processing_confirmed: true,
          idempotency_key: enrichmentIntent.current!.key,
        },
      );
      setEnrichment(result);
    });
  }
  async function demo() {
    await action(async () => {
      await post("/auth/demo");
      await refresh();
    });
  }
  return {
    documents,
    datasets,
    detail,
    page,
    setPage,
    busy,
    error,
    ready,
    userId,
    refresh,
    select,
    upload,
    releaseAcquisition,
    review,
    enrich,
    enrichment,
    demo,
  };
}
export type ArchiveState = ReturnType<typeof useArchive>;
