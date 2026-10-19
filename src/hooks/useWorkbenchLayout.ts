"use client";
import { useCallback, useEffect, useState } from "react";
import {
  defaultLayout,
  layoutKey,
  parseLayout,
  type WorkbenchLayout,
} from "@/lib/models/workbenchLayout";
export function useWorkbenchLayout(userId: string) {
  const [layout, setLayout] = useState(defaultLayout);
  const [loadedFor, setLoadedFor] = useState("");
  const [storageError, setStorageError] = useState(false);
  const key = layoutKey(userId);
  useEffect(() => {
    setStorageError(false);
    try {
      setLayout(
        key
          ? parseLayout(JSON.parse(localStorage.getItem(key) ?? "null"))
          : defaultLayout,
      );
    } catch {
      setLayout(defaultLayout);
      setStorageError(true);
    }
    setLoadedFor(userId);
  }, [key, userId]);
  useEffect(() => {
    if (!key || loadedFor !== userId) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(layout));
      } catch {
        setStorageError(true);
      }
    }, 160);
    return () => clearTimeout(timer);
  }, [key, layout, loadedFor, userId]);
  const update = useCallback(
    (patch: Partial<WorkbenchLayout>) =>
      setLayout((previous) => parseLayout({ ...previous, ...patch })),
    [],
  );
  const reset = useCallback(() => setLayout(defaultLayout), []);
  return {
    layout: loadedFor === userId ? layout : defaultLayout,
    update,
    reset,
    storageError,
  };
}
