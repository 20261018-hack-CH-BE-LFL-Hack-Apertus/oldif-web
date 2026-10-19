import { expect, test } from "bun:test";
import { applyEvidenceEvent, restoreEvidence } from "./evidenceSession";
import { restoreRuns } from "./sessionSnapshot";

test("history preserves failed status and current review version without inventing results", () => {
  const runs = restoreRuns({
    runs: [
      { id: "failed", status: "failed" },
      { id: "ok", status: "done", version: 4 },
    ],
    messages: [
      {
        run_id: "ok",
        role: "assistant",
        result: { answer: "Exact quotation", review_version: 1 },
      },
    ],
  });
  expect(runs[0].status).toBe("error");
  expect(runs[0].result).toBeUndefined();
  expect(runs[1].result.review_version).toBe(4);
});
test("live evidence replaces a run result and replay does not duplicate graph citations", () => {
  let state = restoreEvidence({
    messages: [
      {
        run_id: "a",
        role: "assistant",
        result: { citations: [{ source_id: "one" }] },
      },
    ],
    events: [
      {
        type: "evidence",
        run_id: "a",
        sequence: 2,
        data: { citations: [{ source_id: "one" }] },
      },
    ],
  });
  state = applyEvidenceEvent(state, {
    type: "evidence",
    run_id: "a",
    sequence: 3,
    data: { citations: [{ source_id: "two" }] },
  });
  state = applyEvidenceEvent(state, {
    type: "done",
    run_id: "a",
    sequence: 4,
    data: { review_version: 2 },
  });
  state = applyEvidenceEvent(state, {
    type: "evidence",
    run_id: "a",
    sequence: 3,
    data: { citations: [{ source_id: "two" }] },
  });
  expect(state.events).toHaveLength(3);
  expect(Object.values(state.results)).toHaveLength(1);
  expect(state.results.a.citations).toEqual([{ source_id: "two" }]);
  expect(state.results.a.review_version).toBe(2);
});
test("new runs streamed from another view become visible without reloading the session", () => {
  const state = applyEvidenceEvent(restoreEvidence({}), {
    type: "final",
    run_id: "new",
    sequence: 1,
    data: { citations: [{ source_id: "live" }] },
  });
  expect(state.results.new.citations[0].source_id).toBe("live");
  expect(state.events[0].run_id).toBe("new");
});
