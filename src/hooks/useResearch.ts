"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { IntentDelivery } from "@/lib/api/intentDelivery";
import {
  loadResearchSession,
  openResearchSession,
  steerResearch,
} from "@/lib/api/researchSession";
import { reduceRun } from "@/lib/models/events";
import {
  cachedIntent,
  cacheIntentSession,
  forgetIntent,
} from "@/lib/models/intentCache";
import {
  type ResearchIntent,
  researchIntent,
} from "@/lib/models/researchIntent";
import { failedRun, pendingRun } from "@/lib/models/researchState";
import type { Language, Run } from "@/lib/models/types";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { useResearchCatalog } from "./useResearchCatalog";
export function useResearch(language: Language) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, updateSelected] = useState<string[]>([]);
  const [providerConfirmed, setProviderConfirmed] = useState(false);
  const [delivery] = useState(() => new IntentDelivery());
  const setSelected = useCallback(
    (value: string[] | ((previous: string[]) => string[])) => {
      setProviderConfirmed(false);
      updateSelected(value);
    },
    [],
  );
  const [sessionId, setSessionId] = useState("");
  const selectedSession = useRef("");
  const [error, setError] = useState("");
  const catalog = useResearchCatalog(setError);
  const { datasets, model, userId, refreshSessions } = catalog;
  const needsProviderConsent = datasets.some(
    (dataset) =>
      dataset.document_id &&
      (!selected.length || selected.includes(dataset.id)),
  );
  const [transcript, setTranscript] = useState("");
  const loadGeneration = useRef(0);
  const pending = useRef<string | null>(null);
  const active = useRef<string | null>(null);
  const intents = useRef(new Map<string, ResearchIntent>());
  const currentLanguage = useRef(language);
  currentLanguage.current = language;
  useEffect(
    () => () => {
      delivery.close();
      loadGeneration.current += 1;
    },
    [delivery],
  );
  const realtime = useRealtimeChannel((event) => {
    if (
      event.type === "run_reused" &&
      typeof event.data?.session_id === "string"
    ) {
      const intent = pending.current
        ? intents.current.get(pending.current)
        : undefined;
      if (intent) forgetIntent(userId, intent.idempotency_key);
      delivery.acknowledge(true);
      void loadSession(event.data.session_id);
      return;
    }
    if (event.type === "error" && !event.run_id) {
      delivery.acknowledge(false);
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
    if (event.type === "started" && event.run_id && pending.current) {
      const temporary = pending.current;
      pending.current = null;
      active.current = event.run_id;
      setSessionId(event.session_id ?? selectedSession.current);
      const intent = intents.current.get(temporary);
      if (intent) {
        forgetIntent(userId, intent.idempotency_key);
        intents.current.delete(temporary);
      }
      delivery.acknowledge(true);
      setRuns((previous) =>
        previous.map((r) =>
          r.id === temporary
            ? {
                ...r,
                id: event.run_id as string,
                status: "running",
                error: undefined,
              }
            : r,
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
  useEffect(() => {
    if (!connected) delivery.disconnected();
    else
      try {
        delivery.reconnected(realtime.send);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Connection interrupted",
        );
      }
  }, [connected, delivery, realtime.send]);
  async function ensureSession(
    title: string,
    generation: number,
    preferred = "",
  ) {
    return openResearchSession({
      title,
      language: currentLanguage.current,
      id: preferred || selectedSession.current,
      replay: !!preferred && preferred !== selectedSession.current,
      current: () => generation === loadGeneration.current,
      select: (id) => {
        selectedSession.current = id;
      },
      connect,
    });
  }
  async function submitIntent(id: string, intent: ResearchIntent) {
    const generation = loadGeneration.current;
    const cached = cachedIntent(userId, intent);
    pending.current = id;
    active.current = id;
    setRuns((previous) => pendingRun(previous, id, intent));
    const accepted = delivery.begin(id, () => {
      const message =
        "No acknowledgement received. Retry recovers this request without creating a duplicate.";
      active.current = null;
      setError(message);
      setRuns((previous) => failedRun(previous, id, message));
    });
    try {
      const sid = await ensureSession(
        intent.message,
        generation,
        cached.session_id,
      );
      if (
        !sid ||
        generation !== loadGeneration.current ||
        active.current !== id
      ) {
        if (pending.current === id) delivery.acknowledge(false);
        return false;
      }
      cacheIntentSession(userId, intent, sid);
      realtime.send(intent);
      delivery.sent(intent);
    } catch (error) {
      if (generation !== loadGeneration.current || pending.current !== id)
        return false;
      delivery.acknowledge(false);
      const message =
        error instanceof Error ? error.message : "Research failed";
      setError(message);
      pending.current = null;
      active.current = null;
      setRuns((previous) => failedRun(previous, id, message));
    }
    return accepted;
  }
  async function send(message: string) {
    if (!message.trim()) return false;
    if (needsProviderConsent && !providerConfirmed) {
      setError(
        "Confirm provider processing for the selected uploaded documents.",
      );
      return false;
    }
    setError("");
    const running = active.current;
    if (running) {
      try {
        const sid = await ensureSession(message, loadGeneration.current);
        if (!sid || pending.current) return false;
        steerResearch({
          running,
          message,
          language,
          model,
          selected,
          send: realtime.send,
          setRuns,
        });
        return true;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Steering failed");
        return false;
      }
    }
    const id = crypto.randomUUID();
    const candidate = researchIntent(
      message,
      model,
      language,
      selected,
      crypto.randomUUID(),
      providerConfirmed,
    );
    const intent = cachedIntent(userId, candidate).intent;
    intents.current.set(id, intent);
    return submitIntent(id, intent);
  }
  async function retry(id: string) {
    const intent = intents.current.get(id);
    if (!intent || active.current) return;
    setError("");
    return submitIntent(id, intent);
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
    delivery.close();
    loadGeneration.current += 1;
    realtime.close();
    selectedSession.current = "";
    setSessionId("");
    setRuns([]);
    pending.current = null;
    active.current = null;
    intents.current.clear();
    setTranscript("");
  }
  async function loadSession(id: string) {
    return loadResearchSession(id, {
      reset: newSession,
      generation: loadGeneration,
      active,
      setSession: (id) => {
        selectedSession.current = id;
        setSessionId(id);
      },
      setRuns,
      setError,
      connect,
    });
  }
  return {
    ...catalog,
    runs,
    selected,
    setSelected,
    sessionId,
    connected,
    error,
    setError,
    transcript,
    setTranscript,
    awaitingAcknowledgement:
      pending.current !== null && active.current !== null,
    needsProviderConsent,
    providerConfirmed,
    setProviderConfirmed,
    send,
    retry,
    canRetry: (id: string) => intents.current.has(id) && !active.current,
    cancel,
    newSession,
    loadSession,
    running: runs.some((r) => r.status === "running"),
  };
}
