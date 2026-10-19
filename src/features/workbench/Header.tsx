"use client";
import Link from "next/link";
import { StatusBadge } from "oldif-web-ui-components";
import { languages } from "@/lib/i18n";
import type { Language } from "@/lib/models/types";
import s from "./AppStyles.module.css";
import type { ReturnTypePreferences } from "./types";
export function Header({
  prefs,
  workspace = false,
}: {
  prefs: ReturnTypePreferences;
  workspace?: boolean;
}) {
  return (
    <header className={s.topbar}>
      <Link href="/" className={s.brand} aria-label="Oldif">
        <span className={s.brandMark} aria-hidden="true">
          o.
        </span>
        oldif
        <StatusBadge label="Hack Apertus" />
      </Link>
      <div className={s.controls}>
        <select
          className={s.select}
          value={prefs.language}
          onChange={(e) => prefs.setLanguage(e.target.value as Language)}
          aria-label={prefs.t.language}
          title={prefs.t.language}
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={s.iconButton}
          onClick={prefs.toggleTheme}
          aria-label={prefs.t.theme}
          title={prefs.t.theme}
        >
          {prefs.dark ? "☀" : "☾"}
        </button>
        {workspace ? (
          <Link className={s.button} href="/deck/202610191111">
            {prefs.t.pitch} ↗
          </Link>
        ) : (
          <Link className={s.button} href="/login">
            {prefs.t.signIn} ↗
          </Link>
        )}
      </div>
    </header>
  );
}
