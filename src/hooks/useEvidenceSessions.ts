"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, post } from "@/lib/api/client";
import {
  applyEvidenceEvent,
  restoreEvidence,
} from "@/lib/models/evidenceSession";
import {
  latestSequence,
  type SessionSnapshot,
} from "@/lib/models/sessionSnapshot";
import type { Session } from "@/lib/models/types";
import { useRealtimeChannel } from "./useRealtimeChannel";
export function useEvidenceSessions() {
  const [userId, setUserId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState("");
  const [state, setState] = useState(() => restoreEvidence({}));
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const generation = useRef(0);
  const realtime = useRealtimeChannel((event) =>
    setState((previous) => applyEvidenceEvent(previous, event)),
  );
  const load = useCallback(async () => {
    try {
      const [response, auth] = await Promise.all([
        api<{ sessions: Session[] }>("/sessions"),
        api<{ user: { id: string } }>("/auth/session"),
      ]);
      setUserId(auth.user.id);
      setSessions(response.sessions ?? []);
      setReady(true);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed");
    }
  }, []);
  useEffect(() => {
    void load();
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => {
      generation.current += 1;
      window.removeEventListener("focus", focus);
    };
  }, [load]);
  async function demo() {
    try {
      await post("/auth/demo");
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    }
  }
  async function select(id: string) {
    const request = ++generation.current;
    realtime.close();
    setSelected(id);
    setState(restoreEvidence({}));
    if (!id) return;
    try {
      const value = await api<SessionSnapshot>(
        `/sessions/${encodeURIComponent(id)}`,
      );
      if (request !== generation.current) return;
      setState(restoreEvidence(value));
      setError("");
      await realtime.connect(id, latestSequence(value.events));
    } catch (error) {
      if (request === generation.current)
        setError(
          error instanceof Error ? error.message : "Session load failed",
        );
    }
  }
  const results = useMemo(() => Object.values(state.results), [state.results]);
  return {
    userId,
    sessions,
    selected,
    events: state.events,
    results,
    connected: realtime.connected,
    error,
    ready,
    demo,
    select,
    refresh: () => (selected ? select(selected) : load()),
  };
}
