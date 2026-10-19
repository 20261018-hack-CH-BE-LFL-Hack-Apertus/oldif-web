"use client";
import { useRef } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { Header } from "../workbench/Header";
import { reportCopy } from "./copy";
import { printReport } from "./print";
import { ReportPage } from "./ReportPage";
import { ReportToolbar } from "./ReportToolbar";
import s from "./styles";
export function TechnicalReport() {
  const prefs = usePreferences();
  const copy = reportCopy[prefs.language];
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root} className={s.reportRoot} lang={prefs.language}>
      <div className={s.noPrint}>
        <Header prefs={prefs} workspace />
        <ReportToolbar
          copy={copy}
          print={() => void printReport(root.current)}
        />
      </div>
      <main className={s.sheets}>
        {copy.pages.map((p, i) => (
          <ReportPage key={p.label} index={i} copy={copy} />
        ))}
      </main>
    </div>
  );
}
