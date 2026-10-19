"use client";
import { useEffect, useRef, useState } from "react";
import { post } from "@/lib/api/client";
import type { PageStructure } from "./structureTypes";
export function usePageStructure(documentId: string, page: number) {
  const [structure, setStructure] = useState<PageStructure>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const path = `/documents/${encodeURIComponent(documentId)}/pages/${page}`;
  useEffect(() => {
    const attempt = ++generation.current;
    const controller = new AbortController();
    setStructure(undefined);
    setError("");
    setBusy(false);
    void fetch(`/api${path}/structure`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) return;
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || `Request failed (${response.status})`);
        if (attempt === generation.current) setStructure(body.structure);
      })
      .catch((e) => {
        if (!controller.signal.aborted && attempt === generation.current)
          setError(e.message);
      });
    return () => {
      generation.current++;
      controller.abort();
    };
  }, [path]);
  async function extract(ocr: boolean, language: string) {
    const attempt = generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await post<{ structure: PageStructure }>(
        `${path}/extract`,
        { ocr, language, local_processing_confirmed: true },
      );
      if (attempt === generation.current) setStructure(result.structure);
    } catch (e) {
      if (attempt === generation.current)
        setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      if (attempt === generation.current) setBusy(false);
    }
  }
  return { structure, error, busy, extract };
}
