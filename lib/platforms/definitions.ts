import { siBilibili, siTwitch, siYoutube } from "simple-icons";
import { BilibiliPlayer } from "./players/bilibili";
import { TwitchPlayer, twitchTime } from "./players/twitch";
import { YouTubePlayer } from "./players/youtube";
import type { PlatformCapabilities, PlatformDefinition, PlatformRefKind, WatchRef } from "./types";

const NONE: PlatformCapabilities = {
  seek: false, navigate: false, timeEvents: false, pause: true, mute: false, fullscreen: true, swap: false,
  clips: false, createClip: false, clipParentRange: false,
};

function url(input: string): URL | null {
  try {
    return new URL(/^[a-z]+:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
}

function host(u: URL) {
  return u.hostname.replace(/^(www|m)\./, "");
}

function withParam(href: string, key: string, value: string) {
  const u = url(href);
  if (!u) return href;
  u.searchParams.set(key, value);
  return u.href;
}

const secs = (t: number) => String(Math.max(0, Math.floor(t)));

const TWITCH_RESERVED = new Set(["videos", "directory", "downloads", "jobs", "settings", "p", "login", "search"]);

const twitchCaps: PlatformCapabilities = {
  seek: true, navigate: true, timeEvents: true, pause: true, mute: true, fullscreen: true, swap: true,
  clips: true, createClip: true, clipParentRange: true,
};

export const twitch: PlatformDefinition = {
  id: "twitch",
  name: "Twitch",
  mark: siTwitch,
  capabilities: twitchCaps,
  formatTimestamp: twitchTime,
  watchUrl: (ref, t) =>
    `https://www.twitch.tv/videos/${ref.sourceId}${t === undefined ? "" : `?t=${twitchTime(t)}`}`,
  channelUrl: (ref) => (ref.login ? `https://www.twitch.tv/${ref.login}` : null),
  parseUrl(input) {
    const u = url(input);
    if (!u) return null;
    const h = host(u);
    const parts = u.pathname.split("/").filter(Boolean);
    if (h === "clips.twitch.tv" && parts[0]) return { kind: "clip", id: parts[0] };
    if (h !== "twitch.tv" || !parts[0]) return null;
    if (parts[0] === "videos" && parts[1]) return { kind: "recording", id: parts[1] };
    if (parts[1] === "clip" && parts[2]) return { kind: "clip", id: parts[2] };
    if (TWITCH_RESERVED.has(parts[0].toLowerCase()) || parts.length > 1) return null;
    return { kind: "channel", id: parts[0].toLowerCase() };
  },
  createPlayer: (caps) => new TwitchPlayer(caps),
};

const youtubeCaps: PlatformCapabilities = {
  seek: true, navigate: true, timeEvents: true, pause: true, mute: true, fullscreen: true, swap: false,
  clips: true, createClip: false, clipParentRange: false,
};

export const youtube: PlatformDefinition = {
  id: "youtube",
  name: "YouTube",
  mark: siYoutube,
  capabilities: youtubeCaps,
  formatTimestamp: (t) => `${secs(t)}s`,
  watchUrl: (ref, t) => {
    const base = ref.watchUrl || `https://www.youtube.com/watch?v=${ref.sourceId}`;
    return t === undefined ? base : withParam(base, "t", `${secs(t)}s`);
  },
  channelUrl: (ref) => `https://www.youtube.com/channel/${ref.sourceId}`,
  parseUrl(input) {
    const u = url(input);
    if (!u) return null;
    const h = host(u);
    const parts = u.pathname.split("/").filter(Boolean);
    if (h === "youtu.be" && parts[0]) return { kind: "recording", id: parts[0] };
    if (h !== "youtube.com") return null;
    if (parts[0] === "watch") {
      const v = u.searchParams.get("v");
      return v ? { kind: "recording", id: v } : null;
    }
    if ((parts[0] === "live" || parts[0] === "shorts" || parts[0] === "embed") && parts[1]) {
      return { kind: "recording", id: parts[1] };
    }
    if (parts[0] === "clip" && parts[1]) return { kind: "clip", id: parts[1] };
    if (parts[0]?.startsWith("@")) return { kind: "channel", id: parts[0] };
    if (parts[0] === "channel" && parts[1]) return { kind: "channel", id: parts[1] };
    return null;
  },
  createPlayer: (caps) => new YouTubePlayer(caps),
};

const bilibiliCaps: PlatformCapabilities = {
  seek: false, navigate: true, timeEvents: false, pause: false, mute: false, fullscreen: true, swap: false,
  clips: false, createClip: false, clipParentRange: false,
};

export const bilibili: PlatformDefinition = {
  id: "bilibili",
  name: "Bilibili",
  mark: siBilibili,
  capabilities: bilibiliCaps,
  formatTimestamp: secs,
  watchUrl: (ref, t) => {
    const base = ref.watchUrl || `https://www.bilibili.com/video/${ref.sourceId.split(":")[0]}`;
    return t === undefined ? base : withParam(base, "t", secs(t));
  },
  channelUrl: (ref) => `https://space.bilibili.com/${ref.sourceId}`,
  parseUrl(input) {
    const u = url(input);
    if (!u) return null;
    const h = host(u);
    const parts = u.pathname.split("/").filter(Boolean);
    if (h === "bilibili.com" && parts[0] === "video" && parts[1]) return { kind: "recording", id: parts[1] };
    if (h === "space.bilibili.com" && parts[0]) return { kind: "channel", id: parts[0] };
    return null;
  },
  createPlayer: (caps) => new BilibiliPlayer(caps),
};

/** Definition used for platform ids the registry does not know. */
export function genericPlatform(id: string): PlatformDefinition {
  return {
    id,
    name: id ? id[0].toUpperCase() + id.slice(1) : "Unknown",
    mark: null,
    capabilities: NONE,
    formatTimestamp: secs,
    watchUrl: (ref: WatchRef, t) => {
      const base = ref.watchUrl ?? "";
      return base && t !== undefined ? withParam(base, "t", secs(t)) : base;
    },
    channelUrl: () => null,
    parseUrl: (): { kind: PlatformRefKind; id: string } | null => null,
  };
}

export const BUILTIN_PLATFORMS = [twitch, youtube, bilibili];
