import { expect, test } from "bun:test";
import { asciiJson, editableAnnotation, parseLabels } from "./serialization";
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

test("reopened annotations exclude server provenance from strict edit payloads", () => {
  const saved = {
    page: 2,
    labels: ["review"],
    bias: "",
    missingness: "",
    handwriting_status: "printed",
    legibility_status: "legible",
    missing_page: false,
    reading_order_status: "verified",
    note: "Source inspected",
    method: "human_annotation",
  };
  const editable = editableAnnotation(saved);
  expect(editable).not.toHaveProperty("method");
  expect(editable.page).toBe(2);
  expect(editable.reading_order_status).toBe("verified");
  expect(editable.labels).toEqual(["review"]);
});
