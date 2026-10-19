import type { LayoutStatus } from "@/lib/api/layoutStore";
import type { Language } from "@/lib/models/types";
import s from "./LayoutSyncStatus.module.css";
import { layoutCopy } from "./layoutCopy";

type Settings = {
  status: LayoutStatus;
  storageError: boolean;
  resolve: (keepLocal: boolean) => Promise<void>;
};
export function LayoutSyncStatus({
  settings,
  language,
}: {
  settings: Settings;
  language: Language;
}) {
  const t = layoutCopy[language];
  return (
    <div className={s.status} data-layout-status={settings.status}>
      <output aria-live="polite">
        {t[settings.status]}
        {settings.storageError ? ` · ${t.storage}` : ""}
      </output>
      {settings.status === "conflict" && (
        <div className={s.actions}>
          <button type="button" onClick={() => void settings.resolve(false)}>
            {t.remote}
          </button>
          <button type="button" onClick={() => void settings.resolve(true)}>
            {t.local}
          </button>
        </div>
      )}
    </div>
  );
}
