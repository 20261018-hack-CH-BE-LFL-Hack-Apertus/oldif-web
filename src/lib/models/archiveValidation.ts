import {
  bool,
  exact,
  finite,
  integer,
  list,
  nullable,
  object,
  oneOf,
  optional as opt,
  requireValid,
  text,
  type Validator,
} from "./strict";
import { validStructure, validDiarization } from "./processingValidation";
import { validTransformation } from "./transformationValidation";
const strings = list(text);
const hash = (v: unknown): v is string => text(v) && /^[0-9a-f]{64}$/.test(v);
const maybeText = opt(nullable(text));
const timestamp = (v: unknown): v is unknown => text(v) || integer(v);
const record = { id: text, version: integer, created_at: timestamp };
const stringMap = (v: unknown): v is unknown =>
  object(v) && Object.values(v).every(text);
const allowed = list(
  oneOf(
    "local_processing",
    "provider_processing",
    "private_export",
    "public_export",
  ),
);
const acquisition = (v: unknown): v is unknown =>
  exact(v, {
    dataset_uri: text,
    distribution_uri: text,
    retrieved_at: text,
    sha256: text,
    rights_identifier: text,
    allowed_uses: allowed,
  });
const annotation = (v: unknown): v is unknown =>
  exact(v, {
    page: integer,
    labels: strings,
    bias: text,
    missingness: text,
    handwriting_status: text,
    legibility_status: text,
    note: text,
    method: opt(oneOf("human_annotation")),
  });
const review = (v: unknown): v is unknown =>
  exact(v, {
    decision: oneOf("accepted", "rejected", "needs_review"),
    reason: text,
    actor: opt(text),
    human_review: opt(bool),
  });
const enrichment = (v: unknown): v is unknown =>
  exact(v, {
    run_id: text,
    session_id: text,
    page_numbers: list(integer),
    state: oneOf("pending_human_review"),
    applied: oneOf(false),
  });
export const validArchiveDocument = (v: unknown): v is unknown =>
  exact(v, {
    ...record,
    schema_version: oneOf("1.0"),
    dataset_id: text,
    title: text,
    title_method: oneOf(
      "user_supplied",
      "first_nonempty_extracted_line",
      "filename",
      "human_review",
    ),
    filename: text,
    media_type: oneOf("application/pdf", "application/json", "text/plain"),
    original_sha256: hash,
    byte_count: integer,
    page_count: integer,
    status: oneOf("ready", "processing", "failed", "quarantined"),
    licence: text,
    rights_confirmed: bool,
    acquisition: opt(nullable(acquisition)),
    upload_metadata: opt((item): item is unknown =>
      exact(item, {
        title: maybeText,
        licence: text,
        rights_confirmed: bool,
        acquisition: opt(nullable(acquisition)),
      }),
    ),
    labels: strings,
    annotations: list(annotation),
    metadata: stringMap,
    metadata_provenance: object,
    extraction: object,
    review,
    enrichments: list(enrichment),
    flags: object,
    blob_chunks: opt(integer),
    ingest_fingerprint: opt(hash),
    transformation: validTransformation,
    initial_transformation: opt(validTransformation),
    missing_fields: opt(strings),
    code: opt(nullable(oneOf("RIGHTS_UNRESOLVED"))),
  }) &&
  Number(v.page_count) <= 300 &&
  (!object(v.acquisition) ||
    v.acquisition.sha256 === "" ||
    v.acquisition.sha256 === v.original_sha256) &&
  (v.status !== "quarantined" ||
    (v.page_count === 0 &&
      v.code === "RIGHTS_UNRESOLVED" &&
      Array.isArray(v.missing_fields)));
export const validArchiveSource = (v: unknown): v is unknown =>
  exact(v, {
    version: opt(integer),
    created_at: opt(timestamp),
    id: text,
    title: text,
    text,
    url: text,
    page: nullable(integer),
    sha256: hash,
    licence: text,
    dataset_id: opt(text),
    normalized_text: opt(text),
    metadata: opt(object),
    record_locator: opt(object),
    provenance: opt(text),
    text_sha256: hash,
    record_hash_scope: opt(text),
    original_sha256: opt(hash),
    source_sha256: opt(hash),
    transcription_method: maybeText,
    transcription_review_status: maybeText,
    document_id: opt(text),
    derived_from: opt(text),
    flags: opt(object),
    file_page_index: opt(nullable(integer)),
    printed_page_label: maybeText,
    printed_page_label_missing_reason: maybeText,
    page_missing_reason: maybeText,
    extraction_id: opt(text),
    queryable_by_default: opt(bool),
    transformation: opt(validTransformation),
  });
const revision = (v: unknown): v is unknown =>
  exact(v, {
    ...record,
    document_id: text,
    actor: text,
    decision: oneOf("accepted", "rejected", "needs_review", "rights_resolved"),
    reason: text,
    previous_version: integer,
    resulting_version: integer,
    changes: opt(object),
    transformation: opt(validTransformation),
    content_quality_review: opt(bool),
    original_modified: oneOf(false),
  });
export const validDocumentDetail = (v: unknown): v is unknown =>
  exact(v, {
    document: validArchiveDocument,
    pages: list(validArchiveSource),
    revisions: list(revision),
    derived_sources: list(validArchiveSource),
    extractions: list(validStructure),
  }) &&
  object(v.document) &&
  Array.isArray(v.pages) &&
  (v.document.status !== "quarantined" ||
    (Array.isArray(v.derived_sources) &&
      v.derived_sources.length === 0 &&
      Array.isArray(v.extractions) &&
      v.extractions.length === 0)) &&
  (["ready", "quarantined"].includes(String(v.document.status))
    ? v.pages.length === v.document.page_count
    : v.pages.length <= Number(v.document.page_count));
const upload = (v: unknown): v is unknown =>
  exact(v, {
    document: validArchiveDocument,
    pages: list(validArchiveSource),
    processing_ms: opt(finite),
    idempotent_replay: opt(bool),
    ingestion_resumed: opt(bool),
    code: opt(oneOf("RIGHTS_UNRESOLVED")),
    missing_fields: opt(strings),
  });
const started = (v: unknown): v is unknown =>
  exact(v, {
    run_id: text,
    session_id: text,
    status: text,
    reused: opt(bool),
    idempotent_replay: opt(bool),
  });
function route(path: string, method: string): Validator | undefined {
  if (path === "/documents")
    return method === "POST"
      ? upload
      : (v): v is unknown =>
          exact(v, { documents: list(validArchiveDocument) });
  if (/^\/documents\/[^/]+$/.test(path)) return validDocumentDetail;
  if (/^\/documents\/[^/]+\/release$/.test(path)) return upload;
  if (/^\/documents\/[^/]+\/review$/.test(path))
    return (v): v is unknown =>
      exact(v, { document: validArchiveDocument, revision });
  if (/^\/documents\/[^/]+\/enrich$/.test(path)) return started;
  if (/^\/documents\/[^/]+\/pages\/\d+\/(extract|structure)$/.test(path))
    return (v): v is unknown => exact(v, { structure: validStructure });
  if (path === "/sources")
    return (v): v is unknown => exact(v, { sources: list(validArchiveSource) });
  if (path === "/diarization" && method === "POST") return validDiarization;
}
export function validateArchiveResponse(
  path: string,
  method: string,
  value: unknown,
) {
  const validator = route(path.split("?")[0], method);
  return validator ? requireValid(value, validator, "archive API") : value;
}
