"use client";
import { useCallback, useEffect, useState } from "react";
import { api, post } from "@/lib/api/client";
import type { Event, Result, Session } from "@/lib/models/types";
export function useEvidenceSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await api<{ sessions: Session[] }>("/sessions");
      setSessions(response.sessions ?? []);
      setReady(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function demo() {
    try {
      await post("/auth/demo");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  }
  async function select(id: string) {
    setSelected(id);
    try {
      const value = await api<{
        events: Event[];
        messages: Array<{ result?: Result }>;
      }>(`/sessions/${encodeURIComponent(id)}`);
      setEvents(value.events ?? []);
      setResults(
        (value.messages ?? []).flatMap((m) => (m.result ? [m.result] : [])),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session load failed");
    }
  }
  return {
    sessions,
    selected,
    events,
    results,
    error,
    ready,
    demo,
    select,
    refresh: () => (selected ? select(selected) : load()),
  };
}
