import type { Language } from "@/lib/models/types";
export const assertionCopy: Record<
  Language,
  Record<
    | "heading"
    | "notice"
    | "conflict"
    | "source"
    | "title"
    | "date"
    | "entity"
    | "relation"
    | "rejected",
    string
  >
> = {
  en: {
    heading: "Proposed assertions",
    notice:
      "Source-linked proposals require human review. Exact quotation does not establish historical truth.",
    conflict: "Potential conflict · alternative claims retained",
    source: "Inspect original passage",
    title: "Title",
    date: "Date",
    entity: "Entity",
    relation: "Relation",
    rejected: "Proposals rejected by validation",
  },
  es: {
    heading: "Afirmaciones propuestas",
    notice:
      "Las propuestas vinculadas a fuentes requieren revisión humana. Una cita exacta no establece la verdad histórica.",
    conflict: "Posible conflicto · se conservan las afirmaciones alternativas",
    source: "Inspeccionar pasaje original",
    title: "Título",
    date: "Fecha",
    entity: "Entidad",
    relation: "Relación",
    rejected: "Propuestas rechazadas por la validación",
  },
  de: {
    heading: "Vorgeschlagene Aussagen",
    notice:
      "Quellenbezogene Vorschläge erfordern menschliche Prüfung. Ein exaktes Zitat belegt keine historische Wahrheit.",
    conflict: "Möglicher Konflikt · alternative Aussagen bleiben erhalten",
    source: "Originalpassage prüfen",
    title: "Titel",
    date: "Datum",
    entity: "Entität",
    relation: "Beziehung",
    rejected: "Durch Validierung verworfene Vorschläge",
  },
  "de-CH": {
    heading: "Vorgschlagni Ussage",
    notice:
      "Quellebezogeni Vorschläg bruuched menschlichi Prüefig. Es exakts Zitat bewiist kei historischi Wahrheit.",
    conflict: "Mögliche Konflikt · alternativi Ussage bliibed erhalte",
    source: "Originalpassage prüefe",
    title: "Titel",
    date: "Datum",
    entity: "Entität",
    relation: "Beziehig",
    rejected: "Bi de Validierig verworfeni Vorschläg",
  },
  fr: {
    heading: "Affirmations proposées",
    notice:
      "Les propositions liées aux sources nécessitent une vérification humaine. Une citation exacte ne prouve pas la vérité historique.",
    conflict: "Conflit potentiel · affirmations alternatives conservées",
    source: "Examiner le passage original",
    title: "Titre",
    date: "Date",
    entity: "Entité",
    relation: "Relation",
    rejected: "Propositions rejetées par la validation",
  },
  it: {
    heading: "Affermazioni proposte",
    notice:
      "Le proposte collegate alle fonti richiedono revisione umana. Una citazione esatta non dimostra la verità storica.",
    conflict: "Possibile conflitto · affermazioni alternative conservate",
    source: "Esamina il passaggio originale",
    title: "Titolo",
    date: "Data",
    entity: "Entità",
    relation: "Relazione",
    rejected: "Proposte rifiutate dalla validazione",
  },
  rm: {
    heading: "Affirmaziuns proponidas",
    notice:
      "Propostas colliadas cun funtaunas dovran ina revisiun umana. In citat exact na cumprova betg la vardad istorica.",
    conflict: "Conflict pussaivel · affirmaziuns alternativas mantegnidas",
    source: "Examinar il passadi original",
    title: "Titel",
    date: "Data",
    entity: "Entitad",
    relation: "Relaziun",
    rejected: "Propostas refusadas da la validaziun",
  },
};
