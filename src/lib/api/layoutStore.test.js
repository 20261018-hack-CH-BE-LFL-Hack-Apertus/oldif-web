import { expect, test } from "bun:test";
import {
  archiveDefault,
  validArchive,
  validWorkbench,
} from "../models/layoutValidation";
import { defaultLayout } from "../models/workbenchLayout";
import { ApiError } from "./client";
import { LayoutStore } from "./layoutStore";

const storage = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
};
function server() {
  let record = { scope: "archive", version: 0, layout: null };
  const calls = [];
  const request = async (_path, options) => {
    calls.push(options.method);
    if (options.method === "PUT") {
      const input = JSON.parse(options.body);
      if (input.expected_version !== record.version)
        throw new ApiError("Conflict", 409);
      record = {
        scope: "archive",
        version: record.version + 1,
        layout: input.layout,
      };
    }
    return structuredClone(record);
  };
  return { request, calls, get: () => record };
}
const store = (s, cache = storage(), key = "user-a") =>
  new LayoutStore({
    scope: "archive",
    key,
    initial: archiveDefault,
    validate: validArchive,
    request: s.request,
    storage: cache,
  });
test("strict layouts reject extra fields, invalid ranges and duplicate panels", () => {
  expect(validArchive(archiveDefault)).toBe(true);
  expect(validWorkbench(defaultLayout)).toBe(true);
  for (const value of [
    { ...archiveDefault, width: 90 },
    { ...archiveDefault, token: "ignored?" },
    { ...archiveDefault, source: 1 },
  ])
    expect(validArchive(value)).toBe(false);
  expect(
    validWorkbench({
      ...defaultLayout,
      placements: { ...defaultLayout.placements, extra: "right" },
    }),
  ).toBe(false);
  expect(
    validWorkbench({ ...defaultLayout, order: ["activity", "activity"] }),
  ).toBe(false);
});
test("fresh second client restores account layout; no default write before GET", async () => {
  const remote = server();
  const a = store(remote);
  await a.start();
  expect(remote.calls).toEqual(["GET"]);
  a.update({ width: 61, source: false });
  await a.save();
  const b = store(remote);
  await b.start();
  expect(b.snapshot().layout.width).toBe(61);
  expect(b.snapshot().layout.source).toBe(false);
  expect(remote.get().version).toBe(1);
  a.close();
  b.close();
});
test("two-client conflict preserves local state until explicit resolution", async () => {
  const remote = server();
  const a = store(remote);
  const b = store(remote);
  await Promise.all([a.start(), b.start()]);
  a.update({ width: 60 });
  await a.save();
  b.update({ width: 40 });
  await b.save();
  expect(b.snapshot().status).toBe("conflict");
  expect(b.snapshot().layout.width).toBe(40);
  expect(remote.get().layout.width).toBe(60);
  await b.resolve(false);
  expect(b.snapshot().layout.width).toBe(60);
  expect(b.snapshot().status).toBe("saved");
  b.update({ width: 42 });
  await b.save();
  a.update({ width: 65 });
  await a.save();
  await a.resolve(true);
  expect(remote.get().layout.width).toBe(65);
  a.close();
  b.close();
});
test("offline edits survive reload and never imply account persistence", async () => {
  const remote = server();
  const cache = storage();
  let online = false;
  const transport = {
    request: (...args) =>
      online
        ? remote.request(...args)
        : Promise.reject(new TypeError("Offline")),
  };
  const a = store(transport, cache);
  await a.start();
  a.update({ width: 66 });
  await a.refresh();
  expect(a.snapshot().status).toBe("offline");
  expect(remote.get().version).toBe(0);
  a.close();
  const b = store(transport, cache);
  await b.start();
  expect(b.snapshot().layout.width).toBe(66);
  expect(b.snapshot().status).toBe("offline");
  online = true;
  await b.refresh();
  expect(remote.get().layout.width).toBe(66);
  expect(b.snapshot().status).toBe("saved");
  b.close();
});
test("invalid responses and unavailable local storage preserve usable layout", async () => {
  const a = store({
    request: async () => ({
      scope: "archive",
      version: 1,
      layout: { ...archiveDefault, injected: true },
    }),
  });
  await a.start();
  expect(a.snapshot().status).toBe("invalid");
  expect(a.snapshot().layout).toEqual(archiveDefault);
  a.close();
  const b = store(server(), {
    getItem() {
      throw new Error("Denied");
    },
    setItem() {
      throw new Error("Denied");
    },
  });
  await b.start();
  b.update({ width: 50 });
  await b.save();
  expect(b.snapshot().storageError).toBe(true);
  expect(b.snapshot().status).toBe("saved");
  b.close();
});
