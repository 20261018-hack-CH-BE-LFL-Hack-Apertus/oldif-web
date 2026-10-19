import Link from "next/link";
import type { RefObject } from "react";
import type { useResearch } from "@/hooks/useResearch";
import type { useVoice } from "@/hooks/useVoice";
import type { Copy } from "@/lib/i18n";
import s from "./AppStyles.module.css";
export function Sidebar({
  research,
  voice,
  t,
  sourceRef,
  onNew,
  onExport,
  onLogout,
}: {
  research: ReturnType<typeof useResearch>;
  voice: ReturnType<typeof useVoice>;
  t: Copy;
  sourceRef: RefObject<HTMLDivElement | null>;
  onNew: () => void;
  onExport: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className={s.sidebar}>
      <button type="button" className={s.primary} onClick={onNew}>
        ＋ {t.newChat}
      </button>
      <section ref={sourceRef} tabIndex={-1}>
        <h2 className={s.eyebrow}>{t.sources}</h2>
        <div className={s.sideList}>
          {research.datasets.map((d) => (
            <label key={d.id} className={s.sideItem}>
              <input
                type="checkbox"
                checked={research.selected.includes(d.id)}
                onChange={() =>
                  research.setSelected((previous) =>
                    previous.includes(d.id)
                      ? previous.filter((id) => id !== d.id)
                      : [...previous, d.id],
                  )
                }
              />
              <span>{d.title ?? d.name ?? d.id}</span>
            </label>
          ))}
          {!research.datasets.length && (
            <p className={s.small}>
              {research.ready ? t.emptySources : t.loading}
            </p>
          )}
        </div>
      </section>
      <section>
        <h2 className={s.eyebrow}>{t.history}</h2>
        <div className={s.sideList}>
          {research.sessions.map((session) => (
            <button
              type="button"
              key={session.id}
              className={`${s.sideItem} ${s.historyItem}`}
              onClick={() => {
                voice.stop();
                void research.loadSession(session.id);
              }}
            >
              ↗ {session.title ?? session.id}
            </button>
          ))}
          {!research.sessions.length && (
            <p className={s.small}>{t.emptyHistory}</p>
          )}
        </div>
      </section>
      <button
        type="button"
        className={s.button}
        onClick={onExport}
        disabled={!research.runs.length}
      >
        ↓ {t.export}
      </button>
      <a
        className={s.button}
        href={`/api/export?format=json&session_id=${encodeURIComponent(research.sessionId)}`}
        download
      >
        {t.acceptedFindings} ↓
      </a>
      <button type="button" className={s.button} onClick={onLogout}>
        {t.logout} ↗
      </button>
      <Link className={s.button} href="/canvas">
        {t.canvas} ↗
      </Link>
      <Link className={s.button} href="/graph">
        {t.spatial} ↗
      </Link>
    </aside>
  );
}
