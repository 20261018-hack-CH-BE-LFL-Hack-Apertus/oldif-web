import { expect, test } from "bun:test";
import { validateResearchResponse } from "./researchValidation";
import { validAssertion, validResult } from "./resultValidation";

const citation = {
  source_id: "source-a",
  quote: "Bern",
  sha256: "a".repeat(64),
  page: null,
  url: "https://example.org/source",
  licence: "terms_open",
};
const assertion = {
  assertion_id: "b".repeat(64),
  kind: "entity",
  predicate: "place",
  subject: "record",
  value: "Bern",
  source_id: "source-a",
  state: "proposed",
  human_reviewed: false,
  evidence: citation,
  potential_conflict: false,
  conflict_group: null,
};
const result = {
  answer: "Original: Bern",
  citations: [citation],
  model: "apertus",
  locale: "en",
  uncertainty: [],
  proposals: [],
  verification: {},
  evidence_only: true,
  interpretation_status: "needs_review",
  human_review_required: true,
  entities: [],
  timeline: [],
  assertions: [assertion],
};
test("strict research responses reject unknown nested fields and wrong types", () => {
  const auth = { user: { id: "a", name: "Demo", email: null, demo: true } };
  expect(validateResearchResponse("/auth/session", "GET", auth)).toEqual(auth);
  for (const value of [
    { ...auth, token: "unexpected" },
    { user: { ...auth.user, admin: true } },
    { user: { ...auth.user, demo: "true" } },
  ])
    expect(() =>
      validateResearchResponse("/auth/session", "GET", value),
    ).toThrow("Invalid research API");
  expect(() =>
    validateResearchResponse("/sessions", "GET", {
      sessions: [],
      surprise: true,
    }),
  ).toThrow();
});
test("strict result validation keeps proposed assertions separate from historical approval", () => {
  expect(validResult(result)).toBe(true);
  expect(validAssertion(assertion)).toBe(true);
  for (const value of [
    { ...result, unknown: true },
    { ...result, verification: { approved: true } },
    { ...result, entities: ["unreviewed fact"] },
    { ...result, citations: [{ ...citation, injected: true }] },
    { ...result, assertions: [{ ...assertion, human_reviewed: true }] },
  ])
    expect(validResult(value)).toBe(false);
  expect(
    validAssertion({ ...assertion, kind: "title", predicate: "place" }),
  ).toBe(false);
  expect(validAssertion({ ...assertion, source_id: "other" })).toBe(false);
});

test("current persisted run provenance and uploaded collections match the declared DTO", () => {
  const record = { id: "r", version: 2, created_at: 1700000000000 };
  const run = {
    ...record,
    run_id: "r",
    session_id: "s",
    status: "complete",
    model: "apertus70b",
    language: "en",
    question: "Question",
    sources: [],
    started_at: 1700000000,
    result,
    request_id: "request",
    terminal_event_id: "r:done",
    transformation: {
      schema_version: "1.0",
      operation: "record_research_result",
      reason: "Review",
      actor: "owner",
      run_id: "r",
      parent_revision: { kind: "run", id: "r", version: 1 },
      timestamp: 1700000000,
      timestamp_unit: "unix_seconds",
      original: { question: "Question" },
      normalized: { value_kind: "record_reference", id: "r" },
    },
  };
  expect(validateResearchResponse("/runs/r/review", "POST", run)).toEqual(run);
  expect(() =>
    validateResearchResponse("/runs/r/review", "POST", {
      ...run,
      unknown: true,
    }),
  ).toThrow();
  const collection = {
    ...record,
    id: "doc",
    name: "Uploaded document",
    record_count: 3,
    licence: "user-declared",
    kind: "uploaded-document",
    document_id: "doc",
    page_citations: true,
    provenance: "user-attested-original-upload",
  };
  expect(
    validateResearchResponse("/datasets", "GET", { datasets: [collection] }),
  ).toEqual({ datasets: [collection] });
});
