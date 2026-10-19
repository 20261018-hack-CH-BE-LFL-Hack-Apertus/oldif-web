import { describe, expect, it } from "bun:test";
import { acquisitionRecord, newAcquisition, originalHash } from "./acquisition";
describe("acquisition provenance", () => {
  it("does not invent source identities or export permission", () => {
    const draft = newAcquisition();
    expect(draft.dataset_uri).toBe("");
    expect(draft.distribution_uri).toBe("");
    expect(draft.allowed_uses).toEqual(["local_processing"]);
    expect(Number.isNaN(Date.parse(draft.retrieved_at))).toBe(false);
  });
  it("hashes the exact retained bytes", async () => {
    const file = new File(["abc"], "source.txt");
    expect(await originalHash(file)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
  it("uses recorded rights without automatically granting model access", () => {
    const draft = newAcquisition({
      dataset_uri: "urn:example:dataset",
      allowed_uses: ["local_processing", "local_processing", "private_export"],
    });
    const record = acquisitionRecord(draft, "a".repeat(64), "research-only");
    expect(record.allowed_uses).toEqual(["local_processing", "private_export"]);
    expect(record.rights_identifier).toBe("research-only");
    expect(record.sha256).toBe("a".repeat(64));
  });
});
