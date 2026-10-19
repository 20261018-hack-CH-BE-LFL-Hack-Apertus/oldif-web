import type { Language } from "@/lib/models/types";
export const canvasCopy: Record<
  Language,
  {
    move: string;
    guidance: string;
    reset: string;
    source: string;
    graphFallback: string;
  }
> = {
  en: {
    move: "Move activity",
    guidance:
      "Drag a move handle or focus it and use the arrow keys. Positions and source selection are saved to your account.",
    reset: "Reset node positions",
    source: "Selected source",
    graphFallback:
      "The 3D view is unavailable. Use the accessible source table below.",
  },
  es: {
    move: "Mover actividad",
    guidance:
      "Arrastra el control de movimiento o enfócalo y usa las flechas. Las posiciones y la fuente seleccionada se guardan en tu cuenta.",
    reset: "Restablecer posiciones",
    source: "Fuente seleccionada",
    graphFallback:
      "La vista 3D no está disponible. Usa la tabla de fuentes accesible de abajo.",
  },
  de: {
    move: "Aktivität verschieben",
    guidance:
      "Ziehe den Griff oder fokussiere ihn und nutze die Pfeiltasten. Positionen und Quellenauswahl werden im Konto gespeichert.",
    reset: "Knotenpositionen zurücksetzen",
    source: "Ausgewählte Quelle",
    graphFallback:
      "Die 3D-Ansicht ist nicht verfügbar. Nutze die barrierefreie Quellentabelle unten.",
  },
  "de-CH": {
    move: "Aktivität verschiebe",
    guidance:
      "Zieh am Griff oder fokussier ihn und nutz d Pfeiltaste. Positione und Quellewahl werded im Konto gspeichert.",
    reset: "Knotepositione zruggsetze",
    source: "Usgwählti Quälle",
    graphFallback:
      "D 3D-Ansicht isch nöd verfüegbar. Nutz d barrierefreii Quelletabelle unde.",
  },
  fr: {
    move: "Déplacer l’activité",
    guidance:
      "Faites glisser la poignée ou sélectionnez-la et utilisez les flèches. Les positions et la source sélectionnée sont enregistrées dans votre compte.",
    reset: "Réinitialiser les positions",
    source: "Source sélectionnée",
    graphFallback:
      "La vue 3D est indisponible. Utilisez le tableau de sources accessible ci-dessous.",
  },
  it: {
    move: "Sposta attività",
    guidance:
      "Trascina la maniglia oppure selezionala e usa le frecce. Le posizioni e la fonte selezionata vengono salvate nel tuo account.",
    reset: "Reimposta posizioni",
    source: "Fonte selezionata",
    graphFallback:
      "La vista 3D non è disponibile. Usa la tabella delle fonti accessibile qui sotto.",
  },
  rm: {
    move: "Spustar activitad",
    guidance:
      "Tira il manetsch u focussescha el e dovra las frizzas. Las posiziuns e la funtauna tschernida vegnan memorisadas en tes conto.",
    reset: "Reinizialisar las posiziuns",
    source: "Funtauna tschernida",
    graphFallback:
      "La vista 3D n’è betg disponibla. Dovra la tabella accessibla da las funtaunas sutvart.",
  },
};
