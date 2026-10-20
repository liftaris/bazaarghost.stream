import type { PlatformCapabilities } from "../types";
import type { PlayerAdapter, PlayerEvents, PlayerSnapshot, PlayerSource } from "./types";

type Listener = (payload: never) => void;

/** Shared event plumbing and the plain-iframe behaviour (no seek, no state). */
export abstract class BasePlayer implements PlayerAdapter {
  abstract readonly platform: string;
  abstract readonly capabilities: PlatformCapabilities;
  protected el: HTMLElement | null = null;
  protected src: PlayerSource | null = null;
  protected destroyed = false;
  private listeners = new Map<keyof PlayerEvents, Set<Listener>>();

  abstract mount(el: HTMLElement, src: PlayerSource): void;
  seek(t: number): void { void t; }
  play(): void {}
  pause(): void {}
  setMuted(muted: boolean): void { void muted; }
  snapshot(): PlayerSnapshot | null { return null; }

  on<E extends keyof PlayerEvents>(event: E, fn: (payload: PlayerEvents[E]) => void) {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(fn as Listener);
    this.listeners.set(event, set);
    return () => void set.delete(fn as Listener);
  }

  protected emit<E extends keyof PlayerEvents>(event: E, payload: PlayerEvents[E]) {
    if (this.destroyed) return;
    this.listeners.get(event)?.forEach((fn) => (fn as (p: PlayerEvents[E]) => void)(payload));
  }

  destroy() {
    this.destroyed = true;
    this.listeners.clear();
    this.el?.replaceChildren();
  }

  protected createFrame(url: string, title: string): HTMLIFrameElement {
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.title = title;
    frame.allow = "autoplay; fullscreen; picture-in-picture";
    frame.allowFullscreen = true;
    frame.style.width = "100%";
    frame.style.height = "100%";
    frame.style.border = "0";
    return frame;
  }
}

/** Fallback for platforms without a dedicated adapter: embed the API's embedUrl as-is. */
export class IframePlayer extends BasePlayer {
  readonly platform: string;
  readonly capabilities: PlatformCapabilities;
  constructor(platform: string, capabilities: PlatformCapabilities) {
    super();
    this.platform = platform;
    this.capabilities = capabilities;
  }
  mount(el: HTMLElement, src: PlayerSource) {
    this.el = el;
    this.src = src;
    if (!src.embedUrl) return this.emit("error", "No embeddable player for this source");
    el.replaceChildren(this.createFrame(src.embedUrl, src.title));
    this.emit("ready", undefined);
  }
}
