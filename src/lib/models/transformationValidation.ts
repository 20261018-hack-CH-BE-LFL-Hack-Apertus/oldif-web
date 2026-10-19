import { exact, integer, nullable, object, oneOf, text } from "./strict";
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
