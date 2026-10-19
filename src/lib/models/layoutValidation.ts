import { between, bool, exact, integer, oneOf, type Validator } from "./strict";
import type { WorkbenchLayout } from "./workbenchLayout";
export type ArchiveLayout = {
  width: number;
  height: number;
  source: boolean;
  review: boolean;
  reverse: boolean;
};
export const archiveDefault: ArchiveLayout = {
  width: 48,
  height: 60,
  source: true,
  review: true,
  reverse: false,
};
export function validWorkbench(value: unknown): value is WorkbenchLayout {
  return exact(value, {
    version: oneOf(1),
    navigation: bool,
    evidence: bool,
    activity: bool,
    placements: (v): v is unknown =>
      exact(v, {
        evidence: oneOf("right", "bottom"),
        activity: oneOf("right", "bottom"),
      }),
    order: (v): v is unknown =>
      Array.isArray(v) &&
      v.length === 2 &&
      new Set(v).size === 2 &&
      v.every((id) => id === "evidence" || id === "activity"),
    navigationWidth: between(13, 32),
    researchWidth: between(40, 85),
    topHeight: between(30, 85),
    rightSplit: between(20, 80),
    bottomSplit: between(20, 80),
  });
}
export const validArchive = (value: unknown): value is ArchiveLayout =>
  exact(value, {
    width: between(25, 70),
    height: between(25, 75),
    source: bool,
    review: bool,
    reverse: bool,
  });
export type LayoutRecord<T> = {
  scope: string;
  version: number;
  layout: T | null;
};
export function layoutRecord<T>(
  value: unknown,
  scope: string,
  validate: Validator<T>,
): value is LayoutRecord<T> {
  return (
    exact(value, {
      scope: oneOf(scope),
      version: integer,
      layout: (v): v is unknown => v === null || validate(v),
    }) &&
    (value.layout !== null || value.version === 0)
  );
}
