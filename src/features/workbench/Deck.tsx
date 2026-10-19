"use client";
import { usePreferences } from "@/hooks/usePreferences";
import { reportCopy } from "../reports/copy";
import { DeckFooter } from "../reports/DeckControls";
import { DeckSlides } from "../reports/DeckSlides";
import { printReport } from "../reports/print";
import s from "../reports/styles";
import { useDeck } from "../reports/useDeck";
import { Header } from "./Header";
export function Deck() {
  const prefs = usePreferences();
  const copy = reportCopy[prefs.language];
  const deck = useDeck(copy.pages.length);
  return (
    <div className={s.deckRoot} ref={deck.root} lang={prefs.language}>
      <div className={s.noPrint}>
        <Header prefs={prefs} workspace />
      </div>
      <DeckSlides copy={copy} index={deck.index} />
      <DeckFooter
        {...deck}
        copy={copy}
        toggle={() => void deck.toggle()}
        print={() => void printReport(deck.root.current)}
      />
    </div>
  );
}
