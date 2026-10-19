"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { LayoutStore } from "@/lib/api/layoutStore";
import type { Validator } from "@/lib/models/strict";
export function useServerLayout<T extends object>(
  userId: string,
  scope: "workbench" | "archive",
  key: string,
  initial: T,
  validate: Validator<T>,
) {
  const store = useMemo(
    () =>
      new LayoutStore({
        scope,
        key,
        initial,
        validate,
        storage:
          typeof window === "undefined"
            ? undefined
            : {
                getItem: (key: string) => localStorage.getItem(key),
                setItem: (key: string, value: string) =>
                  localStorage.setItem(key, value),
              },
      }),
    [scope, key, initial, validate],
  );
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.snapshot,
  );
  useEffect(() => {
    if (!userId) return;
    void store.start();
    const refresh = () => void store.refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      store.close();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [store, userId]);
  return {
    ...snapshot,
    update: store.update,
    reset: store.reset,
    resolve: store.resolve,
  };
}
