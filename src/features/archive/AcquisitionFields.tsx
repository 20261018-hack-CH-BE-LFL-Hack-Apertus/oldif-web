import type { AcquisitionDraft } from "./acquisition";
import { allowedUses } from "./acquisition";
import type { acquisitionCopy } from "./acquisitionCopy";
import s from "./ArchiveStyles.module.css";
export function AcquisitionFields({
  value,
  change,
  t,
  disabled,
}: {
  value: AcquisitionDraft;
  change: (value: AcquisitionDraft) => void;
  t: ReturnType<typeof acquisitionCopy>;
  disabled: boolean;
}) {
  return (
    <fieldset className={s.stack} disabled={disabled}>
      <legend>{t.title}</legend>
      <p className={s.muted}>{t.guidance}</p>
      {(
        [
          ["dataset_uri", t.dataset],
          ["distribution_uri", t.distribution],
          ["retrieved_at", t.retrieved],
        ] as const
      ).map(([key, label]) => (
        <label className={s.field} key={key}>
          {label}
          <input
            value={value[key]}
            onChange={(e) => change({ ...value, [key]: e.target.value })}
            maxLength={key === "retrieved_at" ? 40 : 2048}
          />
        </label>
      ))}
      {allowedUses.map((use) => (
        <label className={s.check} key={use}>
          <input
            type="checkbox"
            checked={value.allowed_uses.includes(use)}
            onChange={(e) =>
              change({
                ...value,
                allowed_uses: e.target.checked
                  ? [...value.allowed_uses, use]
                  : value.allowed_uses.filter((item) => item !== use),
              })
            }
          />
          {t[use]}
        </label>
      ))}
    </fieldset>
  );
}
