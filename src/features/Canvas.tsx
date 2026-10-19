"use client";
import { Button, EvidenceCard, StatusBadge } from "oldif-web-ui-components";
import { useMemo, useState } from "react";
import { LayoutSyncStatus } from "@/features/preferences/LayoutSyncStatus";
import { useCanvasLayout } from "@/hooks/useCanvasLayout";
import { useEvidenceSessions } from "@/hooks/useEvidenceSessions";
import { usePreferences } from "@/hooks/usePreferences";
import { withPosition } from "@/lib/models/canvasLayout";
import { canvasRuns } from "@/lib/models/canvasRuns";
import c from "./canvas/CanvasLayout.module.css";
import { canvasCopy } from "./canvas/canvasCopy";
import { MovableNode } from "./canvas/MovableNode";
import s from "./EvidenceSurface.module.css";
import { SurfaceHeader } from "./SurfaceHeader";
import { summarizeActivity } from "./workbench/activityModel";
import { workbenchCopy } from "./workbench/workbenchCopy";
export function Canvas() {
  const prefs = usePreferences();
  const data = useEvidenceSessions();
  const settings = useCanvasLayout(data);
  const copy = canvasCopy[prefs.language];
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
  const citation =
    citations.find(
      (item) => item.source_id === settings.layout.selected_source_id,
    ) ?? citations[0];
  return (
    <main className={s.surface}>
      <SurfaceHeader
        prefs={prefs}
        data={{ ...data, select: settings.select }}
        title={prefs.t.trace}
      />
      <div className={c.controls}>
        <p id="canvas-move-guidance" className={c.guidance}>
          {copy.guidance}
        </p>
        <Button
          disabled={!data.selected}
          onClick={() => settings.update({ positions: {} })}
        >
          {copy.reset}
        </Button>
      </div>
      <LayoutSyncStatus settings={settings} language={prefs.language} />
      <div className={s.grid}>
        <section
          className={`${s.canvas} ${c.board}`}
          aria-label={prefs.t.trace}
        >
          {items.map((item, index) => (
            <MovableNode
              key={item.id}
              label={`${copy.move}: ${t[item.label]}`}
              position={settings.layout.positions[item.id] ?? { x: 0, y: 0 }}
              onMove={(point) =>
                settings.update(withPosition(settings.layout, item.id, point))
              }
            >
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
            </MovableNode>
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
          <fieldset className={c.sources}>
            <legend>{copy.source}</legend>
            {citations.map((source, index) => (
              <Button
                key={`${source.source_id}-${index}`}
                aria-pressed={citation?.source_id === source.source_id}
                onClick={() =>
                  settings.update({
                    selected_source_id: source.source_id ?? null,
                  })
                }
              >
                {source.title ?? source.source_id}
              </Button>
            ))}
          </fieldset>
          {citation && (
            <EvidenceCard
              title={
                citation.title ?? citation.source_id ?? prefs.t.sourceLabel
              }
              quote={citation.quote ?? citation.text}
              sourceUrl={citation.url}
              sourceLabel={prefs.t.sourceLabel}
            />
          )}
          {!selected && !citations.length && <p>{prefs.t.selectSource}</p>}
        </aside>
      </div>
    </main>
  );
}
