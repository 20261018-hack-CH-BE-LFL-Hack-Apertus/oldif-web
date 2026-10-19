import { useEffect, useRef, useState } from "react";
import { isEditing, nextSlide } from "./print";

function useKeyboard(
  count: number,
  setIndex: (updater: (index: number) => number) => void,
) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (isEditing(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      setIndex((i) => nextSlide(e.key, i, count));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [count, setIndex]);
}
export function useDeck(count: number) {
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);
  useKeyboard(count, setIndex);
  useEffect(() => {
    const change = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  async function toggle() {
    setError(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setError(true);
    }
  }
  return { root, index, setIndex, fullscreen, error, toggle };
}
