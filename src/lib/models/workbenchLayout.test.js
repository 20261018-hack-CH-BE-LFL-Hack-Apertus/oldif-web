import { expect, test } from "bun:test";
import { defaultLayout, layoutKey, parseLayout } from "./workbenchLayout";

test("layout keys isolate users and anonymous views cannot persist", () => {
  expect(layoutKey("")).toBeUndefined();
  expect(layoutKey("user-a")).not.toBe(layoutKey("user-b"));
});
test("malformed or old preferences reset to a usable layout", () => {
  expect(parseLayout(null)).toEqual(defaultLayout);
  expect(parseLayout({ version: 0, navigation: false })).toEqual(defaultLayout);
  const layout = parseLayout({
    version: 1,
    navigationWidth: -100,
    researchWidth: Number.NaN,
    order: ["activity", "activity"],
    placements: "bad",
  });
  expect(layout.navigationWidth).toBe(13);
  expect(layout.researchWidth).toBe(70);
  expect(layout.order).toEqual(["evidence", "activity"]);
  expect(layout.placements.evidence).toBe("right");
});
test("visibility, individual docks and ordering survive serialization without foreign fields", () => {
  const saved = {
    ...defaultLayout,
    navigation: false,
    evidence: false,
    activity: true,
    placements: { evidence: "bottom", activity: "right" },
    order: ["activity", "evidence"],
    token: "never-retained",
  };
  const restored = parseLayout(JSON.parse(JSON.stringify(saved)));
  expect(restored.navigation).toBe(false);
  expect(restored.placements.evidence).toBe("bottom");
  expect(restored.order).toEqual(["activity", "evidence"]);
  expect(restored).not.toHaveProperty("token");
});
