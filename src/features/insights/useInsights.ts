"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, post } from "@/lib/api/client";
import { benchmarkModels } from "@/lib/models/modelSelection";
import type { Language, Model } from "@/lib/models/types";
import type { StoredEvent, StoredRun } from "./metrics";
export function useInsights(language: Language) {
  const [runs, setRuns] = useState<StoredRun[]>([]);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const generation = useRef(0);
  const activeRef = useRef<string[]>([]);
  const refresh = useCallback(async () => {
    const list = await api<{ sessions: { id: string }[] }>("/sessions");
    const requested = new URL(window.location.href).searchParams.get("session");
    const selected =
      requested && /^[0-9a-f-]{36}$/.test(requested) ? requested : null;
    const ids = [
      ...new Set([
        ...(selected ? [selected] : []),
        ...list.sessions.slice(0, 20).map((row) => row.id),
      ]),
    ];
    const sessions = await Promise.all(
      ids
        .map((id) => ({ id }))
        .map((row) =>
          api<{ runs: StoredRun[]; events: StoredEvent[] }>(
            `/sessions/${row.id}`,
          ),
        ),
    );
    setRuns(sessions.flatMap((x) => x.runs || []));
    setEvents(sessions.flatMap((x) => x.events || []));
    setReady(true);
  }, []);
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
    return () => {
      generation.current++;
    };
  }, [refresh]);
  useEffect(() => {
    if (
      !runs.some(
        (run) => !["complete", "failed", "cancelled"].includes(run.status),
      )
    )
      return;
    const timer = window.setInterval(() => {
      void refresh().catch((e) => setError(e.message));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [runs, refresh]);
  async function demo() {
    try {
      await post("/auth/demo");
      await refresh();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  }
  async function reload() {
    try {
      await refresh();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    }
  }
  async function compare(question: string) {
    setError("");
    const attempt = ++generation.current;
    setActive(["starting"]);
    try {
      const catalog = await api<{ models: Model[]; default_model?: string }>(
        "/models",
      );
      for (const model of benchmarkModels(
        catalog.models,
        catalog.default_model,
      )) {
        if (attempt !== generation.current) break;
        const created = await post<{ run_id: string; session_id: string }>(
          "/runs",
          { message: question, model, language, dataset_ids: [] },
        );
        if (attempt !== generation.current) {
          await post(`/runs/${created.run_id}/cancel`);
          break;
        }
        activeRef.current = [created.run_id];
        setActive([created.run_id]);
        const deadline = Date.now() + 180000;
        while (attempt === generation.current) {
          const session = await api<{
            runs: StoredRun[];
            events: StoredEvent[];
          }>(`/sessions/${created.session_id}`);
          setRuns((previous) => [
            ...previous.filter((r) => r.session_id !== created.session_id),
            ...session.runs,
          ]);
          setEvents((previous) => [
            ...previous.filter((e) => e.run_id !== created.run_id),
            ...session.events,
          ]);
          const run = session.runs.find(
            (r) => (r.run_id || r.id) === created.run_id,
          );
          if (run && ["complete", "failed", "cancelled"].includes(run.status)) {
            activeRef.current = [];
            break;
          }
          if (Date.now() > deadline)
            throw new Error(
              "Comparison exceeded the three-minute wait. Use Cancel to stop the active run, or refresh Results.",
            );
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      if (attempt === generation.current) setActive(activeRef.current);
    }
  }
  async function cancel() {
    generation.current++;
    try {
      await Promise.all(
        activeRef.current.map((id) => post(`/runs/${id}/cancel`)),
      );
      setActive([]);
      activeRef.current = [];
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed");
    }
  }
  return {
    runs,
    events,
    ready,
    error,
    active,
    refresh,
    reload,
    demo,
    compare,
    cancel,
  };
}
