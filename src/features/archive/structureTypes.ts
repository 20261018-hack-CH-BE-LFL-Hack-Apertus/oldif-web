export type PageStructure = {
  id: string;
  document_id: string;
  page: number;
  method: string;
  language: string | null;
  dimensions: { width: number; height: number };
  coordinate_system: string;
  text: string;
  text_sha256: string;
  original_sha256: string;
  ocr_source_id: string | null;
  lines: Array<{
    id: string;
    text: string;
    bbox: [number, number, number, number];
  }>;
  table_candidates: Array<{
    bbox: number[];
    row_count: number;
    column_count: number;
    rows: string[][];
    status: string;
  }>;
};
