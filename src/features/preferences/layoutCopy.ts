import type { Language } from "@/lib/models/types";
export const layoutCopy: Record<
  Language,
  Record<
    | "loading"
    | "default"
    | "saved"
    | "saving"
    | "offline"
    | "conflict"
    | "invalid"
    | "storage"
    | "remote"
    | "local",
    string
  >
> = {
  en: {
    default: "Default layout",
    loading: "Loading saved layout…",
    saved: "Layout saved to your account",
    saving: "Saving layout…",
    offline:
      "Offline: layout is cached on this device; not saved to your account.",
    conflict:
      "This layout changed on another device. Choose which version to keep.",
    invalid:
      "The saved layout response was invalid. Your local layout is preserved.",
    storage: "Browser storage is unavailable; local changes may be lost.",
    remote: "Use account layout",
    local: "Save this layout",
  },
  es: {
    default: "Diseño predeterminado",
    loading: "Cargando diseño guardado…",
    saved: "Diseño guardado en tu cuenta",
    saving: "Guardando diseño…",
    offline:
      "Sin conexión: el diseño está en este dispositivo; no se ha guardado en tu cuenta.",
    conflict:
      "El diseño cambió en otro dispositivo. Elige qué versión conservar.",
    invalid:
      "La respuesta del diseño guardado no es válida. Se conserva el diseño local.",
    storage:
      "El almacenamiento del navegador no está disponible; los cambios locales pueden perderse.",
    remote: "Usar diseño de la cuenta",
    local: "Guardar este diseño",
  },
  de: {
    default: "Standardlayout",
    loading: "Gespeichertes Layout wird geladen…",
    saved: "Layout im Konto gespeichert",
    saving: "Layout wird gespeichert…",
    offline:
      "Offline: Das Layout liegt auf diesem Gerät und ist nicht im Konto gespeichert.",
    conflict:
      "Das Layout wurde auf einem anderen Gerät geändert. Wähle die gewünschte Version.",
    invalid:
      "Die gespeicherte Layout-Antwort ist ungültig. Das lokale Layout bleibt erhalten.",
    storage:
      "Browserspeicher nicht verfügbar; lokale Änderungen können verloren gehen.",
    remote: "Layout aus Konto verwenden",
    local: "Dieses Layout speichern",
  },
  "de-CH": {
    default: "Standardlayout",
    loading: "Gspeicherts Layout wird glade…",
    saved: "Layout im Konto gspeichert",
    saving: "Layout wird gspeichert…",
    offline: "Offline: S Layout isch uf däm Grät und nöd im Konto gspeichert.",
    conflict:
      "S Layout isch uf eme andere Grät gänderet worde. Wähl d Version, wo du wotsch bhalte.",
    invalid:
      "D Antwort fürs gspeicherte Layout isch ungültig. S lokale Layout bliibt erhalte.",
    storage:
      "Browserspeicher nöd verfüegbar; lokali Änderige chönd verlore gah.",
    remote: "Layout vom Konto verwände",
    local: "Das Layout speichere",
  },
  fr: {
    default: "Disposition par défaut",
    loading: "Chargement de la disposition…",
    saved: "Disposition enregistrée dans votre compte",
    saving: "Enregistrement de la disposition…",
    offline:
      "Hors ligne : la disposition est conservée sur cet appareil, pas dans votre compte.",
    conflict:
      "La disposition a changé sur un autre appareil. Choisissez la version à conserver.",
    invalid:
      "La réponse de disposition est invalide. La disposition locale est conservée.",
    storage:
      "Le stockage du navigateur est indisponible ; les modifications locales peuvent être perdues.",
    remote: "Utiliser la disposition du compte",
    local: "Enregistrer cette disposition",
  },
  it: {
    default: "Disposizione predefinita",
    loading: "Caricamento della disposizione…",
    saved: "Disposizione salvata nel tuo account",
    saving: "Salvataggio della disposizione…",
    offline:
      "Offline: la disposizione è su questo dispositivo, non nel tuo account.",
    conflict:
      "La disposizione è cambiata su un altro dispositivo. Scegli la versione da mantenere.",
    invalid:
      "La risposta della disposizione non è valida. La versione locale viene conservata.",
    storage:
      "Memoria del browser non disponibile; le modifiche locali potrebbero andare perse.",
    remote: "Usa disposizione dell’account",
    local: "Salva questa disposizione",
  },
  rm: {
    default: "Disposiziun da standard",
    loading: "Chargiar la disposiziun memorisada…",
    saved: "Disposiziun memorisada en tes conto",
    saving: "Memorisar la disposiziun…",
    offline:
      "Offline: la disposiziun è sin quest apparat, betg memorisada en tes conto.",
    conflict:
      "La disposiziun è vegnida midada sin in auter apparat. Tscherna la versiun da mantegnair.",
    invalid:
      "La resposta da la disposiziun è nunvalida. La disposiziun locala vegn mantegnida.",
    storage:
      "La memoria dal navigatur n’è betg disponibla; midadas localas pon ir a perder.",
    remote: "Duvrar la disposiziun dal conto",
    local: "Memorisar questa disposiziun",
  },
};
