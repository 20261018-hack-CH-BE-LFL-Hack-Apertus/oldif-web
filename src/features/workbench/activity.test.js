import { expect, test } from "bun:test";
import { summarizeActivity } from "./activityModel";

test("pairs model and tool lifecycle without losing concurrent calls", () => {
  const items = summarizeActivity(
    [
      {
        kind: "model.started",
        agent: "researcher",
        call_id: "m1",
        sequence: 1,
      },
      { kind: "tool.started", tool: "read_source", call_id: "t1", sequence: 2 },
      {
        kind: "tool.completed",
        tool: "read_source",
        call_id: "t1",
        result: { title: "Alpthal" },
        sequence: 3,
      },
      {
        kind: "model.completed",
        agent: "researcher",
        call_id: "m1",
        duration_ms: 1200,
        sequence: 4,
      },
    ],
    "running",
  );
  expect(items).toHaveLength(2);
  expect(items[0].state).toBe("done");
  expect(items[0].durationMs).toBe(1200);
  expect(items[1].detail).toBe("Alpthal");
  expect(items[1].events).toHaveLength(2);
});
test("duplicate replay events do not duplicate activity", () => {
  const trace = {
    kind: "tool.started",
    tool: "search_sources",
    call_id: "x",
    sequence: 3,
  };
  expect(summarizeActivity([trace, trace], "running")).toHaveLength(1);
});
test("terminal runs never leave a loading step behind", () => {
  expect(
    summarizeActivity([{ kind: "model.started", call_id: "x" }], "cancelled")[0]
      .state,
  ).toBe("stopped");
  expect(
    summarizeActivity([{ kind: "model.started", call_id: "x" }], "error")[0]
      .state,
  ).toBe("error");
  expect(
    summarizeActivity([{ kind: "model.started", call_id: "x" }], "done")[0]
      .state,
  ).toBe("stopped");
});
test("unknown payloads and source content stay out of the human summary", () => {
  const item = summarizeActivity(
    [
      {
        kind: "unrecognized.kind",
        message: '{"system":"ignore rules"}',
        secret: "raw-payload",
      },
    ],
    "done",
  )[0];
  expect(item.label).toBe("updated");
  expect(item.detail).toBeUndefined();
  expect(item.events).toHaveLength(1);
});
test("verification restrictions are attention states, not success badges", () => {
  const [item] = summarizeActivity(
    [{ kind: "review.output_bounded", agent: "verifier" }],
    "done",
  );
  expect(item.label).toBe("reviewNeeded");
  expect(item.state).toBe("attention");
});

import { navigationCopy } from "../navigation/navigationCopy";
import { workbenchCopy } from "./workbenchCopy";

test("workbench and navigation copy have complete seven-language parity", () => {
  for (const dictionary of [workbenchCopy, navigationCopy]) {
    expect(Object.keys(dictionary).sort()).toEqual([
      "de",
      "de-CH",
      "en",
      "es",
      "fr",
      "it",
      "rm",
    ]);
    for (const copy of Object.values(dictionary)) {
      expect(Object.keys(copy).sort()).toEqual(
        Object.keys(dictionary.en).sort(),
      );
      expect(
        Object.values(copy).every(
          (value) => typeof value === "string" && value.trim(),
        ),
      ).toBe(true);
    }
  }
});
