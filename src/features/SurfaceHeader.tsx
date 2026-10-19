"use client";
import { Button } from "oldif-web-ui-components";
import a from "@/features/workbench/AppStyles.module.css";
import { Header } from "@/features/workbench/Header";
import type { ReturnTypePreferences } from "@/features/workbench/types";
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
  return (
    <>
      <Header prefs={prefs} workspace />
      <div className={s.toolbar}>
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
      </div>
      {data.error && (
        <p role="alert" className={a.error}>
          {data.error}
        </p>
      )}
    </>
  );
}
