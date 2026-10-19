"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { post } from "@/lib/api/client";
import s from "./AppStyles.module.css";
import { Header } from "./Header";
export function Landing() {
  const prefs = usePreferences();
  const { t } = prefs;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function demo() {
    setBusy(true);
    setError("");
    try {
      await post("/auth/demo");
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.failed);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.shell}>
      <Header prefs={prefs} />
      <main>
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <span className={s.eyebrow}>{t.tagline}</span>
            <h1 className={s.heroTitle}>{t.hero}</h1>
            <p className={s.heroIntro}>{t.intro}</p>
            <div className={s.heroActions}>
              <button
                type="button"
                className={s.primary}
                onClick={demo}
                disabled={busy}
              >
                {busy ? t.loading : t.demo} ↗
              </button>
              <Link href="/deck/202610191111" className={s.button}>
                {t.pitch} →
              </Link>
            </div>
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            <p className={`${s.small} ${s.muted}`}>{t.demoNote}</p>
          </div>
          <div className={s.art} aria-hidden="true">
            <div className={s.orbit} />
            <div className={s.documentArt}>
              <p className={s.eyebrow}>OLDIF · ARCHIVE INTELLIGENCE</p>
              <h2>
                Fragmenta
                <br />
                memoriae.
              </h2>
              <span />
              <span />
              <span />
              <span />
              <span />
              <p className={`${s.small} ${s.muted}`}>
                Document → Context → Evidence
              </p>
            </div>
            <div className={s.artSeal}>
              ↗ {t.sourceLabel}
              <br />
              <small>Apertus × Oldif</small>
            </div>
          </div>
        </section>
        <section className={s.landingFooter}>
          {[
            ["01", t.sources, t.pitchTrustText],
            ["02", t.workspace, t.pitchWorkflowText],
            ["03", t.review, t.pitchProofText],
          ].map(([n, title, text]) => (
            <article key={n} className={s.feature}>
              <span className={s.eyebrow}>{n} / OLDIF</span>
              <h2>{title}</h2>
              <p className={s.muted}>{text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
