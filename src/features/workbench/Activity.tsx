"use client";
import { useEffect, useState } from "react";
import type { Language, Run } from "@/lib/models/types";
import s from "./ActivityStyles.module.css";
import { type ActivityItem, summarizeActivity } from "./activityModel";
import { workbenchCopy } from "./workbenchCopy";

function ActivityRow({
  item,
  language,
}: {
  item: ActivityItem;
  language: Language;
}) {
  const t = workbenchCopy[language];
  return (
    <li className={s.activityRow} data-state={item.state}>
      <span
        className={item.state === "running" ? s.spinner : s.activitySymbol}
        aria-hidden="true"
      >
        {item.state === "running"
          ? ""
          : item.state === "done"
            ? "✓"
            : item.state === "error"
              ? "!"
              : "·"}
      </span>
      <div>
        <span>{t[item.label]}</span>
        {item.detail && <p className={s.activityDetail}>{item.detail}</p>}
      </div>
      <span className={s.activityState}>
        {item.durationMs != null
          ? `${(item.durationMs / 1000).toLocaleString(language, { maximumFractionDigits: 1 })} s`
          : item.state === "running"
            ? ""
            : item.state === "done"
              ? t.completed
              : item.state === "error"
                ? t.failed
                : item.state === "stopped"
                  ? t.stopped
                  : t.reviewNeeded}
      </span>
    </li>
  );
}
function Elapsed({
  startedAt,
  language,
}: {
  startedAt?: number;
  language: Language;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!startedAt || !Number.isFinite(startedAt)) return null;
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  return (
    <span
      className={s.elapsed}
      title={`${workbenchCopy[language].elapsed}: ${seconds} s`}
      aria-hidden="true"
    >
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
    </span>
  );
}
export function Activity({
  run,
  language,
  expanded = false,
}: {
  run?: Run;
  language: Language;
  expanded?: boolean;
}) {
  const t = workbenchCopy[language];
  const items = summarizeActivity(run?.traces ?? [], run?.status ?? "done");
  const running = run?.status === "running";
  const latest =
    items.findLast((item) => item.state === "running") ?? items.at(-1);
  return (
    <div className={s.activity}>
      <output className={s.activityHeading}>
        <span
          className={running ? s.spinner : s.activitySymbol}
          aria-hidden="true"
        >
          {running ? "" : "◌"}
        </span>
        <span>
          {running
            ? latest?.state === "running"
              ? t[latest.label]
              : t.waiting
            : t.activity}
        </span>
        {running ? (
          <Elapsed startedAt={run?.startedAt} language={language} />
        ) : (
          items.length > 0 && (
            <span className={s.elapsed}>
              {items.length} {t.steps}
            </span>
          )
        )}
      </output>
      {!run && <p className={s.muted}>{t.noActivity}</p>}
      {items.length > 0 && (
        <details className={s.activityDetails} open={expanded || undefined}>
          <summary>
            {t.allActivity} · {items.length}
          </summary>
          <ol className={s.activityList}>
            {items.map((item) => (
              <ActivityRow key={item.id} item={item} language={language} />
            ))}
          </ol>
          <details className={s.technical}>
            <summary>{t.technical}</summary>
            <pre>{JSON.stringify(run?.traces, null, 2)}</pre>
          </details>
        </details>
      )}
    </div>
  );
}
