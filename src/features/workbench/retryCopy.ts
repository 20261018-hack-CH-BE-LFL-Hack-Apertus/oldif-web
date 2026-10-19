import type { Language } from "@/lib/models/types";
export const retryCopy: Record<Language, string> = {
  en: "Retry this request",
  es: "Reintentar esta solicitud",
  de: "Diese Anfrage erneut versuchen",
  "de-CH": "Die Aafrag nomal versueche",
  fr: "Réessayer cette demande",
  it: "Riprova questa richiesta",
  rm: "Empruvar danovamain questa dumonda",
};
export const draftCopy: Record<Language, [string, string]> = {
  en: [
    "Draft saved on this device only",
    "Draft storage unavailable; keep this tab open",
  ],
  es: [
    "Borrador guardado solo en este dispositivo",
    "Borrador sin guardar; mantén esta pestaña abierta",
  ],
  de: [
    "Entwurf nur auf diesem Gerät gespeichert",
    "Entwurfsspeicher nicht verfügbar; Tab geöffnet lassen",
  ],
  "de-CH": [
    "Entwurf nur uf däm Grät gspeichert",
    "Entwurfsspeicher nöd verfüegbar; Tab offe lah",
  ],
  fr: [
    "Brouillon conservé uniquement sur cet appareil",
    "Stockage indisponible ; gardez cet onglet ouvert",
  ],
  it: [
    "Bozza salvata solo su questo dispositivo",
    "Memoria non disponibile; tieni aperta questa scheda",
  ],
  rm: [
    "Sboz memorisà mo sin quest apparat",
    "Memoria betg disponibla; lascha avert quest tab",
  ],
};
export const providerConsentCopy: Record<Language, string> = {
  en: "I allow the selected uploaded documents to be processed by the model provider.",
  es: "Permito que el proveedor del modelo procese los documentos cargados seleccionados.",
  de: "Ich erlaube dem Modellanbieter, die ausgewählten hochgeladenen Dokumente zu verarbeiten.",
  "de-CH":
    "Ich erlaube em Modellabüter, die usgwählte ufgladene Dokument z verarbeite.",
  fr: "J’autorise le fournisseur du modèle à traiter les documents téléversés sélectionnés.",
  it: "Autorizzo il fornitore del modello a elaborare i documenti caricati selezionati.",
  rm: "Jau permet al purschider dal model da tractar ils documents chargiads e tschernids.",
};
