import type { Model } from "./types";
export function benchmarkModels(
  models: Model[],
  configured?: string,
): [string, string] {
  const selected = models.find(
    (model) =>
      model.id === configured &&
      model.id.startsWith("apertus-") &&
      model.available === true,
  );
  if (!selected)
    throw new Error(
      "The configured Apertus model is unavailable. Refresh the model catalog before comparing.",
    );
  return [selected.id, "gpt-6-astra"];
}
export function defaultResearchModel(
  models: Model[],
  configured?: string,
): string {
  const selected = models.find(
    (model) => model.id === configured && model.id.startsWith("apertus"),
  );
  return (
    selected?.id ??
    models.find((model) => model.id === "apertus-v1-5-70b")?.id ??
    models.find((model) => model.id.startsWith("apertus"))?.id ??
    ""
  );
}
export function displayModel(model: Model): string {
  if (model.name !== model.id) return model.name;
  const apertus = model.id.match(/^apertus-v1-5-(8b|70b)(-thinking)?$/);
  if (apertus)
    return `Apertus ${apertus[1].toUpperCase()}${apertus[2] ? " Thinking" : ""}`;
  return model.id === "gpt-6-astra" ? "GPT-6 Astra" : model.name;
}
