import type { ResearchIntent } from "../models/researchIntent";

type Timer = ReturnType<typeof setTimeout>;
type Options = {
  schedule?: (callback: () => void, delay: number) => Timer;
  unschedule?: (timer: Timer) => void;
  timeoutMs?: number;
};
type Pending = {
  id: string;
  resolve: (success: boolean) => void;
  onTimeout: (id: string) => void;
  timer?: Timer;
  intent?: ResearchIntent;
  replay: boolean;
};

export class IntentDelivery {
  private pending?: Pending;
  private schedule: NonNullable<Options["schedule"]>;
  private unschedule: NonNullable<Options["unschedule"]>;
  private timeoutMs: number;

  constructor(options: Options = {}) {
    this.schedule =
      options.schedule ?? ((callback, delay) => setTimeout(callback, delay));
    this.unschedule = options.unschedule ?? ((timer) => clearTimeout(timer));
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  begin(id: string, onTimeout: (id: string) => void): Promise<boolean> {
    this.close();
    return new Promise((resolve) => {
      const pending: Pending = { id, resolve, onTimeout, replay: false };
      this.pending = pending;
      pending.timer = this.schedule(() => {
        if (this.pending !== pending) return;
        this.finish(pending, false);
        pending.onTimeout(pending.id);
      }, this.timeoutMs);
    });
  }

  sent(intent: ResearchIntent) {
    if (!this.pending || this.pending.intent) return;
    const datasetIds = [...intent.dataset_ids];
    Object.freeze(datasetIds);
    this.pending.intent = Object.freeze({ ...intent, dataset_ids: datasetIds });
  }

  disconnected() {
    if (this.pending?.intent) this.pending.replay = true;
  }

  reconnected(send: (intent: ResearchIntent) => void) {
    const pending = this.pending;
    if (!pending?.intent || !pending.replay) return;
    pending.replay = false;
    send(pending.intent);
  }

  acknowledge(success: boolean) {
    if (this.pending) this.finish(this.pending, success);
  }

  close() {
    this.acknowledge(false);
  }

  private finish(pending: Pending, success: boolean) {
    if (this.pending !== pending) return;
    this.pending = undefined;
    if (pending.timer !== undefined) this.unschedule(pending.timer);
    pending.resolve(success);
  }
}
