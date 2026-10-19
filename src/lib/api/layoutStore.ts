import { type LayoutRecord, layoutRecord } from "../models/layoutValidation";
import { requireValid, type Validator } from "../models/strict";
import { ApiError, api } from "./client";
export type LayoutStatus =
  | "loading"
  | "default"
  | "saved"
  | "saving"
  | "offline"
  | "conflict"
  | "invalid";
export type LayoutSnapshot<T> = {
  layout: T;
  status: LayoutStatus;
  storageError: boolean;
};
type Options<T> = {
  scope: "workbench" | "archive";
  key: string;
  initial: T;
  validate: Validator<T>;
  request?: typeof api;
  storage?: Pick<Storage, "getItem" | "setItem">;
};
export class LayoutStore<T extends object> {
  private state: LayoutSnapshot<T>;
  private listeners = new Set<() => void>();
  private version = 0;
  private dirty = false;
  private generation = 0;
  private busy = false;
  private closed = false;
  private loaded = false;
  private legacyCache = false;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(private options: Options<T>) {
    this.state = {
      layout: options.initial,
      status: "loading",
      storageError: false,
    };
  }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private publish(patch: Partial<LayoutSnapshot<T>>) {
    if (this.closed) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  private cache() {
    try {
      this.options.storage?.setItem(
        this.options.key,
        JSON.stringify(this.state.layout),
      );
      this.options.storage?.setItem(
        `${this.options.key}:sync`,
        JSON.stringify({ dirty: this.dirty, version: this.version }),
      );
    } catch {
      this.publish({ storageError: true });
    }
  }
  private readCache() {
    try {
      const value = JSON.parse(
        this.options.storage?.getItem(this.options.key) ?? "null",
      );
      if (this.options.validate(value)) {
        this.publish({ layout: value });
        this.legacyCache = true;
      }
      const meta = JSON.parse(
        this.options.storage?.getItem(`${this.options.key}:sync`) ?? "null",
      );
      if (meta !== null) this.legacyCache = false;
      if (
        meta?.dirty === true &&
        Number.isSafeInteger(meta.version) &&
        meta.version >= 0
      ) {
        this.dirty = true;
        this.version = meta.version;
      }
    } catch {
      this.publish({ storageError: true });
    }
  }
  private async request(method: "GET" | "PUT", body?: unknown) {
    const value = await (this.options.request ?? api)(
      `/preferences/layouts/${this.options.scope}`,
      { method, ...(body ? { body: JSON.stringify(body) } : {}) },
    );
    return requireValid(
      value,
      (v): v is LayoutRecord<T> =>
        layoutRecord(v, this.options.scope, this.options.validate),
      "layout",
    );
  }
  start = async () => {
    this.closed = false;
    this.readCache();
    await this.refresh();
  };
  refresh = async () => {
    if (this.busy || this.closed || this.state.status === "conflict") return;
    this.busy = true;
    try {
      const record = await this.request("GET");
      if (this.closed) return;
      this.loaded = true;
      if (record.layout === null && this.legacyCache) this.dirty = true;
      this.legacyCache = false;
      if (this.dirty && record.version !== this.version) {
        this.publish({ status: "conflict" });
        return;
      }
      this.version = record.version;
      if (!this.dirty)
        this.publish({
          layout: record.layout ?? this.options.initial,
          status: record.layout === null ? "default" : "saved",
        });
      this.cache();
    } catch (error) {
      this.failed(error);
    } finally {
      this.busy = false;
    }
    if (this.dirty && this.loaded && this.snapshot().status !== "conflict")
      await this.save();
  };
  update = (patch: Partial<T>) => {
    const layout = { ...this.state.layout, ...patch };
    if (!this.options.validate(layout)) return;
    this.dirty = true;
    this.generation += 1;
    this.publish({
      layout,
      status: this.state.status === "conflict" ? "conflict" : "saving",
    });
    this.cache();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void (this.loaded ? this.save() : this.refresh());
    }, 320);
  };
  reset = () => this.update(this.options.initial);
  private failed(error: unknown) {
    this.publish({
      status:
        error instanceof ApiError && error.status === 409
          ? "conflict"
          : error instanceof Error && error.message.startsWith("Invalid ")
            ? "invalid"
            : "offline",
    });
  }
  save = async () => {
    if (
      this.busy ||
      this.closed ||
      !this.dirty ||
      !this.loaded ||
      this.state.status === "conflict"
    )
      return;
    this.busy = true;
    const generation = this.generation;
    try {
      const record = await this.request("PUT", {
        expected_version: this.version,
        layout: this.state.layout,
      });
      if (this.closed) return;
      this.version = record.version;
      this.dirty = generation !== this.generation;
      this.publish({ status: this.dirty ? "saving" : "saved" });
      this.cache();
    } catch (error) {
      this.failed(error);
    } finally {
      this.busy = false;
    }
    if (this.dirty && this.state.status === "saving") await this.save();
  };
  resolve = async (keepLocal: boolean) => {
    if (this.busy || this.closed) return;
    this.busy = true;
    try {
      const record = await this.request("GET");
      if (this.closed) return;
      this.version = record.version;
      this.loaded = true;
      this.dirty = keepLocal;
      this.publish({
        layout: keepLocal
          ? this.state.layout
          : (record.layout ?? this.options.initial),
        status: keepLocal ? "saving" : "saved",
      });
      this.cache();
    } catch (error) {
      this.failed(error);
    } finally {
      this.busy = false;
    }
    if (keepLocal && this.state.status === "saving") await this.save();
  };
  close = () => {
    this.closed = true;
    clearTimeout(this.timer);
  };
}
