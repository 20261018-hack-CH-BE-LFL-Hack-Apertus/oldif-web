import { describe, expect, test } from "bun:test";
import { safeUrl } from "../api/client";
import { dictionaries } from "../i18n";
import { decodeEvent, reduceRun } from "./events";

const initial = {
  id: "r1",
  question: "Where?",
  text: "",
  traces: [],
  status: "running",
};
describe("research events", () => {
  test("rejects invalid event JSON", () => {
    expect(decodeEvent("not JSON")).toBeUndefined();
    expect(decodeEvent('{"secret":"ignore"}')).toBeUndefined();
  });
  test("does not mix concurrent run events", () =>
    expect(
      reduceRun(initial, {
        type: "delta",
        run_id: "r2",
        data: { text: "other" },
      }),
    ).toBe(initial));
  test("preserves trace and evidence when completing", () => {
    let run = reduceRun(initial, {
      type: "trace",
      run_id: "r1",
      data: { agent: "retriever", message: "3 sources" },
    });
    run = reduceRun(run, {
      type: "evidence",
      data: { answer: "A", citations: [{ id: "source1", quote: "original" }] },
    });
    run = reduceRun(run, { type: "done", data: {} });
    expect(run.status).toBe("done");
    expect(run.traces).toHaveLength(1);
    expect(run.result.citations[0].quote).toBe("original");
  });
  test("keeps failures inspectable", () => {
    const run = reduceRun(initial, {
      type: "error",
      data: { message: "Provider unavailable" },
    });
    expect(run.status).toBe("error");
    expect(run.error).toContain("unavailable");
  });
  test("limits retained trace records", () => {
    let run = initial;
    for (let i = 0; i < 240; i++)
      run = reduceRun(run, { type: "trace", data: { message: String(i) } });
    expect(run.traces).toHaveLength(200);
  });
});
describe("source URLs", () => {
  test("blocks active and unencrypted schemes", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("http://example.com")).toBeUndefined();
    expect(safeUrl("https://example.com/a")).toBe("https://example.com/a");
  });
});
describe("localization", () => {
  test("all seven locales have identical nonempty keys", () => {
    const keys = Object.keys(dictionaries.en).sort();
    expect(Object.keys(dictionaries)).toHaveLength(7);
    for (const dictionary of Object.values(dictionaries)) {
      expect(Object.keys(dictionary).sort()).toEqual(keys);
      expect(
        Object.values(dictionary).every(
          (v) => typeof v === "string" && v.length > 0,
        ),
      ).toBe(true);
    }
  });
});
