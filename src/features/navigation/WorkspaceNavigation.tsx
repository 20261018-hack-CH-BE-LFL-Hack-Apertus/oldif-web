"use client";
import Link from "next/link";
import type { Language } from "@/lib/models/types";
import s from "./NavigationStyles.module.css";
import { navigationCopy } from "./navigationCopy";

const groups = [
  {
    label: "research",
    items: [
      ["workspace", "/app", "◌"],
      ["data", "/data", "▤"],
      ["archive", "/archive", "▱"],
    ],
  },
  {
    label: "knowledge",
    items: [
      ["ontology", "/ontology", "◇"],
      ["graph", "/graph", "⌘"],
      ["labels", "/labels", "⌑"],
      ["canvas", "/canvas", "▧"],
    ],
  },
  {
    label: "evaluation",
    items: [
      ["results", "/results", "↗"],
      ["benchmarks", "/benchmarks", "⇄"],
      ["agents", "/agents", "⋈"],
    ],
  },
  {
    label: "project",
    items: [
      ["report", "/tech-report", "≡"],
      ["deck", "/deck/202610191111", "▣"],
    ],
  },
] as const;
export function WorkspaceNavigation({
  language,
  activePath,
  onNavigate,
  compact = false,
}: {
  language: Language;
  activePath: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const t = navigationCopy[language];
  return (
    <nav
      aria-label={t.navigation}
      className={s.navigation}
      data-compact={compact}
    >
      {groups.map((group) => (
        <details key={group.label} className={s.group} open>
          <summary>{t[group.label]}</summary>
          <div className={s.links}>
            {group.items.map(([label, href, icon]) => (
              <Link
                key={href}
                href={href}
                className={s.link}
                aria-current={activePath === href ? "page" : undefined}
                onClick={onNavigate}
              >
                <span aria-hidden="true" className={s.icon}>
                  {icon}
                </span>
                <span>{t[label]}</span>
              </Link>
            ))}
          </div>
        </details>
      ))}
    </nav>
  );
}
