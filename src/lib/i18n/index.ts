import type { Language } from "../models/types";
import de from "./de.json";
import swiss from "./de-CH.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import it from "./it.json";
import rm from "./rm.json";
export const languages: { id: Language; name: string }[] = [
  { id: "en", name: "English" },
  { id: "es", name: "Español" },
  { id: "de", name: "Deutsch" },
  { id: "de-CH", name: "Schwiizerdütsch" },
  { id: "fr", name: "Français" },
  { id: "it", name: "Italiano" },
  { id: "rm", name: "Rumantsch" },
];
export const dictionaries = { en, es, de, "de-CH": swiss, fr, it, rm };
export type Copy = typeof en;
