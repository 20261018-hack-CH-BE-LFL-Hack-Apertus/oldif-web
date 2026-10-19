"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { useResearch } from "@/hooks/useResearch";
import { useVoice } from "@/hooks/useVoice";
import { useWorkbenchLayout } from "@/hooks/useWorkbenchLayout";
import { post } from "@/lib/api/client";
import type { Citation } from "@/lib/models/types";
import { Activity } from "./Activity";
import s from "./AppStyles.module.css";
import { Composer } from "./Composer";
import { Evidence } from "./Evidence";
import { Header } from "./Header";
import { Messages } from "./Messages";
import { Sidebar } from "./Sidebar";
import w from "./WorkbenchStyles.module.css";
import { type MobilePanel, WorkspacePanels } from "./WorkspacePanels";
export function Workbench() {
  const prefs = usePreferences();
  const { t } = prefs;
  const research = useResearch(prefs.language);
  const settings = useWorkbenchLayout(research.userId);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("research");
  const followConversation = useRef(true);
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
    if (latestRun?.id) setCitation(undefined);
  }, [latestRun?.id]);
  useEffect(() => {
    if (latestRun?.status === "done" && latest) voice.deliverResult(latest);
    if (latestRun?.status === "error")
      voice.deliverResult({ error: latestRun.error });
  }, [latestRun?.status, latestRun?.error, latest, voice.deliverResult]);
  useEffect(() => {
    if (research.runs.length && followConversation.current)
      end.current?.scrollIntoView({ block: "nearest" });
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
    else if (text === "/sources") {
      settings.update({ navigation: true });
      setMobilePanel("navigation");
      requestAnimationFrame(() => sourceRef.current?.focus());
    } else void research.send(text);
    setInput("");
  }
  function selectCitation(value: Citation) {
    setCitation(value);
    settings.update({ evidence: true });
    setMobilePanel("evidence");
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
      <a
        className={s.skip}
        href="#research"
        onFocus={() => setMobilePanel("research")}
      >
        {t.workspace}
      </a>
      <Header prefs={prefs} workspace />
      <WorkspacePanels
        settings={settings}
        language={prefs.language}
        mobilePanel={mobilePanel}
        onMobilePanel={setMobilePanel}
        evidence={
          <Evidence
            citation={citation ?? latest?.citations?.[0]}
            result={latest}
            t={t}
            language={prefs.language}
          />
        }
        activity={
          <Activity run={latestRun} language={prefs.language} expanded />
        }
        sidebar={
          <Sidebar
            research={research}
            voice={voice}
            t={t}
            language={prefs.language}
            onNavigate={() => setMobilePanel("research")}
            sourceRef={sourceRef}
            onNew={() => {
              voice.stop();
              research.newSession();
              setCitation(undefined);
              setMobilePanel("research");
            }}
            onExport={exportDossier}
            onLogout={logout}
          />
        }
      >
        <section id="research" className={`${s.research} ${w.research}`}>
          <header className={`${s.researchHeader} ${w.researchHeader}`}>
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
            className={`${s.conversation} ${w.conversation}`}
            onScroll={(event) => {
              const element = event.currentTarget;
              followConversation.current =
                element.scrollHeight -
                  element.scrollTop -
                  element.clientHeight <
                128;
            }}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {research.runs.length ? (
              <Messages
                runs={research.runs}
                t={t}
                language={prefs.language}
                onCitation={selectCitation}
              />
            ) : (
              <div className={`${s.welcome} ${w.welcome}`}>
                <span className={s.brandMark} aria-hidden="true">
                  o.
                </span>
                <span className={s.eyebrow}>{t.tagline}</span>
                <h1>{t.welcome}</h1>
                <p className={s.muted}>{t.intro}</p>
                <div className={`${s.promptGrid} ${w.promptGrid}`}>
                  {[t.sourcePrompt, t.comparePrompt, t.reviewPrompt].map(
                    (prompt, i) => (
                      <button
                        type="button"
                        key={prompt}
                        className={`${s.promptCard} ${w.promptCard}`}
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
      </WorkspacePanels>
    </div>
  );
}
