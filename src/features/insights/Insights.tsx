"use client";
import { Button } from "oldif-web-ui-components";
import s from "@/features/archive/ArchiveStyles.module.css";
import { WorkspaceNavigation } from "@/features/navigation/WorkspaceNavigation";
import { Header } from "@/features/workbench/Header";
import { usePreferences } from "@/hooks/usePreferences";
import { Benchmark } from "./Benchmark";
import { insightsCopy } from "./copy";
import { KnowledgeModel } from "./KnowledgeModel";
import { ResultTable } from "./ResultTable";
import { useInsights } from "./useInsights";
export function Insights({
  view,
}: {
  view: "ontology" | "results" | "benchmarks" | "agents";
}) {
  const prefs = usePreferences();
  const t = insightsCopy(prefs.language);
  const data = useInsights(prefs.language);
  return (
    <main className={s.shell}>
      <Header prefs={prefs} workspace />
      <div className={s.layout}>
        <WorkspaceNavigation
          language={prefs.language}
          activePath={`/${view}`}
        />
        <div className={s.content}>
          <header className={s.hero}>
            <h1>{t[view]}</h1>
            <div className={s.row}>
              {!data.ready && (
                <Button variant="primary" onClick={data.demo}>
                  {prefs.t.demo}
                </Button>
              )}
              <Button onClick={data.reload}>{t.refresh}</Button>
            </div>
          </header>
          {data.error && (
            <p role="alert" className={s.error}>
              {data.error}
            </p>
          )}
          {(view === "ontology" || view === "agents") && (
            <KnowledgeModel
              t={t}
              language={prefs.language}
              agents={view === "agents"}
            />
          )}
          {view === "benchmarks" && <Benchmark t={t} data={data} />}
          {(view === "results" || view === "benchmarks") && (
            <ResultTable
              language={prefs.language}
              runs={data.runs}
              events={data.events}
              t={t}
              refresh={data.refresh}
            />
          )}
        </div>
      </div>
    </main>
  );
}
