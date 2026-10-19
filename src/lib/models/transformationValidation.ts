import { exact, integer, nullable, object, oneOf, text, list } from "./strict";
const timestamp = (v: unknown): v is unknown => text(v) || integer(v);
export const validTransformation = (v: unknown): v is unknown =>
  exact(v, {
    schema_version: oneOf("1.0"),
    operation: text,
    reason: text,
    actor: text,
    run_id: text,
    parent_revision: nullable(object),
    timestamp,
    timestamp_unit: oneOf("unix_seconds"),
    original: object,
    normalized: object,
  }) || exact(v, { operation: text, page_numbering: text, version: text });
export const validNormalizationProvenance = (v: unknown): v is unknown =>
  (validTransformation(v) && object(v) && v.schema_version === "1.0") ||
  exact(v, {
    schema_version: oneOf("1.0"),
    provenance_status: oneOf("legacy_unknown"),
    operation: oneOf("preserve_legacy_normalization_record"),
    reason: text,
    actor: oneOf(null),
    run_id: oneOf(null),
    parent_revision: oneOf(null),
    timestamp: oneOf(null),
    timestamp_unit: oneOf("unix_seconds"),
    missing_fields: list(
      oneOf("actor", "run_id", "parent_revision", "timestamp"),
    ),
    original: object,
    normalized: object,
  });
