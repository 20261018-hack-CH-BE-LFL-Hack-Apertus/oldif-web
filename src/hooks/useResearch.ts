"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, post } from "@/lib/api/client";
import { decodeEvent, reduceRun } from "@/lib/models/events";
import type {
  Dataset,
  Language,
  Model,
  Run,
  Session,
} from "@/lib/models/types";
export function useResearch(language: Language) {
  const [models, setModels] = useState<Model[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [model, setModel] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [ready, setReady] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const pending = useRef<string | null>(null);
  const lastSequence = useRef(0);
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
      api<{ models: Model[] }>("/models"),
      api<{ datasets: Dataset[] }>("/datasets"),
      api<{ sessions: Session[] }>("/sessions"),
      api("/auth/session"),
    ])
      .then(([m, d, s]) => {
        if (!alive) return;
        setModels(m.models ?? []);
        setModel(
          m.models?.find((x) => x.id === "apertus-v1-5-8b")?.id ??
            m.models?.find((x) => x.id.startsWith("apertus"))?.id ??
            "",
        );
        setDatasets(d.datasets ?? []);
        setSessions(s.sessions ?? []);
        setReady(true);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
      socket.current?.close();
    };
  }, []);
  const connect = useCallback(
    (id: string) =>
      new Promise<void>((resolve, reject) => {
        socket.current?.close();
        setConnected(false);
        const url = new URL("/api/realtime", location.href);
        url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(url);
        socket.current = ws;
        const timer = setTimeout(() => {
          ws.close();
          reject(new Error("Realtime connection timed out"));
        }, 10000);
        ws.onopen = () => {
          clearTimeout(timer);
          ws.send(
            JSON.stringify({
              type: "subscribe",
              session_id: id,
              after_sequence: lastSequence.current,
            }),
          );
          setConnected(true);
          resolve();
        };
        ws.onclose = () => {
          clearTimeout(timer);
          if (socket.current === ws) setConnected(false);
        };
        ws.onerror = () => {
          clearTimeout(timer);
          reject(new Error("Realtime connection failed"));
        };
        ws.onmessage = (message) => {
          const event = decodeEvent(String(message.data));
          if (!event) return;
          if (typeof event.sequence === "number") {
            if (event.sequence <= lastSequence.current) return;
            lastSequence.current = event.sequence;
          }
          if (event.type === "error" && !event.run_id) {
            const message = String(
              event.data?.message ?? "Research request failed",
            );
            setError(message);
            const failed = active.current;
            setRuns((previous) =>
              previous.map((run) =>
                run.id === failed
                  ? { ...run, status: "error", error: message }
                  : run,
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
        };
      }),
    [refreshSessions],
  );
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
        socket.current?.send(
          JSON.stringify({
            type: "steer",
            run_id: running,
            message,
            language,
            model,
            dataset_ids: selected,
          }),
        );
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
        { id, question: message, text: "", traces: [], status: "running" },
      ]);
      socket.current?.send(
        JSON.stringify({
          type: "message",
          message,
          model,
          language,
          dataset_ids: selected,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed");
    }
  }
  function cancel() {
    if (active.current) {
      socket.current?.send(
        JSON.stringify({ type: "cancel", run_id: active.current }),
      );
    }
  }
  function newSession() {
    socket.current?.close();
    setSessionId("");
    setRuns([]);
    setConnected(false);
    pending.current = null;
    active.current = null;
    lastSequence.current = 0;
    setTranscript("");
  }
  async function loadSession(id: string) {
    try {
      newSession();
      const value = await api<Session & { session?: Session }>(
        `/sessions/${encodeURIComponent(id)}`,
      );
      const data = value as unknown as {
        runs?: Array<Record<string, unknown>>;
        messages?: Array<Record<string, unknown>>;
        events?: Array<{
          type: string;
          run_id: string;
          data: Record<string, unknown>;
          sequence?: number;
        }>;
      };
      setSessionId(id);
      lastSequence.current = Math.max(
        0,
        ...(data.events ?? []).map((event) => event.sequence ?? 0),
      );
      const loaded = data.runs ?? [];
      const messages = data.messages ?? [];
      const restored: Run[] = loaded.map((r) => {
        const runId = String(r.id ?? r.run_id);
        const user = messages.find(
          (m) => m.run_id === runId && m.role === "user",
        );
        const assistant = messages.find(
          (m) => m.run_id === runId && m.role === "assistant",
        );
        return {
          id: runId,
          lastSequence: Math.max(
            0,
            ...(data.events ?? [])
              .filter((event) => event.run_id === runId)
              .map((event) => event.sequence ?? 0),
          ),
          question: String(user?.content ?? r.message ?? r.question ?? ""),
          text: String(assistant?.content ?? ""),
          error: typeof r.error === "string" ? r.error : undefined,
          traces: (data.events ?? [])
            .filter((e) => e.run_id === runId && e.type === "trace")
            .map((e) => ({ ...e.data, sequence: e.sequence })),
          result: {
            ...((assistant?.result ?? r.result ?? r.output) as Run["result"]),
            review_version:
              typeof r.version === "number"
                ? r.version
                : ((assistant?.result ?? r.result ?? r.output) as Run["result"])
                    ?.review_version,
          },
          status:
            r.status === "running"
              ? "running"
              : r.status === "cancelled"
                ? "cancelled"
                : r.status === "error" || r.status === "failed"
                  ? "error"
                  : "done",
        };
      });
      setRuns(restored);
      active.current = restored.find((r) => r.status === "running")?.id ?? null;
      await connect(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session could not be loaded");
    }
  }
  return {
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
