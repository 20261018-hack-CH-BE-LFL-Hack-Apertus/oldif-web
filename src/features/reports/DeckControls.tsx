import Link from "next/link";
import { Button } from "oldif-web-ui-components";
import type { ReportCopy } from "./copy";
import s from "./styles";

type Controls = {
  copy: ReportCopy;
  index: number;
  setIndex: (index: number) => void;
  fullscreen: boolean;
  toggle: () => void;
  print: () => void;
};
function SlideNavigation({
  copy,
  index,
  setIndex,
}: Pick<Controls, "copy" | "index" | "setIndex">) {
  return (
    <>
      <Button
        variant="secondary"
        disabled={index === 0}
        onClick={() => setIndex(index - 1)}
      >
        ← {copy.previous}
      </Button>
      <span aria-live="polite">
        {copy.page} {index + 1} / {copy.pages.length}
      </span>
      <Button
        disabled={index === copy.pages.length - 1}
        onClick={() => setIndex(index + 1)}
      >
        {copy.next} →
      </Button>
    </>
  );
}
export function DeckControls(props: Controls) {
  const { copy, fullscreen, toggle, print } = props;
  return (
    <nav className={s.deckControls} aria-label={copy.pitch}>
      <SlideNavigation {...props} />
      <Button variant="secondary" onClick={toggle}>
        {fullscreen ? copy.exitFullscreen : copy.fullscreen}
      </Button>
      <Button variant="secondary" onClick={print}>
        {copy.exportPdf} ↓
      </Button>
      <Link href="/tech-report">{copy.technical} ↗</Link>
    </nav>
  );
}

export function DeckFooter(props: Controls & { error: boolean }) {
  return (
    <div className={s.noPrint}>
      <DeckControls {...props} />
      <p className={s.keyboard}>{props.copy.keyboard}</p>
      {props.error && (
        <output className={s.keyboard}>{props.copy.fullscreenError}</output>
      )}
    </div>
  );
}
