type Transcript = { text: string; complete: boolean };

export function createVoiceState() {
  return {
    transcripts: new Map<string, Transcript>(),
    eventIds: new Set<string>(),
    pendingCalls: [] as string[],
  };
}

export function updateTranscript(
  state: ReturnType<typeof createVoiceState>,
  event: Record<string, unknown>,
): string | undefined {
  const complete =
    event.type === "conversation.item.input_audio_transcription.completed";
  if (
    !complete &&
    event.type !== "conversation.item.input_audio_transcription.delta"
  )
    return;
  if (typeof event.item_id !== "string" || !event.item_id) return;
  const text = complete ? event.transcript : event.delta;
  if (typeof text !== "string") return;
  const key = `${event.item_id}:${event.content_index ?? 0}`;
  const previous = state.transcripts.get(key);
  if (previous?.complete) return;
  if (typeof event.event_id === "string") {
    if (state.eventIds.has(event.event_id)) return;
    state.eventIds.add(event.event_id);
  }
  state.transcripts.set(key, {
    text: complete ? text : (previous?.text ?? "") + text,
    complete,
  });
  return Array.from(state.transcripts.values(), (item) => item.text).join("\n");
}
