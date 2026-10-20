import type { PlatformCapabilities } from "../types";
import { BasePlayer } from "./base";
import type { PlayerSource } from "./types";

/**
 * Bilibili's embed has no control API: a seek reloads the iframe at `t`
 * (only ever called for explicit user seeks) and pause is not possible, so
 * callers unmount instead (capabilities.pause === false).
 */
export class BilibiliPlayer extends BasePlayer {
  readonly platform = "bilibili";
  readonly capabilities: PlatformCapabilities;

  constructor(capabilities: PlatformCapabilities) {
    super();
    this.capabilities = capabilities;
  }

  mount(el: HTMLElement, src: PlayerSource) {
    this.el = el;
    this.src = src;
    this.load(src.start);
    this.emit("ready", undefined);
  }

  private load(t: number) {
    if (!this.el || !this.src) return;
    if (!this.src.embedUrl) return this.emit("error", "No embeddable player for this source");
    const url = new URL(this.src.embedUrl);
    url.searchParams.set("t", String(Math.floor(t)));
    this.el.replaceChildren(this.createFrame(url.href, this.src.title));
  }

  seek(t: number) {
    this.load(t);
  }
}
