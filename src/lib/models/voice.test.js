import { describe, expect, test } from "bun:test";
import { createVoiceState, updateTranscript } from "./voice";

const delta = (item, text, id) => ({
  type: "conversation.item.input_audio_transcription.delta",
  item_id: item,
  delta: text,
  event_id: id,
});
const done = (item, text, id) => ({
  type: "conversation.item.input_audio_transcription.completed",
  item_id: item,
  transcript: text,
  event_id: id,
});
describe("voice transcript assembly", () => {
  test("shows partial text before completion and replaces it with the final transcript", () => {
    const state = createVoiceState();
    expect(updateTranscript(state, delta("a", "Al", "1"))).toBe("Al");
    expect(updateTranscript(state, delta("a", "thel", "2"))).toBe("Althel");
    expect(updateTranscript(state, done("a", "Alpthal", "3"))).toBe("Alpthal");
  });
  test("interleaved items remain separate when final events arrive out of order", () => {
    const state = createVoiceState();
    updateTranscript(state, delta("a", "First", "1"));
    expect(updateTranscript(state, delta("b", "Second", "2"))).toBe(
      "First\nSecond",
    );
    expect(updateTranscript(state, done("b", "Second!", "3"))).toBe(
      "First\nSecond!",
    );
    expect(updateTranscript(state, done("a", "First!", "4"))).toBe(
      "First!\nSecond!",
    );
  });
  test("replayed event IDs and late deltas cannot duplicate a completed transcript", () => {
    const state = createVoiceState();
    updateTranscript(state, delta("a", "Hello", "1"));
    expect(updateTranscript(state, delta("a", "Hello", "1"))).toBeUndefined();
    updateTranscript(state, done("a", "Hello!", "2"));
    expect(updateTranscript(state, done("a", "Hello!", "2"))).toBeUndefined();
    expect(updateTranscript(state, delta("a", " extra", "3"))).toBeUndefined();
  });
  test("a new call has no prior transcript, event IDs or pending tool calls", () => {
    let state = createVoiceState();
    updateTranscript(state, delta("a", "Old", "1"));
    state.pendingCalls.push("old-call");
    state = createVoiceState();
    expect(state.pendingCalls).toHaveLength(0);
    expect(updateTranscript(state, delta("a", "New", "1"))).toBe("New");
  });
  test("ignores unrelated or malformed input and accepts completion without deltas", () => {
    const state = createVoiceState();
    expect(
      updateTranscript(state, { type: "session.created" }),
    ).toBeUndefined();
    expect(
      updateTranscript(state, delta(undefined, "bad", "1")),
    ).toBeUndefined();
    expect(updateTranscript(state, delta("a", {}, "2"))).toBeUndefined();
    expect(updateTranscript(state, done("a", "Final only", "3"))).toBe(
      "Final only",
    );
  });
});
