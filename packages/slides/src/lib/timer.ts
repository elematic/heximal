import {Signal} from 'signal-polyfill';

export interface TimerSyncMessage {
  type: 'timer-sync';
  running: boolean;
  accumulatedMs: number;
  startedAt: number | null;
}

export class PresentationTimer {
  #seconds = new Signal.State<number>(0);
  #running = new Signal.State<boolean>(false);
  #accumulatedMs = 0;
  #startedAt: number | null = null;
  #intervalId?: ReturnType<typeof setInterval>;
  #channel?: BroadcastChannel;

  constructor(autoStart = true) {
    if (typeof BroadcastChannel !== 'undefined') {
      this.#channel = new BroadcastChannel('heximal-slides');
      this.#channel.addEventListener('message', this.#onMessage);
    }
    if (autoStart) {
      this.start(false);
    }
  }

  get seconds(): number {
    return this.#seconds.get();
  }

  get running(): boolean {
    return this.#running.get();
  }

  get formatted(): string {
    return PresentationTimer.formatSeconds(this.seconds);
  }

  toString(): string {
    return this.formatted;
  }

  static formatSeconds(totalSeconds: number): string {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  start = (broadcast = true): void => {
    if (this.#running.get()) {
      return;
    }
    this.#startedAt = Date.now();
    this.#running.set(true);
    this.#ensureInterval();
    this.#tick();
    if (broadcast) {
      this.#broadcast();
    }
  };

  pause = (broadcast = true): void => {
    if (!this.#running.get()) {
      return;
    }
    if (this.#startedAt !== null) {
      this.#accumulatedMs += Date.now() - this.#startedAt;
      this.#startedAt = null;
    }
    this.#running.set(false);
    this.#clearInterval();
    this.#tick();
    if (broadcast) {
      this.#broadcast();
    }
  };

  toggle = (): void => {
    if (this.#running.get()) {
      this.pause(true);
    } else {
      this.start(true);
    }
  };

  reset = (broadcast = true): void => {
    this.#accumulatedMs = 0;
    if (this.#running.get()) {
      this.#startedAt = Date.now();
    } else {
      this.#startedAt = null;
    }
    this.#seconds.set(0);
    if (broadcast) {
      this.#broadcast();
    }
  };

  getSyncState(): TimerSyncMessage {
    return {
      type: 'timer-sync',
      running: this.#running.get(),
      accumulatedMs: this.#accumulatedMs,
      startedAt: this.#startedAt,
    };
  }

  applySyncState(msg: TimerSyncMessage) {
    this.#accumulatedMs = msg.accumulatedMs;
    this.#startedAt = msg.startedAt;
    this.#running.set(msg.running);
    if (msg.running) {
      this.#ensureInterval();
    } else {
      this.#clearInterval();
    }
    this.#tick();
  }

  #tick = () => {
    const now = Date.now();
    const totalMs =
      this.#accumulatedMs +
      (this.#running.get() && this.#startedAt !== null
        ? now - this.#startedAt
        : 0);
    const nextSeconds = Math.max(0, Math.floor(totalMs / 1000));
    if (this.#seconds.get() !== nextSeconds) {
      this.#seconds.set(nextSeconds);
    }
  };

  #ensureInterval() {
    if (this.#intervalId === undefined && typeof window !== 'undefined') {
      this.#intervalId = setInterval(this.#tick, 250);
    }
  }

  #clearInterval() {
    if (this.#intervalId !== undefined) {
      clearInterval(this.#intervalId);
      this.#intervalId = undefined;
    }
  }

  #broadcast() {
    this.#channel?.postMessage(this.getSyncState());
  }

  #onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (data?.type === 'timer-sync') {
      this.applySyncState(data as TimerSyncMessage);
    }
  };
}

export const presentationTimer = new PresentationTimer(true);
