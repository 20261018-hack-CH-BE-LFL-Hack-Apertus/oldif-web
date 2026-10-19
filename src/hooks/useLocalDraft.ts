"use client";
import { useEffect, useState } from "react";
export function useLocalDraft(userId: string, sessionId: string) {
  const key = userId
    ? `oldif.draft.v1:${encodeURIComponent(userId)}:${encodeURIComponent(sessionId || "new")}`
    : "";
  const [state, setState] = useState({ key: "", text: "", unavailable: false });
  useEffect(() => {
    try {
      setState({
        key,
        text: key ? (localStorage.getItem(key) ?? "") : "",
        unavailable: false,
      });
    } catch {
      setState({ key, text: "", unavailable: true });
    }
  }, [key]);
  function setText(text: string) {
    let unavailable = false;
    try {
      if (key) localStorage.setItem(key, text);
    } catch {
      unavailable = true;
    }
    setState({ key, text, unavailable });
  }
  function clearIf(text: string) {
    try {
      if (key && localStorage.getItem(key) === text)
        localStorage.setItem(key, "");
    } catch {
      /* Keep the visible draft if storage is unavailable. */
    }
    setState((previous) =>
      previous.key === key && previous.text === text
        ? { ...previous, text: "" }
        : previous,
    );
  }
  return {
    text: state.key === key ? state.text : "",
    setText,
    clearIf,
    unavailable: state.unavailable,
  };
}
