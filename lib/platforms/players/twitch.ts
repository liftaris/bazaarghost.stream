import type { PlatformCapabilities } from "../types";
import { BasePlayer } from "./base";
import type { PlayerSnapshot, PlayerSource } from "./types";

interface TwitchSdkPlayer {
  addEventListener(event: string, fn: () => void): void;
  seek(t: number): void;
  setVideo(id: string, t: number): void;
  play(): void;
  pause(): void;
  setMuted(muted: boolean): void;
  getMuted(): boolean;
  isPaused(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
}

declare global {
  interface Window {
    Twitch?: { Player: new (id: string, options: Record<string, unknown>) => TwitchSdkPlayer };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTwitchScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.Twitch?.Player) return resolve();
    const existing = document.querySelector('script[src*="player.twitch.tv/js/embed/v1.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Twitch script")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://player.twitch.tv/js/embed/v1.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Twitch player script"));
    document.head.appendChild(script);
  });
  scriptPromise.catch(() => { scriptPromise = null; });
  return scriptPromise;
}

function twitchTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m${s % 60}s`;
}

export { twitchTime };

/** Twitch SDK player: created once, `setVideo` between videos. */
export class TwitchPlayer extends BasePlayer {
  readonly platform = "twitch";
  readonly capabilities: PlatformCapabilities;
  private player: TwitchSdkPlayer | null = null;
  private ready = false;
  private pendingSeek: number | null = null;
  private swapTarget: number | null = null;
  private wantPlay = false;
  private playRetry: ReturnType<typeof setInterval> | null = null;
  private current: PlayerSource | null = null;

  constructor(capabilities: PlatformCapabilities) {
    super();
    this.capabilities = capabilities;
  }

  mount(el: HTMLElement, src: PlayerSource) {
    this.el = el;
    this.current = src;
    void this.init();
  }

  private async init() {
    try {
      await loadTwitchScript();
      if (this.destroyed || !this.el || !this.current) return;
      this.el.replaceChildren();
      const { sourceId, start } = this.current;
      const player = new window.Twitch!.Player(this.el.id, {
        video: sourceId,
        width: "100%",
        height: "100%",
        autoplay: true,
        time: twitchTime(start),
        parent: [window.location.hostname],
      });
      this.player = player;
      player.addEventListener("ready", () => {
        this.ready = true;
        this.emit("ready", undefined);
        if (this.pendingSeek !== null) {
          player.seek(this.pendingSeek);
          this.pendingSeek = null;
        }
      });
      const landSwap = () => {
        // setVideo's timestamp is ignored once the new video loads: land on the target after it starts
        if (this.swapTarget === null) return;
        const target = this.swapTarget;
        this.swapTarget = null;
        try {
          if (Math.abs((player.getCurrentTime() ?? 0) - target) > 2) player.seek(target);
        } catch { /* ignore */ }
      };
      player.addEventListener("playing", () => {
        landSwap();
        this.emit("state", this.snapshot() ?? { paused: false });
      });
      player.addEventListener("pause", () => this.emit("state", this.snapshot() ?? { paused: true }));
      player.addEventListener("ended", () => {
        landSwap();
        this.emit("state", { paused: true });
      });
      player.addEventListener("seek", () => {
        this.emit("time", this.snapshot() ?? {});
      });
    } catch (err) {
      this.emit("error", err instanceof Error ? err.message : "Failed to initialize player");
    }
  }

  swap(src: PlayerSource) {
    this.current = src;
    if (!this.player) return;
    try {
      this.wantPlay = true;
      this.swapTarget = src.start;
      this.pendingSeek = null;
      this.player.setVideo(src.sourceId, src.start);
      this.player.play();
    } catch {
      // ignore
    }
  }

  seek(t: number) {
    if (!this.player) {
      if (this.current) this.current = { ...this.current, start: t };
    } else if (this.ready) {
      this.swapTarget = null;
      this.player.seek(t);
    } else {
      this.pendingSeek = t;
    }
  }

  play() {
    this.wantPlay = true;
    this.pushPlay();
  }

  /** A play() issued around a seek can be swallowed; keep nudging until the player runs. */
  private pushPlay() {
    if (this.playRetry) clearInterval(this.playRetry);
    let tries = 0;
    const attempt = () => {
      const p = this.player;
      try {
        if (!p || !this.wantPlay || (this.ready && !p.isPaused() && tries > 0) || tries++ > 10) return this.stopRetry();
        if (this.ready) p.play();
      } catch { this.stopRetry(); }
    };
    attempt();
    this.playRetry = setInterval(attempt, 500);
  }

  private stopRetry() {
    if (this.playRetry) clearInterval(this.playRetry);
    this.playRetry = null;
  }

  pause() {
    this.wantPlay = false;
    this.stopRetry();
    try { this.player?.pause(); } catch { /* ignore */ }
  }

  setMuted(muted: boolean) {
    try {
      this.player?.setMuted(muted);
      this.emit("state", { muted });
    } catch { /* ignore */ }
  }

  snapshot(): PlayerSnapshot | null {
    const p = this.player;
    if (!p) return null;
    try {
      return {
        time: p.getCurrentTime() ?? 0,
        duration: p.getDuration() ?? 0,
        paused: p.isPaused() ?? true,
        muted: p.getMuted() ?? false,
      };
    } catch {
      return null;
    }
  }

  destroy() {
    this.stopRetry();
    this.player = null;
    super.destroy();
  }
}
