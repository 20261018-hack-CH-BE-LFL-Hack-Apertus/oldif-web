"use client";
import { Button, EvidenceCard } from "oldif-web-ui-components";
import { useMemo } from "react";
import { SpatialGraph } from "@/components/ui/data-display/SpatialGraph/SpatialGraph";
import { LayoutSyncStatus } from "@/features/preferences/LayoutSyncStatus";
import { useCanvasLayout } from "@/hooks/useCanvasLayout";
import { useEvidenceSessions } from "@/hooks/useEvidenceSessions";
import { usePreferences } from "@/hooks/usePreferences";
import { canvasCopy } from "./canvas/canvasCopy";
import s from "./EvidenceSurface.module.css";
import { SurfaceHeader } from "./SurfaceHeader";
export function Graph() {
  const prefs = usePreferences();
  const data = useEvidenceSessions();
  const settings = useCanvasLayout(data);
  const selected = settings.layout.selected_source_id ?? "";
  const setSelected = (id: string) =>
    settings.update({ selected_source_id: id });
  const citations = useMemo(
    () => [
      ...new Map(
        data.results
          .flatMap((r) => r.citations ?? [])
          .map((citation, index) => [
            citation.id ?? citation.source_id ?? String(index),
            citation,
          ]),
      ).values(),
    ],
    [data.results],
  );
  const nodes = useMemo(
    () =>
      citations.map((c, i) => ({
        id: c.id ?? c.source_id ?? String(i),
        title: c.title ?? c.source_id ?? String(i),
      })),
    [citations],
  );
  const citation = citations.find(
    (c, i) => (c.id ?? c.source_id ?? String(i)) === selected,
  );
  return (
    <main className={s.surface}>
      <SurfaceHeader
        prefs={prefs}
        data={{ ...data, select: settings.select }}
        title={prefs.t.spatial}
      />
      <LayoutSyncStatus settings={settings} language={prefs.language} />
      <div className={s.grid}>
        <section>
          <p>{prefs.t.graphHint}</p>
          <SpatialGraph
            nodes={nodes}
            onSelect={setSelected}
            unavailable={canvasCopy[prefs.language].graphFallback}
          />
          <table className={s.table}>
            <caption>{prefs.t.sources}</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>{prefs.t.sourceLabel}</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id}>
                  <td>{node.id}</td>
                  <td>
                    <Button onClick={() => setSelected(node.id)}>
                      {node.title} ↗
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!nodes.length && <p className={s.empty}>{prefs.t.emptySources}</p>}
        </section>
        <aside className={s.detail}>
          {citation ? (
            <EvidenceCard
              title={citation.title ?? citation.source_id ?? selected}
              quote={citation.quote ?? citation.text}
              sourceUrl={citation.url}
              sourceLabel={prefs.t.sourceLabel}
            />
          ) : (
            <p>{prefs.t.selectSource}</p>
          )}
        </aside>
      </div>
    </main>
  );
}
