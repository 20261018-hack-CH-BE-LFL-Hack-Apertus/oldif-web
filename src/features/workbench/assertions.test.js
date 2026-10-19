import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { layoutCopy } from "../preferences/layoutCopy";
import { AssertionProposals } from "./AssertionProposals";
import { assertionCopy } from "./assertionCopy";

test("proposed conflicting assertions retain both exact source quotes without approval", () => {
  const base = {
    kind: "date",
    predicate: "event_date",
    subject: "Record",
    state: "proposed",
    human_reviewed: false,
    potential_conflict: true,
    conflict_group: "g",
  };
  const assertions = [
    {
      ...base,
      assertion_id: "a",
      value: "1798",
      source_id: "one",
      evidence: { quote: "Im Jahr 1798" },
    },
    {
      ...base,
      assertion_id: "b",
      value: "1799",
      source_id: "two",
      evidence: { quote: "Im Jahr 1799" },
    },
  ];
  const html = renderToStaticMarkup(
    createElement(AssertionProposals, {
      result: { assertions },
      language: "en",
    }),
  );
  expect(html).toContain("Im Jahr 1798");
  expect(html).toContain("Im Jahr 1799");
  expect(html.match(/data-assertion-state="proposed"/g)).toHaveLength(2);
  expect(html).toContain("Potential conflict");
  expect(html).toContain("require human review");
  expect(html).not.toContain("approved");
});
test("new boundary status and proposal copy cover all seven languages", () => {
  for (const copy of [assertionCopy, layoutCopy]) {
    expect(Object.keys(copy)).toHaveLength(7);
    for (const entry of Object.values(copy)) {
      expect(
        typeof entry === "string"
          ? entry.length > 0
          : Object.values(entry).every(
              (value) => typeof value === "string" && value.length > 0,
            ),
      ).toBe(true);
      if (typeof entry === "object")
        expect(Object.keys(entry)).toEqual(Object.keys(copy.en));
    }
  }
});
