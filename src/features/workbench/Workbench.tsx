"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { useResearch } from "@/hooks/useResearch";
import { useVoice } from "@/hooks/useVoice";
import { post } from "@/lib/api/client";
import type { Citation } from "@/lib/models/types";
import s from "./AppStyles.module.css";
import { Composer } from "./Composer";
import { Evidence } from "./Evidence";
import { Header } from "./Header";
import { Messages } from "./Messages";
import { Sidebar } from "./Sidebar";
export function Workbench() {
  const prefs = usePreferences();
  const { t } = prefs;
  const research = useResearch(prefs.language);
  const [input, setInput] = useState("");
  const [citation, setCitation] = useState<Citation>();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const voice = useVoice({
    language: prefs.language,
    onTranscript: research.setTranscript,
    onTool: (message) => void research.send(message),
  });
  const latestRun = research.runs.at(-1);
  const latest = latestRun?.result;
  useEffect(() => {
    if (latestRun?.status === "done" && latest) voice.deliverResult(latest);
    if (latestRun?.status === "error")
      voice.deliverResult({ error: latestRun.error });
  }, [latestRun?.status, latestRun?.error, latest, voice.deliverResult]);
  useEffect(() => {
    if (research.runs.length) end.current?.scrollIntoView({ block: "nearest" });
  }, [research.runs]);
  function exportDossier() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            application: "Oldif",
            exported_at: new Date().toISOString(),
            language: prefs.language,
            session_id: research.sessionId,
            runs: research.runs,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oldif-dossier-${research.sessionId || "empty"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function send() {
    const text = input.trim();
    if (!text) return;
    if (text === "/clear") {
      research.newSession();
      setCitation(undefined);
    } else if (text === "/export") exportDossier();
    else if (text === "/sources") sourceRef.current?.focus();
    else void research.send(text);
    setInput("");
  }
  function selectCitation(value: Citation) {
    setCitation(value);
    sourceRef.current?.scrollIntoView({ block: "nearest" });
  }
  async function logout() {
    try {
      voice.stop();
      await post("/auth/logout");
      router.push("/login");
    } catch (e) {
      research.setError(e instanceof Error ? e.message : t.failed);
    }
  }
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#research">
        {t.workspace}
      </a>
      <Header prefs={prefs} workspace />
      <main className={s.workspace}>
        <Sidebar
          research={research}
          voice={voice}
          t={t}
          sourceRef={sourceRef}
          onNew={() => {
            voice.stop();
            research.newSession();
            setCitation(undefined);
          }}
          onExport={exportDossier}
          onLogout={logout}
        />

        <section id="research" className={s.research}>
          <header className={s.researchHeader}>
            <div>
              <span className={s.eyebrow}>{t.archive}</span>
              <h2>{t.workspace}</h2>
            </div>
            <span className={s.status}>
              <span className={s.dot} data-connected={research.connected} />
              {research.connected ? t.connected : t.disconnected}
            </span>
          </header>
          <div
            className={s.conversation}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {research.runs.length ? (
              <Messages
                runs={research.runs}
                t={t}
                onCitation={selectCitation}
              />
            ) : (
              <div className={s.welcome}>
                <span className={s.brandMark} aria-hidden="true">
                  o.
                </span>
                <span className={s.eyebrow}>{t.tagline}</span>
                <h1>{t.welcome}</h1>
                <p className={s.muted}>{t.intro}</p>
                <div className={s.promptGrid}>
                  {[t.sourcePrompt, t.comparePrompt, t.reviewPrompt].map(
                    (prompt, i) => (
                      <button
                        type="button"
                        key={prompt}
                        className={s.promptCard}
                        onClick={() => {
                          setInput(prompt);
                          inputRef.current?.focus();
                        }}
                      >
                        <span aria-hidden="true">{["⌕", "⇄", "◈"][i]}</span>
                        {prompt}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
            <div ref={end} />
          </div>
          <Composer
            research={research}
            voice={voice}
            t={t}
            input={input}
            setInput={setInput}
            inputRef={inputRef}
            send={send}
          />
        </section>
        <Evidence citation={citation} result={latest} t={t} />
      </main>
    </div>
  );
}
