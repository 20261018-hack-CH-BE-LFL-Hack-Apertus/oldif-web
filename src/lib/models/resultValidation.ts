import {
  bool,
  exact,
  integer,
  list,
  nullable,
  object,
  oneOf,
  optional as opt,
  text,
} from "./strict";
import type { Assertion, Citation, Result } from "./types";

const strings = list(text);
const hash = (v: unknown): v is string => text(v) && /^[0-9a-f]{64}$/.test(v);
const positive = (v: unknown): v is number => integer(v) && v > 0;
const maybeText = opt(nullable(text));
export function validCitation(value: unknown): value is Citation {
  return (
    exact(value, {
      source_id: text,
      quote: text,
      sha256: hash,
      page: nullable(positive),
      url: text,
      licence: text,
      text_sha256: opt(hash),
      record_hash_scope: opt(text),
      passage_id: opt(text),
      char_start: opt(integer),
      char_end: opt(positive),
      transcription_method: opt(text),
      transcription_review_status: opt(
        oneOf(
          "unreviewed",
          "unverified",
          "needs_review",
          "accepted",
          "rejected",
          "published_transcription_not_new_QA_gold",
        ),
      ),
      file_page_index: opt(nullable(integer)),
      printed_page_label: maybeText,
      printed_page_label_missing_reason: maybeText,
      page_missing_reason: maybeText,
      title: opt(text),
      offset_unit: opt(oneOf("unicode_scalar_value")),
      locator_kind: opt(oneOf("page", "record")),
    }) &&
    (!(integer(value.char_start) && integer(value.char_end)) ||
      value.char_end > value.char_start)
  );
}
const predicates = {
  title: ["document_title"],
  date: ["date_mentioned", "event_date"],
  entity: ["person", "place", "organization", "concept"],
  relation: ["related_to", "located_in", "part_of", "reported_by"],
};
export function validAssertion(value: unknown): value is Assertion {
  return (
    exact(value, {
      assertion_id: hash,
      kind: oneOf("title", "date", "entity", "relation"),
      subject: text,
      predicate: text,
      value: text,
      source_id: text,
      state: oneOf("proposed"),
      human_reviewed: oneOf(false),
      evidence: validCitation,
      potential_conflict: bool,
      conflict_group: nullable(hash),
    }) &&
    predicates[value.kind as keyof typeof predicates].includes(
      String(value.predicate),
    ) &&
    (value.evidence as Citation).source_id === value.source_id
  );
}
function verification(value: unknown) {
  return exact(value, {
    verdict: opt(oneOf("supported", "needs_revision", "abstain")),
    authority: opt(oneOf("advisory_model")),
    independent_pass: opt(oneOf(false)),
    same_model: opt(oneOf(true)),
    human_review_required: opt(oneOf(true)),
    separate_pass: opt(oneOf(true)),
    reason: opt(text),
    output_policy: opt(
      oneOf(
        "extractive_pending_human_review",
        "evidence_only",
        "deterministic_abstention",
      ),
    ),
    findings: opt(strings),
    contradictions: opt(strings),
    historical_bias: opt(strings),
  });
}
const array = (v: unknown): v is unknown[] => Array.isArray(v);
const draft = (v: unknown): v is unknown =>
  exact(v, {
    answer: text,
    entities: nullable(array),
    timeline: nullable(array),
    state: oneOf("unreviewed"),
    human_reviewed: oneOf(false),
  });
const assertionValidation = (v: unknown): v is unknown =>
  exact(v, {
    accepted: integer,
    rejected: integer,
    reasons: strings,
    policy: oneOf("exact_span_proposals_not_historical_truth"),
  });
export function validResult(value: unknown): value is Result {
  return (
    exact(value, {
      answer: text,
      citations: list(validCitation),
      model: text,
      locale: oneOf("en", "es", "de", "de-CH", "fr", "it", "rm"),
      verification: (v): v is unknown => verification(v),
      uncertainty: (v): v is unknown => text(v) || strings(v),
      proposals: list(object),
      abstained: opt(bool),
      evidence_only: opt(bool),
      human_review_required: opt(bool),
      interpretation_status: opt(oneOf("needs_review")),
      entities: opt(array),
      timeline: opt(array),
      interpretation_draft: opt(draft),
      review_version: opt(integer),
      assertions: opt(list(validAssertion)),
      assertion_validation: opt(assertionValidation),
      source_fidelity: opt(oneOf("exact_quotes_checked_human_review_required")),
      system_validation: opt((v): v is unknown =>
        exact(v, {
          accepted: oneOf(false),
          reason: text,
          repair_exhausted: bool,
        }),
      ),
    }) && safeReviewState(value)
  );
}
function safeReviewState(value: Record<string, unknown>) {
  if (
    value.evidence_only === true &&
    (value.interpretation_status !== "needs_review" ||
      value.human_review_required !== true ||
      !Array.isArray(value.entities) ||
      value.entities.length ||
      !Array.isArray(value.timeline) ||
      value.timeline.length)
  )
    return false;
  if (value.interpretation_draft && value.evidence_only !== true) return false;
  if (
    value.abstained === true &&
    ((value.citations as unknown[]).length ||
      value.interpretation_draft ||
      (Array.isArray(value.assertions) && value.assertions.length))
  )
    return false;
  return true;
}
