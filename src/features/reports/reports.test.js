import { describe, expect, test } from "bun:test";
import { reportCopy } from "./copy";
import { evidence } from "./data";
import { nextSlide } from "./print";

describe("report integrity", () => {
  test("seven locales keep the six-page report contract", () => {
    expect(Object.keys(reportCopy)).toHaveLength(7);
    for (const copy of Object.values(reportCopy)) {
      expect(copy.pages).toHaveLength(6);
      expect(Object.keys(copy).sort()).toEqual(
        Object.keys(reportCopy.en).sort(),
      );
    }
  });
  test("does not relabel completion or citation checks as scholarly approval", () => {
    expect(evidence.public_checks.scholarly_interpretation_approved).toBe(
      false,
    );
    expect(evidence.public_checks.provider_attempts_failed).toBe(1);
    expect(evidence.historical_comparison.human_gold_documents).toBe(0);
    expect(evidence.dataset.page).toBeNull();
    expect(evidence.dataset.record_sha256).not.toBe(
      evidence.dataset.text_sha256,
    );
  });
  test("keyboard clamps boundaries and supports Home and End", () => {
    expect(nextSlide("ArrowLeft", 0, 6)).toBe(0);
    expect(nextSlide("ArrowRight", 5, 6)).toBe(5);
    expect(nextSlide("Home", 5, 6)).toBe(0);
    expect(nextSlide("End", 0, 6)).toBe(5);
    expect(nextSlide("Enter", 2, 6)).toBe(2);
  });
});
