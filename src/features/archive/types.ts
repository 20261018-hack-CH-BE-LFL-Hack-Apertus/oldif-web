export type PageSource = {
  id: string;
  document_id: string;
  page: number;
  title: string;
  text: string;
  text_sha256: string;
  original_sha256: string;
  sha256: string;
  flags: Record<string, unknown>;
};
export type ArchiveDocument = {
  id: string;
  dataset_id: string;
  title: string;
  filename: string;
  title_method?:
    | "user_supplied"
    | "first_nonempty_extracted_line"
    | "filename"
    | "human_review";
  media_type: string;
  original_sha256: string;
  page_count: number;
  status: string;
  version: number;
  labels: string[];
  metadata: Record<string, string>;
  flags: Record<string, unknown>;
  review?: { decision: string; reason: string };
  acquisition?: Partial<Acquisition>;
  licence?: string;
  missing_fields?: string[];
};
export type DocumentDetail = {
  document: ArchiveDocument;
  pages: PageSource[];
  revisions: unknown[];
};
export type PageAnnotation = {
  page: number;
  labels: string[];
  bias: string;
  missingness: string;
  handwriting_status: string;
  legibility_status: string;
  missing_page?: boolean;
  reading_order_status?: "unknown" | "verified" | "uncertain";
  note: string;
};
import type { Acquisition } from "./acquisition";
