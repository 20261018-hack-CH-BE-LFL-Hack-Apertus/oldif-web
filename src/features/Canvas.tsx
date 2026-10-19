"use client";
import { StatusBadge } from "oldif-web-ui-components";
import { useState } from "react";
import { useEvidenceSessions } from "@/hooks/useEvidenceSessions";
import { usePreferences } from "@/hooks/usePreferences";
import s from "./EvidenceSurface.module.css";
import { SurfaceHeader } from "./SurfaceHeader";
export function Canvas() {
  const prefs = usePreferences();
  const data = useEvidenceSessions();
  const [index, setIndex] = useState<number>();
  const traces = data.events.filter(
    (e) =>
      e.type === "trace" ||
      e.type === "evidence" ||
      e.type === "done" ||
      e.type === "error",
  );
  const selected = index === undefined ? undefined : traces[index];
  return (
    <main className={s.surface}>
      <SurfaceHeader prefs={prefs} data={data} title={prefs.t.trace} />
      <div className={s.grid}>
        <section className={s.canvas} aria-label={prefs.t.trace}>
          {traces.map((event, i) => (
            <button
              type="button"
              className={s.node}
              data-active={index === i}
              key={`${event.run_id}-${event.sequence ?? i}`}
              onClick={() => setIndex(i)}
            >
              <small>
                {String(i + 1).padStart(2, "0")} → {event.type}
              </small>
              <h2>
                {String(event.data?.agent ?? event.data?.kind ?? "Oldif")}
              </h2>
              <p>
                {String(event.data?.message ?? event.data?.answer ?? "").slice(
                  0,
                  240,
                )}
              </p>
              <StatusBadge label={event.run_id ?? ""} />
            </button>
          ))}
          {!traces.length && <p className={s.empty}>{prefs.t.emptyHistory}</p>}
        </section>
        <aside className={s.detail}>
          <h2>{prefs.t.evidence}</h2>
          {selected ? (
            <pre>{JSON.stringify(selected, null, 2)}</pre>
          ) : (
            <p>{prefs.t.selectSource}</p>
          )}
        </aside>
      </div>
    </main>
  );
}
