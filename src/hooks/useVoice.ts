"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/models/types";
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
  const pendingCalls = useRef<string[]>([]);
  const callbacks = useRef({ onTranscript, onTool });
  callbacks.current = { onTranscript, onTool };
  function cleanup() {
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
  }
  useEffect(
    () => () => {
      channel.current?.close();
      peer.current?.close();
      stream.current?.getTracks().forEach((track) => {
        track.stop();
      });
      if (audio.current) {
        audio.current.pause();
        audio.current.srcObject = null;
      }
    },
    [],
  );
  function receive(message: MessageEvent) {
    try {
      const event = JSON.parse(message.data);
      if (
        event.type === "conversation.item.input_audio_transcription.completed"
      )
        callbacks.current.onTranscript(String(event.transcript ?? ""));
      if (event.type === "response.function_call_arguments.done") {
        const args = JSON.parse(event.arguments ?? "{}");
        if (
          event.name === "research_archives" &&
          typeof args.query === "string"
        ) {
          callbacks.current.onTool(args.query);
          pendingCalls.current.push(event.call_id);
        }
      }
      if (event.type === "error")
        setError(String(event.error?.message ?? "Voice provider error"));
    } catch {
      setError("Invalid voice event received");
    }
  }
  async function start() {
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
      dc.onmessage = receive;
      dc.onopen = () => {
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
      if (!response.ok)
        throw new Error(`Voice unavailable (${response.status})`);
      await pc.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
      setMuted(false);
    } catch (e) {
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
    const callId = pendingCalls.current.shift();
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
