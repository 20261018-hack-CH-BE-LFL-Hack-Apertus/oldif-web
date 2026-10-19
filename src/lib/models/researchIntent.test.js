import { expect, test } from "bun:test";
import { researchIntent } from "./researchIntent";

test("a retry retains its original key and input despite later selections", () => {
  const datasets = ["one"];
  const intent = researchIntent(
    "Question",
    "apertus70b",
    "fr",
    datasets,
    "stable-key",
  );
  datasets.push("two");
  const retry = JSON.parse(JSON.stringify(intent));
  expect(retry.idempotency_key).toBe("stable-key");
  expect(retry.dataset_ids).toEqual(["one"]);
  expect(retry.model).toBe("apertus70b");
  expect(
    researchIntent("Question", "apertus70b", "fr", datasets).idempotency_key,
  ).not.toBe(intent.idempotency_key);
});
