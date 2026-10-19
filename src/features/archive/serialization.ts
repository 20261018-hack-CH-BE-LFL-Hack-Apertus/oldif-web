import type { PageAnnotation } from "./types";

export function editableAnnotation(value: PageAnnotation): PageAnnotation {
  const {
    page,
    labels,
    bias,
    missingness,
    handwriting_status,
    legibility_status,
    missing_page,
    reading_order_status,
    note,
  } = value;
  return {
    page,
    labels,
    bias,
    missingness,
    handwriting_status,
    legibility_status,
    missing_page,
    reading_order_status,
    note,
  };
}

export function asciiJson(value: unknown) {
  return JSON.stringify(value).replace(
    /[\u007f-\uffff]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

export function parseLabels(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
    ),
  ];
}
