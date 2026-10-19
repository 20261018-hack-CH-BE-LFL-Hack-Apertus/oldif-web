"use client";
import { usePathname } from "next/navigation";
import { Button, StatusBadge } from "oldif-web-ui-components";
import { WorkspaceNavigation } from "@/features/navigation/WorkspaceNavigation";
import a from "@/features/workbench/AppStyles.module.css";
import { Header } from "@/features/workbench/Header";
import type { ReturnTypePreferences } from "@/features/workbench/types";
import { workbenchCopy } from "@/features/workbench/workbenchCopy";
import type { useEvidenceSessions } from "@/hooks/useEvidenceSessions";
import s from "./EvidenceSurface.module.css";
export function SurfaceHeader({
  prefs,
  data,
  title,
}: {
  prefs: ReturnTypePreferences;
  data: ReturnType<typeof useEvidenceSessions>;
  title: string;
}) {
  const pathname = usePathname();
  return (
    <>
      <Header prefs={prefs} workspace />
      <div className={s.toolbar}>
        <details className={s.navigationMenu}>
          <summary>{workbenchCopy[prefs.language].navigation}</summary>
          <WorkspaceNavigation
            language={prefs.language}
            activePath={pathname}
            compact
          />
        </details>
        <h1>{title}</h1>
        {!data.ready && (
          <Button variant="primary" onClick={data.demo}>
            {prefs.t.demo}
          </Button>
        )}
        <select
          className={a.select}
          aria-label={prefs.t.history}
          value={data.selected}
          onChange={(e) => data.select(e.target.value)}
        >
          <option value="">{prefs.t.history}</option>
          {data.sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title ?? session.id}
            </option>
          ))}
        </select>
        <Button onClick={data.refresh} title={prefs.t.loading}>
          ↻
        </Button>
        {data.selected && (
          <StatusBadge
            label={data.connected ? prefs.t.connected : prefs.t.disconnected}
            state={data.connected ? "success" : "warning"}
          />
        )}
      </div>
      {data.error && (
        <p role="alert" className={a.error}>
          {data.error}
        </p>
      )}
    </>
  );
}
