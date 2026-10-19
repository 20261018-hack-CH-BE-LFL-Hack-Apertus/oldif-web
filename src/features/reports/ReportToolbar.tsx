import Link from "next/link";
import { Button } from "oldif-web-ui-components";
import type { ReportCopy } from "./copy";
import s from "./styles";
export function ReportToolbar({
  copy,
  print,
}: {
  copy: ReportCopy;
  print: () => void;
}) {
  return (
    <>
      <div className={s.toolbar}>
        <div>
          <h1>{copy.technical}</h1>
          <p>{copy.printHint}</p>
        </div>
        <Button onClick={print}>{copy.exportPdf} ↓</Button>
        <Link href="/app">{copy.openWorkspace} ↗</Link>
      </div>
      <nav className={s.contents} aria-label={copy.contents}>
        {copy.pages.map((p, i) => (
          <a key={p.label} href={`#report-${i + 1}`}>
            {p.label}
          </a>
        ))}
      </nav>
    </>
  );
}
