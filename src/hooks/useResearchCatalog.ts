"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { defaultResearchModel } from "@/lib/models/modelSelection";
import type { Dataset, Model, Session } from "@/lib/models/types";

async function catalog() {
  const [models, datasets, sessions, auth] = await Promise.all([
    api<{ models: Model[]; default_model?: string }>("/models"),
    api<{ datasets: Dataset[] }>("/datasets"),
    api<{ sessions: Session[] }>("/sessions"),
    api<{ user: { id: string } }>("/auth/session"),
  ]);
  return {
    models: models.models,
    datasets: datasets.datasets,
    sessions: sessions.sessions,
    userId: auth.user.id,
    model: defaultResearchModel(models.models, models.default_model),
  };
}
export function useResearchCatalog(onError: (message: string) => void) {
  const [value, setValue] = useState<{
    models: Model[];
    datasets: Dataset[];
    userId: string;
  }>({ models: [], datasets: [], userId: "" });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [model, setModel] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void catalog()
      .then((data) => {
        if (!alive) return;
        setValue(data);
        setSessions(data.sessions);
        setModel(data.model);
        setReady(true);
      })
      .catch((error) => {
        if (alive) onError(error.message);
      });
    return () => {
      alive = false;
    };
  }, [onError]);
  const refreshSessions = useCallback(async () => {
    const value = await api<{ sessions: Session[] }>("/sessions");
    setSessions(value.sessions);
  }, []);
  return { ...value, sessions, refreshSessions, model, setModel, ready };
}
