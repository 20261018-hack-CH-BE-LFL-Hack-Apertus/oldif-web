import type { Language } from "./types";
export type ResearchIntent = {
  type: "message";
  message: string;
  model: string;
  language: Language;
  dataset_ids: string[];
  idempotency_key: string;
  provider_processing_confirmed: boolean;
};
export function researchIntent(
  message: string,
  model: string,
  language: Language,
  datasets: string[],
  key = crypto.randomUUID(),
  providerProcessingConfirmed = false,
): ResearchIntent {
  return Object.freeze({
    type: "message",
    message,
    model,
    language,
    dataset_ids: [...datasets],
    idempotency_key: key,
    provider_processing_confirmed: providerProcessingConfirmed,
  });
}
