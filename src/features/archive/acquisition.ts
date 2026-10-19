export const allowedUses = [
  "local_processing",
  "provider_processing",
  "private_export",
  "public_export",
] as const;
export type AllowedUse = (typeof allowedUses)[number];
export type Acquisition = {
  dataset_uri: string;
  distribution_uri: string;
  retrieved_at: string;
  sha256: string;
  rights_identifier: string;
  allowed_uses: AllowedUse[];
};
export type AcquisitionDraft = Omit<
  Acquisition,
  "sha256" | "rights_identifier"
>;
export function newAcquisition(value?: Partial<Acquisition>): AcquisitionDraft {
  return {
    dataset_uri: value?.dataset_uri || "",
    distribution_uri: value?.distribution_uri || "",
    retrieved_at: value?.retrieved_at || new Date().toISOString(),
    allowed_uses: value?.allowed_uses?.filter((use) =>
      allowedUses.includes(use),
    ) || ["local_processing"],
  };
}
export function acquisitionRecord(
  draft: AcquisitionDraft,
  hash: string,
  rights: string,
): Acquisition {
  return {
    ...draft,
    sha256: hash,
    rights_identifier: rights,
    allowed_uses: [...new Set(draft.allowed_uses)],
  };
}
export async function originalHash(file: File) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
