"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, post } from "@/lib/api/client";
import { reduceRun } from "@/lib/models/events";
import { defaultResearchModel } from "@/lib/models/modelSelection";
import {
  latestSequence,
  restoreRuns,
  type SessionSnapshot,
} from "@/lib/models/sessionSnapshot";
import type {
  Dataset,
  Language,
  Model,
  Run,
  Session,
} from "@/lib/models/types";
import { useRealtimeChannel } from "./useRealtimeChannel";
export function useResearch(language: Language) {
  const [models, setModels] = useState<Model[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [model, setModel] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");
  const loadGeneration = useRef(0);
  const pending = useRef<string | null>(null);
  const active = useRef<string | null>(null);
  const currentLanguage = useRef(language);
  currentLanguage.current = language;
  const refreshSessions = useCallback(async () => {
    const value = await api<{ sessions: Session[] }>("/sessions");
    setSessions(value.sessions ?? []);
  }, []);
  useEffect(() => {
    let alive = true;
    Promise.all([
      api<{ models: Model[]; default_model?: string }>("/models"),
      api<{ datasets: Dataset[] }>("/datasets"),
      api<{ sessions: Session[] }>("/sessions"),
      api<{ user: { id: string } }>("/auth/session"),
    ])
      .then(([m, d, s, auth]) => {
        if (!alive) return;
        setUserId(auth.user.id);
        setModels(m.models ?? []);
        setModel(defaultResearchModel(m.models ?? [], m.default_model));
        setDatasets(d.datasets ?? []);
        setSessions(s.sessions ?? []);
        setReady(true);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
      loadGeneration.current += 1;
    };
  }, []);
  const realtime = useRealtimeChannel((event) => {
    if (event.type === "error" && !event.run_id) {
      const message = String(event.data?.message ?? "Research request failed");
      setError(message);
      const failed = active.current;
      setRuns((previous) =>
        previous.map((run) =>
          run.id === failed ? { ...run, status: "error", error: message } : run,
        ),
      );
      pending.current = null;
      active.current = null;
      return;
    }
    if (event.type === "transcript") {
      setTranscript(String(event.data?.text ?? ""));
      return;
    }
    if (event.run_id && pending.current) {
      const temporary = pending.current;
      pending.current = null;
      active.current = event.run_id;
      setRuns((previous) =>
        previous.map((r) =>
          r.id === temporary ? { ...r, id: event.run_id as string } : r,
        ),
      );
    }
    if (event.run_id)
      setRuns((previous) => previous.map((r) => reduceRun(r, event)));
    if (["done", "cancelled", "error"].includes(event.type)) {
      active.current = null;
      void refreshSessions().catch((e) => setError(e.message));
    }
  });
  const { connected, connect } = realtime;
  async function ensureSession(title: string) {
    if (sessionId) {
      if (!connected) await connect(sessionId);
      return sessionId;
    }
    const value = await post<
      Session & { session_id?: string; session?: Session }
    >("/sessions", {
      title: title.slice(0, 120),
      language: currentLanguage.current,
    });
    const id = value.id ?? value.session_id ?? value.session?.id;
    if (!id) throw new Error("Session response has no identifier");
    setSessionId(id);
    await connect(id);
    return id;
  }
  async function send(message: string) {
    if (!message.trim()) return;
    setError("");
    try {
      await ensureSession(message);
      const running = active.current;
      if (running) {
        realtime.send({
          type: "steer",
          run_id: running,
          message,
          language,
          model,
          dataset_ids: selected,
        });
        setRuns((prev) =>
          prev.map((r) =>
            r.id === running
              ? { ...r, question: r.question + "\n↳ " + message }
              : r,
          ),
        );
        return;
      }
      const id = crypto.randomUUID();
      pending.current = id;
      active.current = id;
      setRuns((prev) => [
        ...prev,
        {
          id,
          question: message,
          text: "",
          traces: [],
          status: "running",
          startedAt: Date.now(),
        },
      ]);
      realtime.send({
        type: "message",
        message,
        model,
        language,
        dataset_ids: selected,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed");
    }
  }
  async function cancel() {
    const running = active.current;
    if (!running || !sessionId) return;
    try {
      await connect(sessionId);
      if (active.current === running)
        realtime.send({ type: "cancel", run_id: running });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Cancellation failed");
    }
  }
  function newSession() {
    loadGeneration.current += 1;
    realtime.close();
    setSessionId("");
    setRuns([]);
    pending.current = null;
    active.current = null;
    setTranscript("");
  }
  async function loadSession(id: string) {
    newSession();
    const generation = loadGeneration.current;
    try {
      const data = await api<SessionSnapshot>(
        `/sessions/${encodeURIComponent(id)}`,
      );
      if (generation !== loadGeneration.current) return;
      const restored = restoreRuns(data);
      setSessionId(id);
      setRuns(restored);
      active.current =
        restored.find((run) => run.status === "running")?.id ?? null;
      await connect(id, latestSequence(data.events));
    } catch (error) {
      if (generation === loadGeneration.current)
        setError(
          error instanceof Error
            ? error.message
            : "Session could not be loaded",
        );
    }
  }
  return {
    userId,
    models,
    datasets,
    sessions,
    runs,
    model,
    setModel,
    selected,
    setSelected,
    sessionId,
    connected,
    error,
    setError,
    transcript,
    setTranscript,
    ready,
    send,
    cancel,
    newSession,
    loadSession,
    running: runs.some((r) => r.status === "running"),
  };
}
