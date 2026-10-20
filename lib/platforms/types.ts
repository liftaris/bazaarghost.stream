/** Platform ids come from the registry (and later the backend); never a closed union. */
export type PlatformId = string;

export type PlatformRefKind = "recording" | "clip" | "channel";

export interface PlatformCapabilities {
  /** Seek an already-loaded source without reloading the player. */
  seek: boolean;
  /** Jump to a position by any means (live seek or reloading the player); enables prev/next navigation. */
  navigate: boolean;
  /** Reports time/pause/duration so the timeline and active matchup can follow playback. */
  timeEvents: boolean;
  pause: boolean;
  mute: boolean;
  fullscreen: boolean;
  /** Switch to another video of this platform inside the same player instance. */
  swap: boolean;
  clips: boolean;
  createClip: boolean;
  /** Clips expose the time range they cover in their parent recording. */
  clipParentRange: boolean;
}

export interface PlatformMark {
  /** SVG path data on a 24x24 viewBox (simple-icons shape). */
  path: string;
  /** Brand colour, hex without "#". */
  hex?: string;
}

/** What a watch link is built from: the platform id of the video plus what the API gave us. */
export interface WatchRef {
  sourceId: string;
  /** Canonical URL from the API; preferred when present. */
  watchUrl?: string | null;
}

/** What a channel link is built from: the platform's account id plus its login, when known. */
export interface ChannelRef {
  sourceId: string;
  login: string | null;
}

export interface PlatformDefinition {
  id: PlatformId;
  name: string;
  /** Null renders the generic fallback icon. */
  mark: PlatformMark | null;
  capabilities: PlatformCapabilities;
  watchUrl(ref: WatchRef, t?: number): string;
  /** Public page of a channel, or null when the platform has none we can build. */
  channelUrl(ref: ChannelRef): string | null;
  parseUrl(url: string): { kind: PlatformRefKind; id: string } | null;
  /** Timestamp in the form this platform's links use. */
  formatTimestamp(seconds: number): string;
  /** Adapter factory; omitted definitions play through the plain iframe adapter. */
  createPlayer?: (capabilities: PlatformCapabilities) => import("./players/types").PlayerAdapter;
}

/** Backend-provided definitions may be partial; they override or extend built-ins. */
export type PlatformDefinitionInput = Partial<Omit<PlatformDefinition, "id" | "capabilities">> & {
  id: PlatformId;
  capabilities?: Partial<PlatformCapabilities>;
};
