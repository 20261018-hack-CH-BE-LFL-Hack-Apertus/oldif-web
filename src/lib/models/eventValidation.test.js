import { expect, test } from "bun:test";
import { decodeEvent, reduceRun } from "./events";
import { applyEvidenceEvent, restoreEvidence } from "./evidenceSession";

const event = {
  type: "trace",
  event_id: "r:1",
  run_id: "r",
  session_id: "s",
  sequence: 1,
  data: { kind: "tool.started", source_id: "source" },
};
test("strict committed envelope rejects unknown keys, absent identity and invalid types", () => {
  expect(decodeEvent(JSON.stringify(event))).toEqual(event);
  for (const invalid of [
    { ...event, surprise: true },
    { ...event, event_id: undefined },
    { ...event, sequence: 1.5 },
    { ...event, sequence: -1 },
    { ...event, data: [] },
    { ...event, type: "arbitrary" },
    { ...event, run_id: "" },
  ])
    expect(decodeEvent(JSON.stringify(invalid))).toBeUndefined();
  expect(
    decodeEvent(JSON.stringify({ ...event, type: "delta", data: { text: 9 } })),
  ).toBeUndefined();
  expect(
    decodeEvent(
      JSON.stringify({
        ...event,
        type: "delta",
        data: { text: "a", surprise: true },
      }),
    ),
  ).toBeUndefined();
});
test("control errors have their own strict envelope", () => {
  expect(
    decodeEvent('{"type":"error","data":{"message":"Denied"}}')?.type,
  ).toBe("error");
  expect(
    decodeEvent(
      '{"type":"error","data":{"message":"Denied","token":"hidden"}}',
    ),
  ).toBeUndefined();
});
test("run and graph reducers deduplicate identity independent of sequence", () => {
  const first = reduceRun(
    { id: "r", text: "", traces: [], status: "running", question: "q" },
    event,
  );
  expect(reduceRun(first, { ...event, sequence: 2 })).toBe(first);
  const state = applyEvidenceEvent(restoreEvidence({}), event);
  expect(applyEvidenceEvent(state, { ...event, sequence: 2 })).toBe(state);
});

test("idempotent replay acknowledgement restores through a separate strict control DTO", () => {
  const ack = {
    type: "run_reused",
    data: { run_id: "r", session_id: "s", status: "complete" },
  };
  expect(decodeEvent(JSON.stringify(ack))).toEqual(ack);
  expect(decodeEvent(JSON.stringify({ ...ack, sequence: 1 }))).toBeUndefined();
  expect(
    decodeEvent(
      JSON.stringify({ ...ack, data: { ...ack.data, arbitrary: true } }),
    ),
  ).toBeUndefined();
});
test("restoring persisted evidence collapses duplicate event identities", () => {
  const state = restoreEvidence({ events: [event, { ...event, sequence: 2 }] });
  expect(state.events).toHaveLength(1);
});
