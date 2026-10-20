import type { PlatformCapabilities } from "../types";
import { BasePlayer } from "./base";
import type { PlayerSnapshot, PlayerSource } from "./types";

const ORIGIN = "https://www.youtube.com";

/** YouTube IFrame API over postMessage (enablejsapi); seeks without reloading. */
export class YouTubePlayer extends BasePlayer {
  readonly platform = "youtube";
  readonly capabilities: PlatformCapabilities;
  private frame: HTMLIFrameElement | null = null;
  private apiReady = false;
  private pendingSeek: number | null = null;
  private pendingPlay = false;
  private time = 0;
  private duration = 0;
  private paused = true;
  private muted = false;
  private onMessage: ((e: MessageEvent) => void) | null = null;

  constructor(capabilities: PlatformCapabilities) {
    super();
    this.capabilities = capabilities;
  }

  mount(el: HTMLElement, src: PlayerSource) {
    this.el = el;
    this.src = src;
    if (!src.embedUrl) return this.emit("error", "No embeddable player for this source");
    const start = Math.floor(this.pendingSeek ?? src.start);
    this.pendingSeek = null;
    const url = new URL(src.embedUrl);
    url.searchParams.set("start", String(start));
    url.searchParams.set("enablejsapi", "1");
    url.searchParams.set("origin", window.location.origin);
    const frame = this.createFrame(url.href, src.title);
    this.frame = frame;
    frame.addEventListener("load", () => this.post({ event: "listening", id: 1, channel: "widget" }));
    this.onMessage = (e) => {
      if (e.source !== frame.contentWindow || typeof e.data !== "string") return;
      let msg: { event?: string; info?: { playerState?: unknown; muted?: unknown; currentTime?: unknown; duration?: unknown } };
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.event === "onReady" || msg.event === "initialDelivery") {
        if (!this.apiReady) {
          this.apiReady = true;
          if (this.pendingSeek !== null) {
            this.command("seekTo", [this.pendingSeek, true]);
            this.pendingSeek = null;
          }
          if (this.pendingPlay) {
            this.pendingPlay = false;
            this.command("playVideo");
          }
        }
      } else if (msg.event === "infoDelivery") {
        const info = msg.info ?? {};
        const patch: PlayerSnapshot = {};
        if (typeof info.playerState === "number") patch.paused = this.paused = info.playerState !== 1;
        if (typeof info.muted === "boolean") patch.muted = this.muted = info.muted;
        if (typeof info.duration === "number" && info.duration > 0) this.duration = info.duration;
        if (typeof info.currentTime === "number") {
          patch.time = this.time = info.currentTime;
          patch.duration = this.duration;
        }
        if (Object.keys(patch).length) this.emit("state", patch);
      }
    };
    window.addEventListener("message", this.onMessage);
    el.replaceChildren(frame);
    this.emit("ready", undefined);
  }

  private post(payload: unknown) {
    this.frame?.contentWindow?.postMessage(JSON.stringify(payload), ORIGIN);
  }

  private command(func: string, args: unknown[] = []) {
    this.post({ event: "command", func, args });
  }

  seek(t: number) {
    if (this.apiReady) this.command("seekTo", [t, true]);
    else this.pendingSeek = t;
  }

  play() {
    if (this.apiReady) this.command("playVideo");
    else this.pendingPlay = true;
  }

  pause() {
    this.command("pauseVideo");
    this.paused = true;
    this.pendingPlay = false;
  }

  setMuted(muted: boolean) {
    this.command(muted ? "mute" : "unMute");
    this.muted = muted;
    this.emit("state", { muted });
  }

  snapshot(): PlayerSnapshot {
    return { paused: this.paused, muted: this.muted, time: this.time, duration: this.duration };
  }

  destroy() {
    if (this.onMessage) window.removeEventListener("message", this.onMessage);
    this.frame = null;
    super.destroy();
  }
}
