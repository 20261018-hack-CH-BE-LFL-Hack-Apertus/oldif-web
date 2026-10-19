import type { ReportCopy } from "./copy";
import { ReportPage } from "./ReportPage";
import s from "./styles";
export function DeckSlides({
  copy,
  index,
}: {
  copy: ReportCopy;
  index: number;
}) {
  return (
    <main className={s.stage}>
      {copy.pages.map((p, i) => (
        <ReportPage
          key={p.label}
          copy={copy}
          index={i}
          deck
          active={i === index}
        />
      ))}
    </main>
  );
}
