"use client";
import { validWorkbench } from "@/lib/models/layoutValidation";
import { defaultLayout, layoutKey } from "@/lib/models/workbenchLayout";
import { useServerLayout } from "./useServerLayout";
export function useWorkbenchLayout(userId: string) {
  return useServerLayout(
    userId,
    "workbench",
    layoutKey(userId) ?? "",
    defaultLayout,
    validWorkbench,
  );
}
