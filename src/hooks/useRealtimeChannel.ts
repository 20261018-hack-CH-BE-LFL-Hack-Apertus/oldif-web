"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSessionChannel, type SessionChannel } from "@/lib/api/realtime";
import type { Event } from "@/lib/models/types";
export function useRealtimeChannel(onEvent: (event: Event) => void) {
  const [connected, setConnected] = useState(false);
  const channel = useRef<SessionChannel | null>(null);
  const handler = useRef(onEvent);
  handler.current = onEvent;
  const getChannel = useCallback(() => {
    if (!channel.current) {
      const url = new URL("/api/realtime", location.href);
      url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
      channel.current = createSessionChannel({
        url: url.toString(),
        onEvent: (event) => handler.current(event),
        onConnection: setConnected,
      });
    }
    return channel.current;
  }, []);
  useEffect(() => {
    const online = () => channel.current?.reconnect();
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("online", online);
      channel.current?.close();
      channel.current = null;
    };
  }, []);
  const connect = useCallback(
    (id: string, sequence = 0) => getChannel().connect(id, sequence),
    [getChannel],
  );
  const send = useCallback(
    (value: unknown) => getChannel().send(value),
    [getChannel],
  );
  const close = useCallback(() => channel.current?.close(), []);
  return { connected, connect, send, close };
}
