import type { Language } from "@/lib/models/types";
import de from "./locales/de.json";
import deCH from "./locales/de-CH.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import rm from "./locales/rm.json";
export type ReportCopy = typeof en;
export const reportCopy: Record<Language, ReportCopy> = {
  en,
  es,
  de,
  fr,
  it,
  rm,
  "de-CH": deCH,
};
