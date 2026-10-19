import type { RefObject } from "react";
import { WorkspaceNavigation } from "@/features/navigation/WorkspaceNavigation";
import type { useResearch } from "@/hooks/useResearch";
import type { useVoice } from "@/hooks/useVoice";
import type { Copy } from "@/lib/i18n";
import type { Language } from "@/lib/models/types";
import s from "./AppStyles.module.css";
import w from "./WorkbenchStyles.module.css";
export function Sidebar({
  research,
  voice,
  t,
  language,
  sourceRef,
  onNew,
  onExport,
  onLogout,
  onNavigate,
}: {
  research: ReturnType<typeof useResearch>;
  voice: ReturnType<typeof useVoice>;
  t: Copy;
  language: Language;
  sourceRef: RefObject<HTMLDivElement | null>;
  onNew: () => void;
  onExport: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <aside className={w.sidebar}>
      <button type="button" className={s.primary} onClick={onNew}>
        ＋ {t.newChat}
      </button>
      <WorkspaceNavigation
        language={language}
        activePath="/app"
        compact
        onNavigate={onNavigate}
      />
      <details className={w.sidebarSection} open>
        <summary>{t.sources}</summary>
        <div ref={sourceRef} tabIndex={-1} className={s.sideList}>
          {research.datasets.map((dataset) => (
            <label key={dataset.id} className={s.sideItem}>
              <input
                type="checkbox"
                checked={research.selected.includes(dataset.id)}
                onChange={() =>
                  research.setSelected((previous) =>
                    previous.includes(dataset.id)
                      ? previous.filter((id) => id !== dataset.id)
                      : [...previous, dataset.id],
                  )
                }
              />
              <span>{dataset.title ?? dataset.name ?? dataset.id}</span>
            </label>
          ))}
          {!research.datasets.length && (
            <p className={s.small}>
              {research.ready ? t.emptySources : t.loading}
            </p>
          )}
        </div>
      </details>
      <details className={w.sidebarSection} open>
        <summary>{t.history}</summary>
        <div className={s.sideList}>
          {research.sessions.map((session) => (
            <button
              type="button"
              key={session.id}
              className={`${s.sideItem} ${s.historyItem}`}
              aria-current={
                research.sessionId === session.id ? "true" : undefined
              }
              onClick={() => {
                voice.stop();
                void research.loadSession(session.id);
                onNavigate?.();
              }}
            >
              ↗ {session.title ?? session.id}
            </button>
          ))}
          {!research.sessions.length && (
            <p className={s.small}>{t.emptyHistory}</p>
          )}
        </div>
      </details>
      <div className={w.sidebarActions}>
        <button
          type="button"
          className={s.button}
          onClick={onExport}
          disabled={!research.runs.length}
        >
          ↓ {t.export}
        </button>
        {research.sessionId && (
          <a
            className={s.button}
            href={`/api/export?format=json&session_id=${encodeURIComponent(research.sessionId)}`}
            download
          >
            {t.acceptedFindings} ↓
          </a>
        )}
        <button type="button" className={s.button} onClick={onLogout}>
          {t.logout} ↗
        </button>
      </div>
    </aside>
  );
}
