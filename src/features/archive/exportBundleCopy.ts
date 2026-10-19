import type { Language } from "@/lib/models/types";

const copy: Record<
  Language,
  { private: string; public: string; gate: string; contents: string }
> = {
  en: {
    private: "Download private bundle",
    public: "Download bundle for public use",
    gate: "Public use requires permission and an accepted human review.",
    contents:
      "Each bundle includes data, schemas, source and change manifests, rejected records and file hashes. Downloading does not publish it.",
  },
  es: {
    private: "Descargar paquete privado",
    public: "Descargar paquete para uso público",
    gate: "El uso público requiere permiso y una revisión humana aceptada.",
    contents:
      "Cada paquete incluye datos, esquemas, manifiestos de fuentes y cambios, registros rechazados y hashes de archivos. Descargarlo no lo publica.",
  },
  de: {
    private: "Privates Paket herunterladen",
    public: "Paket für öffentliche Nutzung herunterladen",
    gate: "Öffentliche Nutzung erfordert eine Berechtigung und eine akzeptierte menschliche Prüfung.",
    contents:
      "Jedes Paket enthält Daten, Schemas, Quellen- und Änderungsverzeichnisse, abgelehnte Datensätze und Datei-Hashes. Der Download veröffentlicht nichts.",
  },
  "de-CH": {
    private: "Privates Paket herunterladen",
    public: "Paket für öffentliche Nutzung herunterladen",
    gate: "Öffentliche Nutzung erfordert eine Berechtigung und eine akzeptierte menschliche Prüfung.",
    contents:
      "Jedes Paket enthält Daten, Schemas, Quellen- und Änderungsverzeichnisse, abgelehnte Datensätze und Datei-Hashes. Der Download veröffentlicht nichts.",
  },
  fr: {
    private: "Télécharger le paquet privé",
    public: "Télécharger le paquet pour usage public",
    gate: "L’usage public nécessite une autorisation et une révision humaine acceptée.",
    contents:
      "Chaque paquet contient les données, schémas, manifestes des sources et changements, enregistrements rejetés et empreintes des fichiers. Le téléchargement ne le publie pas.",
  },
  it: {
    private: "Scarica il pacchetto privato",
    public: "Scarica il pacchetto per uso pubblico",
    gate: "L’uso pubblico richiede il permesso e una revisione umana accettata.",
    contents:
      "Ogni pacchetto include dati, schemi, manifesti delle fonti e modifiche, record rifiutati e hash dei file. Il download non lo pubblica.",
  },
  rm: {
    private: "Telechargiar il pachet privat",
    public: "Telechargiar il pachet per diever public",
    gate: "Il diever public dovra ina permissiun ed ina controlla umana acceptada.",
    contents:
      "Mintga pachet cuntegna datas, schemas, glistas da funtaunas e midadas, endataziuns refusadas e hash da datotecas. Telechargiar na publitgescha betg il pachet.",
  },
};

export function exportBundleCopy(language: Language) {
  return copy[language];
}
