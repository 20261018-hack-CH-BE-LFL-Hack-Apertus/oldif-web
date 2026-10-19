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
  text,
} from "./strict";
import { validTransformation } from "./transformationValidation";
const hash = (v: unknown): v is string => text(v) && /^[0-9a-f]{64}$/.test(v);
const timestamp = (v: unknown): v is unknown => text(v) || integer(v);
const box = (v: unknown): v is unknown =>
  Array.isArray(v) &&
  v.length === 4 &&
  v.every(finite) &&
  v[0] >= 0 &&
  v[1] >= 0 &&
  v[2] >= v[0] &&
  v[3] >= v[1];
const line = (v: unknown): v is unknown =>
  exact(v, { id: text, text, bbox: box });
const word = (v: unknown): v is unknown =>
  exact(v, { text, bbox: box, confidence: nullable(finite), line_id: text });
const table = (v: unknown): v is unknown =>
  exact(v, {
    bbox: box,
    row_count: integer,
    column_count: integer,
    rows: list(list(text)),
    method: text,
    status: oneOf("unverified"),
    semantic_table_claim: oneOf(false),
  });
export const validStructure = (v: unknown): v is unknown =>
  exact(v, {
    id: text,
    version: integer,
    created_at: timestamp,
    document_id: text,
    page: integer,
    method: text,
    language: nullable(text),
    dimensions: (item): item is unknown =>
      exact(item, { width: finite, height: finite }),
    coordinate_system: text,
    text,
    text_sha256: hash,
    original_sha256: hash,
    ocr_source_id: nullable(text),
    lines: list(line),
    words: list(word),
    table_candidates: list(table),
    engine_version: opt(text),
    handwriting_status: oneOf("unknown"),
    human_review_required: oneOf(true),
    ocr_performed: bool,
    processing_ms: finite,
    raster_max_dimension: opt(nullable(integer)),
    review_status: opt(oneOf("unverified")),
    segmentation_mode: opt(nullable(integer)),
    transformation: opt(validTransformation),
  }) && geometryFits(v);
function geometryFits(v: Record<string, unknown>) {
  if (!object(v.dimensions)) return false;
  const { width, height } = v.dimensions;
  if (!finite(width) || !finite(height) || width <= 0 || height <= 0)
    return false;
  return [v.words, v.lines, v.table_candidates].every(
    (items) =>
      Array.isArray(items) &&
      items.every(
        (item) =>
          object(item) &&
          Array.isArray(item.bbox) &&
          item.bbox[2] <= width &&
          item.bbox[3] <= height,
      ),
  );
}
const segment = (v: unknown): v is unknown =>
  exact(v, {
    start: finite,
    end: finite,
    speaker: (value): value is string =>
      text(value) && /^speaker_[1-9][0-9]*$/.test(value),
  });
export const validDiarization = (v: unknown): v is unknown =>
  exact(v, {
    status: oneOf("completed"),
    model: text,
    model_sha256: hash,
    input_sha256: hash,
    audio_seconds: finite,
    speaker_count: integer,
    segments: list(segment),
    runtime: text,
    runtime_version: text,
    model_revision: text,
    license: text,
    execution_id: text,
    identity_inference: oneOf(false),
    transcription_performed: oneOf(false),
    audio_retained: oneOf(false),
  }) &&
  Array.isArray(v.segments) &&
  finite(v.audio_seconds) &&
  v.segments.every(
    (s) =>
      object(s) &&
      finite(s.start) &&
      finite(s.end) &&
      s.start >= 0 &&
      s.end > s.start &&
      s.end <= Number(v.audio_seconds) + 0.05,
  );
