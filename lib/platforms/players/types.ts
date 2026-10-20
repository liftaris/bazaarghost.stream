import type { PlatformCapabilities } from "../types";

export interface PlayerSource {
  sourceId: string;
  embedUrl: string | null;
  title: string;
  /** Start position in seconds. */
  start: number;
}

/** Whatever the adapter currently knows; fields it cannot observe are omitted. */
export interface PlayerSnapshot {
  time?: number;
  duration?: number;
  paused?: boolean;
  muted?: boolean;
}

export interface PlayerEvents {
  ready: undefined;
  /** Position changed outside of normal playback (seek landed). */
  time: PlayerSnapshot;
  state: PlayerSnapshot;
  error: string;
}

export interface PlayerAdapter {
  readonly platform: string;
  readonly capabilities: PlatformCapabilities;
  /** Create the player inside `el` (which has a stable id). Safe to call seek/play/etc. immediately. */
  mount(el: HTMLElement, src: PlayerSource): void;
  /** Load another video in the same player; only when capabilities.swap. */
  swap?(src: PlayerSource): void;
  /** Seek; queued until the player is ready. Platforms without live seeking reload at `t`. */
  seek(t: number): void;
  play(): void;
  pause(): void;
  setMuted(muted: boolean): void;
  snapshot(): PlayerSnapshot | null;
  on<E extends keyof PlayerEvents>(event: E, fn: (payload: PlayerEvents[E]) => void): () => void;
  destroy(): void;
}
