import { expect, test } from "bun:test";
import { researchIntent } from "../models/researchIntent";
import { IntentDelivery } from "./intentDelivery";

function clock() {
  let now = 0;
  let next = 0;
  const tasks = new Map();
  return {
    schedule(callback, delay) {
      const id = ++next;
      tasks.set(id, { callback, at: now + delay });
      return id;
    },
    unschedule: (id) => tasks.delete(id),
    callbacks: () => [...tasks.values()].map((task) => task.callback),
    count: () => tasks.size,
    advance(ms) {
      now += ms;
      for (const [id, task] of [...tasks]) {
        if (task.at > now || !tasks.delete(id)) continue;
        task.callback();
      }
    },
  };
}
const intent = () =>
  researchIntent("Quote the original", "apertus70b", "en", ["one"], "key");

test("acknowledgement settles once and removes the deadline", async () => {
  const timers = clock();
  const delivery = new IntentDelivery(timers);
  let expired = 0;
  const pending = delivery.begin("temporary", () => expired++);
  delivery.sent(intent());
  delivery.acknowledge(true);
  delivery.acknowledge(false);
  expect(await pending).toBe(true);
  expect(timers.count()).toBe(0);
  timers.advance(30000);
  expect(expired).toBe(0);
});

test("missing first acknowledgement times out once after fifteen seconds", async () => {
  const timers = clock();
  const delivery = new IntentDelivery(timers);
  const expired = [];
  let settled = false;
  const pending = delivery.begin("temporary", (id) => expired.push(id));
  void pending.then(() => {
    settled = true;
  });
  delivery.sent(intent());
  timers.advance(14999);
  await Promise.resolve();
  expect(settled).toBe(false);
  timers.advance(1);
  expect(await pending).toBe(false);
  expect(expired).toEqual(["temporary"]);
  timers.advance(30000);
  expect(expired).toHaveLength(1);
  expect(timers.count()).toBe(0);
});

test("a lost unpersisted send resends the immutable intent once per reconnect", async () => {
  const timers = clock();
  const delivery = new IntentDelivery(timers);
  const original = intent();
  const sent = [];
  const pending = delivery.begin("temporary", () => {});
  delivery.sent(original);
  original.dataset_ids.push("changed-after-send");
  delivery.disconnected();
  delivery.reconnected((value) => sent.push(value));
  delivery.reconnected((value) => sent.push(value));
  expect(sent).toHaveLength(1);
  expect(sent[0]).toEqual(intent());
  expect(Object.isFrozen(sent[0])).toBe(true);
  expect(Object.isFrozen(sent[0].dataset_ids)).toBe(true);
  delivery.acknowledge(true);
  expect(await pending).toBe(true);
  delivery.disconnected();
  delivery.reconnected((value) => sent.push(value));
  expect(sent).toHaveLength(1);
});

test("reconnect keeps the deadline and key when acknowledgement was lost", async () => {
  const timers = clock();
  const delivery = new IntentDelivery(timers);
  const persisted = new Map();
  const accepted = (value) => persisted.set(value.idempotency_key, value);
  const pending = delivery.begin("temporary", () => {});
  const payload = intent();
  accepted(payload);
  delivery.sent(payload);
  for (let retry = 0; retry < 3; retry++) {
    timers.advance(4000);
    delivery.disconnected();
    delivery.reconnected(accepted);
    delivery.reconnected(accepted);
  }
  expect(persisted.size).toBe(1);
  expect(timers.count()).toBe(1);
  timers.advance(3000);
  expect(await pending).toBe(false);
});

test("close and replacement suppress stale timers and replay", async () => {
  const timers = clock();
  const delivery = new IntentDelivery(timers);
  const expired = [];
  const first = delivery.begin("first", (id) => expired.push(id));
  delivery.sent(intent());
  const stale = timers.callbacks()[0];
  const second = delivery.begin("second", (id) => expired.push(id));
  expect(await first).toBe(false);
  stale();
  expect(expired).toEqual([]);
  expect(timers.count()).toBe(1);
  delivery.close();
  expect(await second).toBe(false);
  delivery.disconnected();
  delivery.reconnected(() => {
    throw new Error("Unexpected replay");
  });
  timers.advance(30000);
  expect(expired).toEqual([]);
  expect(timers.count()).toBe(0);
});

test("reconnect ignores unsent requests and propagates failed sends once", async () => {
  const timers = clock();
  const delivery = new IntentDelivery(timers);
  const pending = delivery.begin("temporary", () => {});
  const fail = () => {
    throw new Error("Socket closed");
  };
  delivery.disconnected();
  expect(() => delivery.reconnected(fail)).not.toThrow();
  delivery.sent(intent());
  delivery.disconnected();
  expect(() => delivery.reconnected(fail)).toThrow("Socket closed");
  expect(() => delivery.reconnected(fail)).not.toThrow();
  delivery.acknowledge(false);
  expect(await pending).toBe(false);
  expect(timers.count()).toBe(0);
});

test("default browser timers are invoked without a controller receiver", async () => {
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const receivers = [];
  function receiver() {
    if (this !== undefined && this !== globalThis)
      throw new Error("Illegal invocation");
    receivers.push(this);
    return 1;
  }
  globalThis.setTimeout = receiver;
  globalThis.clearTimeout = receiver;
  try {
    const delivery = new IntentDelivery();
    const pending = delivery.begin("browser", () => {});
    delivery.acknowledge(true);
    expect(await pending).toBe(true);
    expect(receivers).toHaveLength(2);
  } finally {
    globalThis.setTimeout = originalSet;
    globalThis.clearTimeout = originalClear;
  }
});
