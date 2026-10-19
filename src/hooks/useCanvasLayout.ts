"use client";
import { useEffect, useRef } from "react";
import { canvasDefault, validCanvas } from "@/lib/models/canvasLayout";
import type { useEvidenceSessions } from "./useEvidenceSessions";
import { useServerLayout } from "./useServerLayout";
export function useCanvasLayout(data: ReturnType<typeof useEvidenceSessions>) {
  const settings = useServerLayout(
    data.userId,
    "canvas",
    `oldif.canvas.v1:${encodeURIComponent(data.userId)}`,
    canvasDefault,
    validCanvas,
  );
  const restored = useRef("");
  const select = useRef(data.select);
  select.current = data.select;
  useEffect(() => {
    if (
      !data.ready ||
      settings.status === "loading" ||
      restored.current === data.userId
    )
      return;
    restored.current = data.userId;
    const id = settings.layout.session_id;
    if (
      data.ready &&
      !data.selected &&
      id &&
      data.sessions.some((session) => session.id === id)
    )
      void select.current(id);
  }, [
    data.ready,
    data.selected,
    data.sessions,
    data.userId,
    settings.status,
    settings.layout.session_id,
  ]);
  return {
    ...settings,
    select: (id: string) => {
      if (id && id !== settings.layout.session_id)
        settings.update({
          session_id: id,
          positions: {},
          selected_source_id: null,
        });
      return data.select(id);
    },
  };
}
