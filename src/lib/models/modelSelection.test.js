import { expect, test } from "bun:test";
import {
  benchmarkModels,
  defaultResearchModel,
  displayModel,
} from "./modelSelection";

const models = [
  { id: "apertus-v1-5-8b", name: "apertus-v1-5-8b", available: false },
  { id: "apertus-v1-5-70b", name: "apertus-v1-5-70b", available: true },
  { id: "gpt-6-astra", name: "gpt-6-astra", available: true },
];
test("honors a configured Apertus variant without silently selecting a backup", () => {
  expect(defaultResearchModel(models, "apertus-v1-5-70b")).toBe(
    "apertus-v1-5-70b",
  );
  expect(defaultResearchModel(models, "apertus-v1-5-8b")).toBe(
    "apertus-v1-5-8b",
  );
  expect(defaultResearchModel(models, "gpt-6-astra")).toBe("apertus-v1-5-70b");
  expect(defaultResearchModel([models[2]])).toBe("");
});
test("renders model names without exposing registry identifiers", () => {
  expect(displayModel(models[1])).toBe("Apertus 70B");
  expect(displayModel(models[2])).toBe("GPT-6 Astra");
});
test("benchmarks the available configured Apertus variant before the explicit comparator", () => {
  const available = models.map((model) => ({ ...model, available: true }));
  expect(benchmarkModels(available, "apertus-v1-5-8b")).toEqual([
    "apertus-v1-5-8b",
    "gpt-6-astra",
  ]);
  expect(benchmarkModels(available, "apertus-v1-5-70b")).toEqual([
    "apertus-v1-5-70b",
    "gpt-6-astra",
  ]);
});
test("benchmark selection rejects an unavailable default despite another available Apertus model", () => {
  expect(() => benchmarkModels(models, "apertus-v1-5-8b")).toThrow(
    "The configured Apertus model is unavailable",
  );
});
test("benchmark selection requires an exact configured Apertus catalog entry", () => {
  for (const configured of [undefined, "", "apertus-missing", "gpt-6-astra"]) {
    expect(() => benchmarkModels(models, configured)).toThrow(
      "The configured Apertus model is unavailable",
    );
  }
  expect(() => benchmarkModels([], "apertus-v1-5-8b")).toThrow();
});
