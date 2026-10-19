import type { Language } from "@/lib/models/types";
const order: Language[] = ["en", "es", "de", "de-CH", "fr", "it", "rm"];
const strings = {
  missingPage: [
    "Missing content or page reported",
    "Contenido o página ausente indicada",
    "Fehlender Inhalt oder fehlende Seite gemeldet",
    "Fehlenden Inhalt oder fehlende Seite gemeldet",
    "Contenu ou page manquante signalée",
    "Contenuto o pagina mancante segnalata",
    "Cuntegn u pagina mancanta annunziada",
  ],
  readingOrder: [
    "Reading order · human assessment",
    "Orden de lectura · evaluación humana",
    "Lesereihenfolge · menschliche Bewertung",
    "Lesereihenfolge · menschliche Beurteilung",
    "Ordre de lecture · évaluation humaine",
    "Ordine di lettura · valutazione umana",
    "Urden da lectura · valitaziun umana",
  ],
  unknown: [
    "Not assessed",
    "Sin evaluar",
    "Nicht bewertet",
    "Nicht beurteilt",
    "Non évalué",
    "Non valutato",
    "Betg valità",
  ],
  verified: [
    "Verified by reviewer",
    "Verificado por revisor",
    "Von prüfender Person bestätigt",
    "Von prüfender Person bestätigt",
    "Vérifié par la personne chargée de la révision",
    "Verificato dal revisore",
    "Verifitgà da la persuna che controlla",
  ],
  uncertain: [
    "Uncertain",
    "Incierto",
    "Unsicher",
    "Unsicher",
    "Incertain",
    "Incerto",
    "Intscher",
  ],
  reviewRequired: [
    "Unresolved missing content, reading order or illegibility keeps this document in review. The original is preserved; no replacement text is invented.",
    "El contenido ausente, orden incierto o ilegibilidad sin resolver mantiene el documento en revisión. Se conserva el original; no se inventa texto de reemplazo.",
    "Ungeklärte Lücken, unsichere Lesereihenfolge oder Unleserlichkeit halten das Dokument in Prüfung. Das Original bleibt erhalten; Ersatztext wird nicht erfunden.",
    "Ungeklärte Lücken, unsichere Lesereihenfolge oder Unleserlichkeit halten das Dokument in Prüfung. Das Original bleibt erhalten; Ersatztext wird nicht erfunden.",
    "Les lacunes, l’ordre incertain ou l’illisibilité non résolus maintiennent le document en révision. L’original est conservé ; aucun texte de remplacement n’est inventé.",
    "Contenuto mancante, ordine incerto o illeggibilità irrisolti mantengono il documento in revisione. L’originale è conservato; non si inventa testo sostitutivo.",
    "Cuntegn mancant, urden intscher u illegibladad betg sclerids mantegnan il document en controlla. L’original vegn conservà; nagin text da remplazzament na vegn inventà.",
  ],
};
export function uncertaintyCopy(language: Language) {
  const index = Math.max(0, order.indexOf(language));
  return Object.fromEntries(
    Object.entries(strings).map(([key, values]) => [key, values[index]]),
  ) as Record<keyof typeof strings, string>;
}
