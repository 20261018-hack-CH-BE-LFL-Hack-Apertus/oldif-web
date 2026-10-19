import { expect, test } from "bun:test";
import { cachedIntent, cacheIntentSession, forgetIntent } from "./intentCache";
import { researchIntent } from "./researchIntent";

test("an unacknowledged intent retains key and session after a new controller is created", () => {
  const original = globalThis.localStorage;
  const rows = new Map();
  globalThis.localStorage = {
    getItem: (key) => rows.get(key) ?? null,
    setItem: (key, value) => rows.set(key, value),
  };
  try {
    const first = researchIntent(
      "Question",
      "apertus70b",
      "en",
      ["dataset"],
      "stable",
      true,
    );
    cachedIntent("a", first);
    cacheIntentSession("a", first, "original-session");
    const retry = cachedIntent(
      "a",
      researchIntent("Question", "apertus70b", "en", ["dataset"], "new", true),
    );
    expect(retry.intent.idempotency_key).toBe("stable");
    expect(retry.session_id).toBe("original-session");
    expect(retry.intent.provider_processing_confirmed).toBe(true);
    expect(
      cachedIntent(
        "b",
        researchIntent(
          "Question",
          "apertus70b",
          "en",
          ["dataset"],
          "other",
          true,
        ),
      ).intent.idempotency_key,
    ).toBe("other");
    forgetIntent("a", "stable");
    expect(
      cachedIntent(
        "a",
        researchIntent(
          "Question",
          "apertus70b",
          "en",
          ["dataset"],
          "next",
          true,
        ),
      ).intent.idempotency_key,
    ).toBe("next");
  } finally {
    globalThis.localStorage = original;
  }
});
