import { expect, test } from "bun:test";
import { metrics } from "./metrics";
test("metrics isolate a run and count only completed model calls", () => {
  const run = {
    id: "a",
    started_at: 10,
    finished_at: 14,
    result: { citations: [{}] },
  };
  const events = [
    {
      run_id: "a",
      data: { kind: "model.started", data: { usage: { total_tokens: 900 } } },
    },
    {
      run_id: "a",
      data: {
        kind: "model.completed",
        data: { usage: { total_tokens: 30 }, duration_ms: 1200 },
      },
    },
    {
      run_id: "b",
      data: { kind: "model.completed", data: { usage: { total_tokens: 99 } } },
    },
  ];
  expect(metrics(run, events)).toEqual({
    tokens: 30,
    seconds: 4,
    citations: 1,
  });
  expect(metrics({ id: "unknown" }, events)).toEqual({
    tokens: null,
    seconds: null,
    citations: 0,
  });
});
