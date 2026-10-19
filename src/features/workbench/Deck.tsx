"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import s from "./AppStyles.module.css";
import { Header } from "./Header";
export function Deck() {
  const prefs = usePreferences();
  const { t } = prefs;
  const [index, setIndex] = useState(0);
  const slides = [
    ["Oldif", t.intro],
    [t.pitchProblem, t.pitchProblemText],
    [t.pitchWorkflow, t.pitchWorkflowText],
    [t.pitchTrust, t.pitchTrustText],
    [t.pitchProof, t.pitchProofText],
    [t.pitchNext, t.pitchNextText],
  ];
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.target instanceof HTMLSelectElement) return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, 5));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div className={s.shell}>
      <Header prefs={prefs} workspace />
      <main className={s.deck} aria-live="polite">
        <span className={s.eyebrow}>
          HACK APERTUS · LIEBEFELD · 19 OCT 2026
        </span>
        <h1>{slides[index][0]}</h1>
        <p>{slides[index][1]}</p>
        <span className={s.badge}>{t.tagline}</span>
      </main>
      <nav className={s.deckNav} aria-label={t.pitch}>
        <button
          type="button"
          className={s.button}
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          ← {t.back}
        </button>
        <span>
          {index + 1} / {slides.length}
        </span>
        {index < slides.length - 1 ? (
          <button
            type="button"
            className={s.primary}
            onClick={() => setIndex((i) => i + 1)}
          >
            →
          </button>
        ) : (
          <Link href="/app" className={s.primary}>
            {t.open} ↗
          </Link>
        )}
      </nav>
    </div>
  );
}
