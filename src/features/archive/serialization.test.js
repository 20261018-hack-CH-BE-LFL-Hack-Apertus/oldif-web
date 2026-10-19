import { expect, test } from "bun:test";
import { asciiJson, parseLabels } from "./serialization";
test("metadata survives ASCII-only headers without losing accents or surrogate pairs", () => {
  const value = { title: "École Zürich — 🗃️", licence: "Autorisé\nlocal" };
  const header = asciiJson(value);
  expect(/[^\x20-\x7e]/.test(header)).toBe(false);
  expect(JSON.parse(header)).toEqual(value);
});
test("labels are parsed only on save and duplicate labels are removed", () => {
  expect(parseLabels("école, archives, école, ,")).toEqual([
    "école",
    "archives",
  ]);
});
