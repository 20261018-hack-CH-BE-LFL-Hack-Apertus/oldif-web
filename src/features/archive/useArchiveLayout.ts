"use client";
import { useServerLayout } from "@/hooks/useServerLayout";
import { archiveDefault, validArchive } from "@/lib/models/layoutValidation";
export function useArchiveLayout(userId: string) {
  const state = useServerLayout(
    userId,
    "archive",
    userId ? `oldif:archive-layout:v1:${userId}` : "",
    archiveDefault,
    validArchive,
  );
  return { ...state, change: state.update };
}
