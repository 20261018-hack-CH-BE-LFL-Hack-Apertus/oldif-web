"use client";
import { PanelFrame, SplitPane } from "oldif-web-ui-components";
import { type ReactNode, useState } from "react";
import { navigationCopy } from "@/features/navigation/navigationCopy";
import { LayoutSyncStatus } from "@/features/preferences/LayoutSyncStatus";
import type { useWorkbenchLayout } from "@/hooks/useWorkbenchLayout";
import type { Language } from "@/lib/models/types";
import type { PanelId } from "@/lib/models/workbenchLayout";
import s from "./WorkbenchStyles.module.css";
import { workbenchCopy } from "./workbenchCopy";
export type MobilePanel = "research" | "navigation" | PanelId;
type Props = {
  settings: ReturnType<typeof useWorkbenchLayout>;
  language: Language;
  sidebar: ReactNode;
  children: ReactNode;
  evidence: ReactNode;
  activity: ReactNode;
  mobilePanel: MobilePanel;
  onMobilePanel: (panel: MobilePanel) => void;
};
export function WorkspacePanels({
  settings,
  language,
  sidebar,
  children,
  evidence,
  activity,
  mobilePanel,
  onMobilePanel,
}: Props) {
  const { layout, update, reset } = settings;
  const t = workbenchCopy[language];
  const [menuOpen, setMenuOpen] = useState(false);
  const content = { evidence, activity };
  function close(panel: PanelId) {
    update({ [panel]: false });
    onMobilePanel("research");
  }
  function frame(panel: PanelId) {
    const position = layout.placements[panel];
    return (
      <div
        className={s.panelSlot}
        data-mobile-selected={mobilePanel === panel}
        key={panel}
      >
        <PanelFrame
          title={t[panel]}
          closeLabel={`${t.hide} ${t[panel]}`}
          onClose={() => close(panel)}
          actions={
            <>
              <button
                className={s.desktopAction}
                type="button"
                title={position === "right" ? t.moveBottom : t.moveRight}
                aria-label={`${position === "right" ? t.moveBottom : t.moveRight}: ${t[panel]}`}
                onClick={() =>
                  update({
                    placements: {
                      ...layout.placements,
                      [panel]: position === "right" ? "bottom" : "right",
                    },
                  })
                }
              >
                {position === "right" ? "↓" : "↗"}
              </button>
              <button
                className={s.desktopAction}
                type="button"
                title={t.swap}
                aria-label={t.swap}
                onClick={() => update({ order: [...layout.order].reverse() })}
              >
                ⇄
              </button>
            </>
          }
        >
          {content[panel]}
        </PanelFrame>
      </div>
    );
  }
  function dock(position: "right" | "bottom") {
    const panels = layout.order.filter(
      (panel) => layout[panel] && layout.placements[panel] === position,
    );
    if (!panels.length) return null;
    if (panels.length === 1) return frame(panels[0]);
    return (
      <SplitPane
        direction={position === "right" ? "vertical" : "horizontal"}
        value={position === "right" ? layout.rightSplit : layout.bottomSplit}
        onChange={(value) =>
          update(
            position === "right"
              ? { rightSplit: value }
              : { bottomSplit: value },
          )
        }
        min={20}
        max={80}
        label={t.resizePanels}
        first={frame(panels[0])}
        second={frame(panels[1])}
      />
    );
  }
  const right = dock("right");
  const bottom = dock("bottom");
  let workspace = (
    <div
      className={s.researchSlot}
      data-mobile-selected={mobilePanel === "research"}
    >
      {children}
    </div>
  );
  if (right)
    workspace = (
      <SplitPane
        direction="horizontal"
        value={layout.researchWidth}
        onChange={(researchWidth) => update({ researchWidth })}
        min={40}
        max={85}
        label={t.resizeResearch}
        first={workspace}
        second={right}
      />
    );
  if (bottom)
    workspace = (
      <SplitPane
        direction="vertical"
        value={layout.topHeight}
        onChange={(topHeight) => update({ topHeight })}
        min={30}
        max={85}
        label={t.resizeBottom}
        first={workspace}
        second={bottom}
      />
    );
  if (layout.navigation)
    workspace = (
      <SplitPane
        direction="horizontal"
        value={layout.navigationWidth}
        onChange={(navigationWidth) => update({ navigationWidth })}
        min={13}
        max={32}
        label={t.resizeNavigation}
        first={
          <div
            className={s.navigationSlot}
            data-mobile-selected={mobilePanel === "navigation"}
          >
            {sidebar}
          </div>
        }
        second={workspace}
      />
    );
  return (
    <main className={s.workspace}>
      <section className={s.toolbar} aria-label={t.layout}>
        <div className={s.desktopControls}>
          {(["navigation", "evidence", "activity"] as const).map((panel) => (
            <button
              type="button"
              key={panel}
              aria-pressed={layout[panel]}
              title={`${layout[panel] ? t.hide : t.show} ${t[panel]}`}
              onClick={() => update({ [panel]: !layout[panel] })}
            >
              {t[panel]}
            </button>
          ))}
        </div>
        <div className={s.mobileControls}>
          {(["research", "navigation", "evidence", "activity"] as const).map(
            (panel) => (
              <button
                type="button"
                key={panel}
                aria-pressed={mobilePanel === panel}
                onClick={() => {
                  if (panel !== "research") update({ [panel]: true });
                  onMobilePanel(panel);
                }}
              >
                {panel === "research"
                  ? navigationCopy[language].research
                  : t[panel]}
              </button>
            ),
          )}
        </div>
        <details
          className={s.layoutMenu}
          open={menuOpen}
          onToggle={(event) => setMenuOpen(event.currentTarget.open)}
        >
          <summary aria-label={t.layout} title={t.layout}>
            ⚙
          </summary>
          <div>
            <button
              type="button"
              onClick={() => {
                reset();
                onMobilePanel("research");
                setMenuOpen(false);
              }}
            >
              {t.reset}
            </button>
          </div>
        </details>
      </section>
      <LayoutSyncStatus settings={settings} language={language} />
      <div className={s.workspaceBody}>{workspace}</div>
    </main>
  );
}
