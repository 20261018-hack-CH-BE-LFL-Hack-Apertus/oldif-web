import { expect, test } from "bun:test";
import { createSessionChannel } from "./realtime";

function fixture() {
  const sockets = [],
    timers = new Map(),
    events = [],
    states = [];
  let tick = 0;
  const channel = createSessionChannel({
    url: "ws://example.test/api/realtime",
    onEvent: (event) => events.push(event),
    onConnection: (state) => states.push(state),
    socket: () => {
      const socket = {
        readyState: 0,
        sent: [],
        send(value) {
          this.sent.push(JSON.parse(value));
        },
        close() {
          this.readyState = 3;
          this.onclose?.({ code: 1006 });
        },
        open() {
          this.readyState = 1;
          this.onopen?.();
        },
        emit(event) {
          this.onmessage?.({ data: JSON.stringify(event) });
        },
      };
      sockets.push(socket);
      return socket;
    },
    schedule: (fn, delay) => {
      const id = ++tick;
      timers.set(id, { fn, delay });
      return id;
    },
    unschedule: (id) => timers.delete(id),
  });
  return {
    channel,
    sockets,
    events,
    states,
    timers,
    retry() {
      const entry = [...timers].find(([, t]) => t.delay < 10000);
      expect(entry).toBeDefined();
      timers.delete(entry[0]);
      entry[1].fn();
    },
  };
}
test("subscribes without URL secrets and replays after the latest unique sequence", async () => {
  const f = fixture();
  const ready = f.channel.connect("session-a", 3);
  f.sockets[0].open();
  await ready;
  expect(f.sockets[0].sent[0]).toEqual({
    type: "subscribe",
    session_id: "session-a",
    after_sequence: 3,
  });
  f.sockets[0].emit({ type: "trace", session_id: "session-a", sequence: 4 });
  f.sockets[0].emit({
    type: "trace",
    session_id: "other-session",
    sequence: 99,
  });
  f.sockets[0].close();
  f.retry();
  f.sockets[1].open();
  expect(f.sockets[1].sent[0].after_sequence).toBe(4);
  f.sockets[1].emit({ type: "trace", sequence: 4 });
  f.sockets[1].emit({ type: "done", sequence: 5 });
  expect(f.events.map((e) => e.sequence)).toEqual([4, 5]);
  f.channel.close();
});
test("changing sessions ignores late events and resets the replay cursor", async () => {
  const f = fixture();
  let ready = f.channel.connect("a", 9);
  f.sockets[0].open();
  await ready;
  ready = f.channel.connect("b");
  f.sockets[1].open();
  await ready;
  f.sockets[0].emit({ type: "done", sequence: 100 });
  f.sockets[1].emit({ type: "trace", sequence: 1 });
  expect(f.sockets[1].sent[0].after_sequence).toBe(0);
  expect(f.events).toHaveLength(1);
  f.channel.close();
  expect(f.timers.size).toBe(0);
});
test("resync reconnects; cleanup prevents retries; offline sends fail explicitly", async () => {
  const f = fixture();
  const ready = f.channel.connect("a");
  f.sockets[0].open();
  await ready;
  f.sockets[0].emit({ type: "resync_required" });
  f.retry();
  f.sockets[1].open();
  f.channel.send({ type: "cancel", run_id: "r" });
  expect(f.sockets[1].sent.at(-1).type).toBe("cancel");
  f.channel.close();
  expect(() => f.channel.send({ type: "message" })).toThrow("not connected");
  expect(f.timers.size).toBe(0);
});
test("connection timeout rejects the caller and keeps bounded retry available", async () => {
  const f = fixture();
  const ready = f.channel.connect("a").catch((error) => error.message);
  [...f.timers.values()].find((t) => t.delay === 10000).fn();
  expect(await ready).toContain("timed out");
  f.retry();
  expect(f.sockets).toHaveLength(2);
  f.channel.close();
});
