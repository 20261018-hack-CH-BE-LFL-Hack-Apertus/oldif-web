import type { Language } from "@/lib/models/types";
import de from "./locales/de.json";
import deCH from "./locales/de-CH.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import rm from "./locales/rm.json";
export const workbenchCopy = {
  en,
  es,
  de,
  "de-CH": deCH,
  fr,
  it,
  rm,
} satisfies Record<Language, Record<string, string>>;
export type ActivityLabel = keyof typeof en;
