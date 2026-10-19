"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/models/types";
import { createVoiceState, updateTranscript } from "@/lib/models/voice";
export function useVoice({
  language,
  onTranscript,
  onTool,
}: {
  language: Language;
  onTranscript: (text: string) => void;
  onTool: (message: string) => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);
  const voiceState = useRef(createVoiceState());
  const generation = useRef(0);
  const callbacks = useRef({ onTranscript, onTool });
  callbacks.current = { onTranscript, onTool };
  const cleanup = useCallback(() => {
    generation.current += 1;
    voiceState.current = createVoiceState();
    callbacks.current.onTranscript("");
    if (channel.current) channel.current.onmessage = null;
    if (peer.current) {
      peer.current.onconnectionstatechange = null;
      peer.current.ontrack = null;
    }
    channel.current?.close();
    peer.current?.close();
    stream.current?.getTracks().forEach((track) => {
      track.stop();
    });
    if (audio.current) {
      audio.current.pause();
      audio.current.srcObject = null;
    }
    peer.current = null;
    stream.current = null;
    channel.current = null;
    audio.current = null;
  }, []);
  useEffect(() => cleanup, [cleanup]);
  function receive(message: MessageEvent) {
    try {
      const event = JSON.parse(message.data);
      const transcript = updateTranscript(voiceState.current, event);
      if (transcript !== undefined) callbacks.current.onTranscript(transcript);
      if (event.type === "response.function_call_arguments.done") {
        const args = JSON.parse(event.arguments ?? "{}");
        if (
          event.name === "research_archives" &&
          typeof args.query === "string" &&
          typeof event.call_id === "string" &&
          !voiceState.current.pendingCalls.includes(event.call_id)
        ) {
          voiceState.current.pendingCalls.push(event.call_id);
          callbacks.current.onTool(args.query);
        }
      }
      if (event.type === "error")
        setError(String(event.error?.message ?? "Voice provider error"));
    } catch {
      setError("Invalid voice event received");
    }
  }
  async function start() {
    cleanup();
    const attempt = generation.current;
    setStatus("connecting");
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Microphone requires a secure browser context");
      const media = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (attempt !== generation.current) {
        media.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      stream.current = media;
      const pc = new RTCPeerConnection();
      peer.current = pc;
      audio.current = new Audio();
      audio.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audio.current) {
          audio.current.srcObject = e.streams[0];
          void audio.current
            .play()
            .catch(() =>
              setError("Audio playback was blocked. Start voice again."),
            );
        }
      };
      media.getTracks().forEach((track) => {
        pc.addTrack(track, media);
      });
      const dc = pc.createDataChannel("oai-events");
      channel.current = dc;
      dc.onmessage = (event) => {
        if (channel.current === dc) receive(event);
      };
      dc.onopen = () => {
        if (channel.current !== dc) return;
        setStatus("connected");
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setStatus("error");
          setError("Voice connection interrupted");
          cleanup();
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, locale: language }),
        credentials: "same-origin",
      });
      if (attempt !== generation.current) return;
      if (!response.ok)
        throw new Error(`Voice unavailable (${response.status})`);
      await pc.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
      setMuted(false);
    } catch (e) {
      if (attempt !== generation.current) return;
      cleanup();
      setStatus("error");
      setError(e instanceof Error ? e.message : "Voice failed");
    }
  }
  function stop() {
    cleanup();
    setStatus("idle");
    setMuted(false);
  }
  function toggleMute() {
    setMuted((value) => {
      stream.current?.getAudioTracks().forEach((track) => {
        track.enabled = value;
      });
      return !value;
    });
  }
  const deliverResult = useCallback((result: unknown) => {
    const callId = voiceState.current.pendingCalls.shift();
    if (!callId || channel.current?.readyState !== "open") return;
    channel.current.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      }),
    );
    channel.current.send(JSON.stringify({ type: "response.create" }));
  }, []);
  return { status, muted, error, start, stop, toggleMute, deliverResult };
}
