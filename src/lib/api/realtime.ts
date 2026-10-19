import { decodeEvent } from "../models/events";
import type { Event } from "../models/types";

type Options = {
  url: string;
  onEvent: (event: Event) => void;
  onConnection: (connected: boolean) => void;
  socket?: (url: string) => WebSocket;
  schedule?: typeof setTimeout;
  unschedule?: typeof clearTimeout;
};
export function createSessionChannel(options: Options) {
  const schedule = options.schedule ?? setTimeout;
  const unschedule = options.unschedule ?? clearTimeout;
  let socket: WebSocket | undefined;
  let session = "";
  let sequence = 0;
  let attempt = 0;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let waiters: Array<{ resolve: () => void; reject: (error: Error) => void }> =
    [];
  const settle = (error?: Error) => {
    for (const waiter of waiters)
      error ? waiter.reject(error) : waiter.resolve();
    waiters = [];
  };
  function stopSocket() {
    if (retry) unschedule(retry);
    if (timeout) unschedule(timeout);
    retry = undefined;
    timeout = undefined;
    const previous = socket;
    socket = undefined;
    previous?.close();
    options.onConnection(false);
  }
  function receive(ws: WebSocket, raw: unknown) {
    if (socket !== ws) return;
    const event = decodeEvent(String(raw));
    if (!event || (event.session_id && event.session_id !== session)) return;
    if (event.type === "resync_required") return ws.close();
    if (typeof event.sequence === "number" && Number.isFinite(event.sequence)) {
      if (event.sequence <= sequence) return;
      sequence = event.sequence;
    }
    options.onEvent(event);
  }
  function start() {
    if (!session) return;
    const ws = (options.socket ?? ((url) => new WebSocket(url)))(options.url);
    socket = ws;
    timeout = schedule(() => {
      if (socket !== ws) return;
      settle(new Error("Realtime connection timed out"));
      ws.close();
    }, 10000);
    ws.onopen = () => {
      if (socket !== ws) return;
      if (timeout) unschedule(timeout);
      timeout = undefined;
      attempt = 0;
      ws.send(
        JSON.stringify({
          type: "subscribe",
          session_id: session,
          after_sequence: sequence,
        }),
      );
      options.onConnection(true);
      settle();
    };
    ws.onmessage = (message) => receive(ws, message.data);
    ws.onerror = () => ws.close();
    ws.onclose = (event) => {
      if (socket !== ws) return;
      socket = undefined;
      if (timeout) unschedule(timeout);
      timeout = undefined;
      options.onConnection(false);
      settle(new Error("Realtime connection interrupted"));
      if (event.code === 1008 || !session) return;
      retry = schedule(
        () => {
          retry = undefined;
          start();
        },
        Math.min(1000 * 2 ** attempt++, 15000),
      );
    };
  }
  return {
    connect(id: string, afterSequence = 0): Promise<void> {
      if (session !== id) {
        stopSocket();
        settle(new Error("Realtime session changed"));
        session = id;
        sequence = afterSequence;
        attempt = 0;
      }
      if (socket?.readyState === 1) return Promise.resolve();
      const ready = new Promise<void>((resolve, reject) =>
        waiters.push({ resolve, reject }),
      );
      if (!socket && !retry) start();
      return ready;
    },
    send(value: unknown) {
      if (socket?.readyState !== 1)
        throw new Error("Realtime is not connected");
      socket.send(JSON.stringify(value));
    },
    reconnect() {
      if (!session) return;
      stopSocket();
      start();
    },
    close() {
      session = "";
      stopSocket();
      settle(new Error("Realtime connection closed"));
    },
  };
}
export type SessionChannel = ReturnType<typeof createSessionChannel>;
