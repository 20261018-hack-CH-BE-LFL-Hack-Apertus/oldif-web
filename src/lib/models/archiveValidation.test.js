import { describe, expect, it } from "bun:test";
import detail from "./fixtures/archive-document-detail.json";
import structure from "./fixtures/archive-page-structure.json";
import audio from "./fixtures/archive-diarization.json";
import release from "./fixtures/archive-release.json";
import { validateArchiveResponse } from "./archiveValidation";
const clone = (v) => structuredClone(v);
describe("archive response boundaries", () => {
  it("accepts actual release pages before storage revision fields are attached", () => {
    expect(
      validateArchiveResponse("/documents/synthetic/release", "POST", release),
    ).toBe(release);
    const invalid = structuredClone(release);
    invalid.pages[0].unexpected = true;
    expect(() =>
      validateArchiveResponse("/documents/synthetic/release", "POST", invalid),
    ).toThrow();
  });
  it("accepts captured synthetic document, structure and diarization", () => {
    expect(validateArchiveResponse("/documents/synthetic", "GET", detail)).toBe(
      detail,
    );
    expect(
      validateArchiveResponse("/documents/synthetic/pages/1/structure", "GET", {
        structure,
      }),
    ).toEqual({ structure });
    expect(validateArchiveResponse("/diarization", "POST", audio)).toBe(audio);
  });
  it("rejects unknown envelope, document, acquisition and source fields", () => {
    for (const patch of [
      { ...detail, secret_override: true },
      { ...detail, document: { ...detail.document, approved_by_model: true } },
      { ...detail, pages: [{ ...detail.pages[0], provider_key: "forbidden" }] },
      {
        ...detail,
        document: { ...detail.document, acquisition: { unknown: true } },
      },
    ])
      expect(() =>
        validateArchiveResponse("/documents/synthetic", "GET", patch),
      ).toThrow();
  });
  it("accepts quarantined originals without inventing parsed pages", () => {
    const document = {
      ...detail.document,
      page_count: 0,
      status: "quarantined",
      code: "RIGHTS_UNRESOLVED",
      missing_fields: ["dataset_uri"],
    };
    const value = {
      document,
      pages: [],
      revisions: [],
      derived_sources: [],
      extractions: [],
    };
    expect(validateArchiveResponse("/documents/synthetic", "GET", value)).toBe(
      value,
    );
    expect(() =>
      validateArchiveResponse("/documents/synthetic", "GET", {
        ...value,
        pages: detail.pages,
      }),
    ).toThrow();
  });
  it("rejects geometry outside page and invalid speaker identity/times", () => {
    const bad = clone(structure);
    bad.lines[0].bbox[2] = bad.dimensions.width + 1;
    expect(() =>
      validateArchiveResponse("/documents/synthetic/pages/1/extract", "POST", {
        structure: bad,
      }),
    ).toThrow();
    for (const segment of [
      { start: 0, end: 1, speaker: "Alice" },
      { start: 2, end: 1, speaker: "speaker_1" },
      { start: 0, end: 999, speaker: "speaker_1" },
    ]) {
      expect(() =>
        validateArchiveResponse("/diarization", "POST", {
          ...audio,
          segments: [segment],
        }),
      ).toThrow();
    }
  });
  it("keeps partial ingestion inspectable and rejects mismatched acquisition bytes", () => {
    const failed = clone(detail);
    failed.document.status = "failed";
    failed.pages = [];
    expect(validateArchiveResponse("/documents/synthetic", "GET", failed)).toBe(
      failed,
    );
    failed.document.status = "ready";
    expect(() =>
      validateArchiveResponse("/documents/synthetic", "GET", failed),
    ).toThrow();
    const mismatched = clone(detail);
    mismatched.document.acquisition = {
      dataset_uri: "urn:test:dataset",
      distribution_uri: "urn:test:distribution",
      retrieved_at: "2026-10-19T12:00:00Z",
      sha256: "0".repeat(64),
      rights_identifier: "CC0-1.0",
      allowed_uses: ["local_processing"],
    };
    expect(() =>
      validateArchiveResponse("/documents/synthetic", "GET", mismatched),
    ).toThrow();
  });
});
