type Selection = {
  id: string;
  current: () => boolean;
  create: () => Promise<string>;
  select: (id: string) => void;
  connect: (id: string) => Promise<void>;
};
export async function selectResearchSession(options: Selection) {
  if (!options.current()) return;
  const id = options.id || (await options.create());
  if (!options.current()) return;
  options.select(id);
  await options.connect(id);
  return options.current() ? id : undefined;
}

import {
  latestSequence,
  restoreRuns,
  type SessionSnapshot,
} from "../models/sessionSnapshot";
import type { Language, Run, Session } from "../models/types";
import { api, post } from "./client";

type Open = {
  title: string;
  language: Language;
  id: string;
  replay: boolean;
  current: () => boolean;
  select: Selection["select"];
  connect: (id: string, after?: number) => Promise<void>;
};
export function openResearchSession(options: Open) {
  return selectResearchSession({
    ...options,
    create: async () =>
      (
        await post<{ session: Session }>("/sessions", {
          title: options.title.slice(0, 120),
          language: options.language,
        })
      ).session.id,
    connect: async (id) => {
      const snapshot = options.replay
        ? await api<SessionSnapshot>(`/sessions/${encodeURIComponent(id)}`)
        : undefined;
      if (options.current())
        await options.connect(
          id,
          snapshot ? latestSequence(snapshot.events) : 0,
        );
    },
  });
}
type History = {
  reset: () => void;
  generation: { current: number };
  active: { current: string | null };
  setSession: (id: string) => void;
  setRuns: (runs: Run[]) => void;
  setError: (message: string) => void;
  connect: Open["connect"];
};
export async function loadResearchSession(id: string, state: History) {
  state.reset();
  const generation = state.generation.current;
  try {
    const data = await api<SessionSnapshot>(
      `/sessions/${encodeURIComponent(id)}`,
    );
    if (generation !== state.generation.current) return;
    const runs = restoreRuns(data);
    state.setSession(id);
    state.setRuns(runs);
    state.active.current =
      runs.find((run) => run.status === "running")?.id ?? null;
    await state.connect(id, latestSequence(data.events));
  } catch (error) {
    if (generation === state.generation.current)
      state.setError(
        error instanceof Error ? error.message : "Session could not be loaded",
      );
  }
}

type Steering = {
  running: string;
  message: string;
  language: Language;
  model: string;
  selected: string[];
  send: (value: unknown) => void;
  setRuns: (update: (runs: Run[]) => Run[]) => void;
};
export function steerResearch(options: Steering) {
  const { running, message, language, model, selected } = options;
  options.send({
    type: "steer",
    run_id: running,
    message,
    language,
    model,
    dataset_ids: selected,
  });
  options.setRuns((previous) =>
    previous.map((run) =>
      run.id === running
        ? { ...run, question: `${run.question}\n↳ ${message}` }
        : run,
    ),
  );
}
