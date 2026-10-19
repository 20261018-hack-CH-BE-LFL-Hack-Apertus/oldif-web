export type PanelId = "evidence" | "activity";
export type WorkbenchLayout = {
  version: 1;
  navigation: boolean;
  evidence: boolean;
  activity: boolean;
  placements: Record<PanelId, "right" | "bottom">;
  order: PanelId[];
  navigationWidth: number;
  researchWidth: number;
  topHeight: number;
  rightSplit: number;
  bottomSplit: number;
};
export const defaultLayout: WorkbenchLayout = {
  version: 1,
  navigation: true,
  evidence: true,
  activity: false,
  placements: { evidence: "right", activity: "right" },
  order: ["evidence", "activity"],
  navigationWidth: 20,
  researchWidth: 70,
  topHeight: 65,
  rightSplit: 55,
  bottomSplit: 55,
};
const bounded = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
export function layoutKey(userId: string): string | undefined {
  return userId ? `oldif.layout.v1:${encodeURIComponent(userId)}` : undefined;
}
export function parseLayout(value: unknown): WorkbenchLayout {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return defaultLayout;
  const data = value as Record<string, unknown>;
  if (data.version !== 1) return defaultLayout;
  const placements = data.placements as
    | Partial<WorkbenchLayout["placements"]>
    | undefined;
  return {
    version: 1,
    navigation: typeof data.navigation === "boolean" ? data.navigation : true,
    evidence: typeof data.evidence === "boolean" ? data.evidence : true,
    activity: typeof data.activity === "boolean" ? data.activity : false,
    placements: {
      evidence: placements?.evidence === "bottom" ? "bottom" : "right",
      activity: placements?.activity === "bottom" ? "bottom" : "right",
    },
    order:
      Array.isArray(data.order) &&
      data.order.length === 2 &&
      data.order[0] === "activity" &&
      data.order[1] === "evidence"
        ? ["activity", "evidence"]
        : ["evidence", "activity"],
    navigationWidth: bounded(data.navigationWidth, 20, 13, 32),
    researchWidth: bounded(data.researchWidth, 70, 40, 85),
    topHeight: bounded(data.topHeight, 65, 30, 85),
    rightSplit: bounded(data.rightSplit, 55, 20, 80),
    bottomSplit: bounded(data.bottomSplit, 55, 20, 80),
  };
}
