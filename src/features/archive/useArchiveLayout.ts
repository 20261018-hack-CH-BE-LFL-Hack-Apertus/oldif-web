"use client";
import { useEffect, useState } from "react";
const initial = {
  width: 48,
  height: 60,
  source: true,
  review: true,
  reverse: false,
};
export function useArchiveLayout(userId: string) {
  const [layout, setLayout] = useState(initial);
  const [loaded, setLoaded] = useState("");
  const key = userId ? `oldif:archive-layout:v1:${userId}` : "";
  useEffect(() => {
    setLayout(initial);
    if (key)
      try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        if (
          value &&
          typeof value.width === "number" &&
          typeof value.height === "number"
        )
          setLayout({
            width: Math.max(25, Math.min(70, value.width)),
            height: Math.max(25, Math.min(75, value.height)),
            source: value.source !== false,
            review: value.review !== false,
            reverse: value.reverse === true,
          });
      } catch {
        /* Corrupt or unavailable browser storage uses the default layout. */
      }
    setLoaded(key);
  }, [key]);
  useEffect(() => {
    if (key && loaded === key)
      try {
        localStorage.setItem(key, JSON.stringify(layout));
      } catch {
        /* Layout remains usable without persistence. */
      }
  }, [key, loaded, layout]);
  return {
    layout,
    change: (value: Partial<typeof initial>) =>
      setLayout((previous) => ({ ...previous, ...value })),
    reset: () => setLayout(initial),
  };
}
