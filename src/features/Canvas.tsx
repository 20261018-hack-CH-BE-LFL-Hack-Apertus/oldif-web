"use client";
import { EvidenceCard, StatusBadge } from "oldif-web-ui-components";
import { useMemo, useState } from "react";
import { useEvidenceSessions } from "@/hooks/useEvidenceSessions";
import { usePreferences } from "@/hooks/usePreferences";
import { canvasRuns } from "@/lib/models/canvasRuns";
import s from "./EvidenceSurface.module.css";
import { SurfaceHeader } from "./SurfaceHeader";
import { summarizeActivity } from "./workbench/activityModel";
import { workbenchCopy } from "./workbench/workbenchCopy";
export function Canvas() {
  const prefs = usePreferences();
  const data = useEvidenceSessions();
  const [selectedId, setSelectedId] = useState("");
  const t = workbenchCopy[prefs.language];
  const items = useMemo(
    () =>
      canvasRuns(data.events).flatMap((run) =>
        summarizeActivity(run.traces, run.status).map((item) => ({
          ...item,
          id: `${run.id}:${item.id}`,
          runId: run.id,
        })),
      ),
    [data.events],
  );
  const selected = items.find((item) => item.id === selectedId);
  const citations = data.results.flatMap((result) => result.citations ?? []);
  return (
    <main className={s.surface}>
      <SurfaceHeader prefs={prefs} data={data} title={prefs.t.trace} />
      <div className={s.grid}>
        <section className={s.canvas} aria-label={prefs.t.trace}>
          {items.map((item, index) => (
            <button
              type="button"
              className={s.node}
              data-active={selectedId === item.id}
              data-state={item.state}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
            >
              <small>
                {String(index + 1).padStart(2, "0")}{" "}
                <span aria-hidden="true">→</span>
              </small>
              <h2>{t[item.label]}</h2>
              {item.detail && <p>{item.detail}</p>}
              <StatusBadge
                label={
                  item.state === "running"
                    ? prefs.t.working
                    : item.state === "done"
                      ? t.completed
                      : item.state === "error"
                        ? t.failed
                        : item.state === "stopped"
                          ? t.stopped
                          : t.reviewNeeded
                }
              />
            </button>
          ))}
          {!items.length && <p className={s.empty}>{prefs.t.emptyHistory}</p>}
        </section>
        <aside className={s.detail}>
          <h2>{selected ? t[selected.label] : prefs.t.evidence}</h2>
          {selected?.detail && <p>{selected.detail}</p>}
          {selected && (
            <details>
              <summary>{t.technical}</summary>
              <pre>{JSON.stringify(selected.events, null, 2)}</pre>
            </details>
          )}
          {citations.map((citation, index) => (
            <EvidenceCard
              key={`${citation.source_id}-${index}`}
              title={
                citation.title ?? citation.source_id ?? prefs.t.sourceLabel
              }
              quote={citation.quote ?? citation.text}
              sourceUrl={citation.url}
              sourceLabel={prefs.t.sourceLabel}
            />
          ))}
          {!selected && !citations.length && <p>{prefs.t.selectSource}</p>}
        </aside>
      </div>
    </main>
  );
}
