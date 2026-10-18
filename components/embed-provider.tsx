"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { PlayerHost } from "@/components/player/player-host";
import { usePlayback } from "@/hooks/use-playback";
import type { Playback } from "@/lib/api-contract";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmbedGhost {
  matchup_id?: number;
  detection_id: string;
  username: string;
  rank: string | null;
  frame_time_seconds: number;
}

interface EmbedMeta {
  streamerName: string;
  streamerAvatar: string;
  vodTitle: string;
  date: string;
}

interface EmbedState {
  videoId: string | null;
  timestamp: number | null;
  meta: EmbedMeta | null;
}

interface EmbedContextValue extends EmbedState {
  playback: Playback | null;
  /** Load a VOD (or seek if already loaded). Pass meta for the info bar. */
  setEmbed: (videoId: string, timestamp: number, meta?: EmbedMeta) => void;
  /** Hide the embed panel entirely. */
  hideEmbed: () => void;
  /** Whether the embed panel is visible. */
  isVisible: boolean;
  /** Whether the Twitch player is ready. */
  isReady: boolean;
  /** Player error, if any. */
  error: string | null;
  /** Stable container ID for the Twitch player div. */
  containerId: string;
  /** Register the PlayerSlot element the persistent host should cover. */
  registerSlot: (el: HTMLElement | null) => void;

  // ---- Player controls ----
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  seek: (seconds: number) => void;
  isPaused: boolean;
  isMuted: boolean;
  /** Current playback position in seconds (polled). */
  currentTime: number;
  /** Total VOD duration in seconds. */
  duration: number;

  // ---- Ghost data ----
  /** All ghost markers for the current VOD, sorted by time ascending. */
  ghosts: EmbedGhost[];
  /**
   * The currently-active ghost. Derived from playback position during normal
   * playback, but can be set optimistically via {@link setActiveGhost} for
   * instant UI feedback before the player seek lands.
   */
  activeGhost: EmbedGhost | null;
  /** Optimistically set the active ghost (e.g. on result row click, arrow nav). */
  setActiveGhost: (ghost: EmbedGhost | null) => void;
  /** True while activeGhost is an optimistic (user-initiated) override. */
  ghostIsOptimistic: boolean;

  // ---- VOD data (fetched from vod_embed_info) ----
  bazaarChapters: number[] | null;
}

const EmbedContext = createContext<EmbedContextValue | null>(null);

export function useEmbed(): EmbedContextValue {
  const ctx = useContext(EmbedContext);
  if (!ctx) throw new Error("useEmbed must be used within EmbedProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Twitch script loader (singleton)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    Twitch?: { Player: any };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTwitchScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if (window.Twitch?.Player) return resolve();

    const existing = document.querySelector(
      'script[src*="player.twitch.tv/js/embed/v1.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Twitch script"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://player.twitch.tv/js/embed/v1.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Twitch player script"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const CONTAINER_ID = "bazaarghost-twitch-embed";
const POLL_INTERVAL_MS = 500;

export function EmbedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmbedState>({
    videoId: null,
    timestamp: null,
    meta: null,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player state (polled)
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Ghost markers
  const playback = usePlayback(state.videoId);
  const ghosts = useMemo(() => playback.markers.map(marker => ({matchup_id:marker.id,detection_id:String(marker.id),username:marker.username,rank:marker.rank,frame_time_seconds:marker.timestampSeconds})),[playback.markers]);

  // Optimistic ghost override — when non-null, takes precedence over time-derived.
  // Cleared once the polled currentTime catches up to the ghost's timestamp.
  const [ghostOverride, setGhostOverride] = useState<EmbedGhost | null>(null);

  // VOD data (fetched from vod_embed_info)
  const bazaarChapters = playback.data?.chapters ?? null;

  const playerRef = useRef<any>(null);
  const playerPlatformRef = useRef<string | null>(null);
  const loadedVideoRef = useRef<string | null>(null);
  const videoIdRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const youtubeReadyRef = useRef(false);
  const seekTargetRef = useRef<number | null>(null);
  const slotRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [pageVisible, setPageVisible] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);

  const registerSlot = useCallback((el: HTMLElement | null) => {
    slotRef.current = el;
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const youtubeCommand = useCallback((func: string, args: unknown[] = []) => {
    const frame = document.getElementById(CONTAINER_ID)?.querySelector("iframe");
    frame?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "https://www.youtube.com"
    );
  }, []);

  /** Read the Twitch player into state (called on events and while polling). */
  const syncFromPlayer = useCallback(() => {
    const p = playerRef.current;
    if (!p || playerPlatformRef.current !== "twitch") return;
    try {
      const polledTime = p.getCurrentTime() ?? 0;
      // While a seek is in flight keep the optimistic value until it lands
      if (seekTargetRef.current !== null) {
        if (Math.abs(polledTime - seekTargetRef.current) < 2) {
          seekTargetRef.current = null;
          setCurrentTime(polledTime);
        }
      } else {
        setCurrentTime(polledTime);
      }
      const d = p.getDuration() ?? 0;
      if (d > 0) setDuration(d);
      setIsPaused(p.isPaused() ?? true);
      setIsMuted(p.getMuted() ?? false);
    } catch {
      // Player may not be ready yet
    }
  }, []);

  // ---- Poll only while playing and visible ----
  useEffect(() => {
    if (!isReady || isPaused || !pageVisible || !playerRef.current) return;
    syncFromPlayer();
    const id = setInterval(syncFromPlayer, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isReady, isPaused, pageVisible, syncFromPlayer]);

  useEffect(() => {
    if (!playback.data) return;
    const video=playback.data.video;
    setDuration(video.durationSeconds);
    setState(previous=>({...previous,meta:{streamerName:video.creator.name,streamerAvatar:video.creator.avatarUrl??"",vodTitle:video.title,date:video.publishedAt??""}}));
  },[playback.data]);

  const pause = useCallback(() => {
    try {
      if (playerPlatformRef.current === "twitch") playerRef.current?.pause();
      else if (playerPlatformRef.current === "youtube") youtubeCommand("pauseVideo");
    } catch {
      // ignore
    }
    setIsPaused(true);
  }, [youtubeCommand]);

  const data = playback.data;
  const dataVideoId = data?.video.id ?? null;
  const platform = data?.player.platform ?? null;
  const sourceId = data?.player.sourceId ?? null;
  const embedUrl = data?.player.embedUrl ?? null;
  const available = data?.player.available ?? true;
  const videoTitle = data?.video.title ?? "";
  const bilibiliHidden = platform === "bilibili" && !isVisible;

  // ---- Create / update the player. Twitch: created once, setVideo on change ----
  useEffect(() => {
    setError(null);
    if (!state.videoId || dataVideoId === null) return;
    if (dataVideoId !== Number(state.videoId.slice(2))) return;
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;
    if (!available) {
      pause();
      if (playerPlatformRef.current !== "twitch") {
        container.replaceChildren();
        playerRef.current = null;
        playerPlatformRef.current = null;
        loadedVideoRef.current = null;
        readyRef.current = false;
        setIsReady(false);
      }
      setError("This video is no longer available on its original platform.");
      return;
    }
    if (platform !== "twitch") {
      if (!embedUrl) return;
      const old = container.querySelector("iframe");
      if (old) old.remove();
      playerRef.current = null;
      playerPlatformRef.current = platform;
      loadedVideoRef.current = null;
      readyRef.current = false;
      youtubeReadyRef.current = false;
      if (bilibiliHidden) {
        setIsReady(false);
        return;
      }
      const start = Math.floor(pendingSeekRef.current ?? 0);
      pendingSeekRef.current = null;
      const frame = document.createElement("iframe");
      const url = new URL(embedUrl);
      url.searchParams.set(platform === "youtube" ? "start" : "t", String(start));
      if (platform === "youtube") {
        url.searchParams.set("enablejsapi", "1");
        url.searchParams.set("origin", window.location.origin);
      }
      frame.src = url.href;
      frame.title = videoTitle;
      frame.allow = "autoplay; fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      frame.style.width = "100%";
      frame.style.height = "100%";
      frame.style.border = "0";
      let onMessage: ((e: MessageEvent) => void) | null = null;
      if (platform === "youtube") {
        frame.addEventListener("load", () =>
          frame.contentWindow?.postMessage(
            JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
            "https://www.youtube.com"
          )
        );
        onMessage = (e) => {
          if (e.source !== frame.contentWindow || typeof e.data !== "string") return;
          let msg: any;
          try { msg = JSON.parse(e.data); } catch { return; }
          if (msg.event === "onReady" || msg.event === "initialDelivery") {
            if (!youtubeReadyRef.current) {
              youtubeReadyRef.current = true;
              readyRef.current = true;
              if (pendingSeekRef.current !== null) {
                youtubeCommand("seekTo", [pendingSeekRef.current, true]);
                pendingSeekRef.current = null;
              }
            }
          } else if (msg.event === "infoDelivery" && typeof msg.info?.playerState === "number") {
            setIsPaused(msg.info.playerState !== 1);
          }
        };
        window.addEventListener("message", onMessage);
      }
      container.appendChild(frame);
      loadedVideoRef.current = state.videoId;
      setIsReady(true);
      return () => {
        if (onMessage) window.removeEventListener("message", onMessage);
        frame.remove();
      };
    }

    // Twitch
    if (
      playerRef.current &&
      playerPlatformRef.current === "twitch" &&
      container.querySelector("iframe")
    ) {
      if (loadedVideoRef.current === state.videoId) return;
      loadedVideoRef.current = state.videoId;
      const start = pendingSeekRef.current ?? 0;
      pendingSeekRef.current = null;
      seekTargetRef.current = start;
      setCurrentTime(start);
      try {
        playerRef.current.setVideo(sourceId, start);
        playerRef.current.play();
      } catch {
        // ignore
      }
      return;
    }

    let cancelled = false;
    playerRef.current = null;
    playerPlatformRef.current = "twitch";
    loadedVideoRef.current = state.videoId;
    readyRef.current = false;
    setIsReady(false);
    setCurrentTime(0);
    setIsPaused(true);

    const init = async () => {
      try {
        await loadTwitchScript();
        if (cancelled) return;
        container.replaceChildren();
        const start = Math.floor(pendingSeekRef.current ?? 0);
        pendingSeekRef.current = null;
        const hours = Math.floor(start / 3600);
        const minutes = Math.floor((start % 3600) / 60);
        const seconds = start % 60;
        const player = new window.Twitch!.Player(CONTAINER_ID, {
          video: sourceId,
          width: "100%",
          height: "100%",
          autoplay: true,
          time: `${hours}h${minutes}m${seconds}s`,
          parent: [window.location.hostname],
        });
        playerRef.current = player;
        player.addEventListener("ready", () => {
          readyRef.current = true;
          setIsReady(true);
          if (pendingSeekRef.current !== null) {
            player.seek(pendingSeekRef.current);
            pendingSeekRef.current = null;
          }
        });
        player.addEventListener("playing", () => {
          setIsPaused(false);
          syncFromPlayer();
        });
        player.addEventListener("pause", () => {
          setIsPaused(true);
          syncFromPlayer();
        });
        player.addEventListener("ended", () => setIsPaused(true));
        player.addEventListener("seek", () => syncFromPlayer());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize player"
        );
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [state.videoId, dataVideoId, platform, sourceId, embedUrl, available, videoTitle, bilibiliHidden, reloadNonce, pause, syncFromPlayer, youtubeCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        const container = document.getElementById(CONTAINER_ID);
        if (container) container.innerHTML = "";
        playerRef.current = null;
      }
    };
  }, []);

  // ---- Active ghost: optimistic override or time-derived ----
  const sortedGhosts = useMemo(
    () =>
      [...ghosts].sort((a, b) => a.frame_time_seconds - b.frame_time_seconds),
    [ghosts]
  );

  /** Derive the ghost whose timestamp is at or before current playback time. */
  const timeDerivedGhost = useMemo(() => {
    if (sortedGhosts.length === 0) return null;
    let match: EmbedGhost | null = null;
    for (const g of sortedGhosts) {
      if (g.frame_time_seconds <= currentTime) {
        match = g;
      } else {
        break;
      }
    }
    return match;
  }, [sortedGhosts, currentTime]);

  /**
   * Clear the optimistic override once the time-derived ghost matches it,
   * meaning the player has caught up to the seek target.
   */
  useEffect(() => {
    if (
      ghostOverride &&
      timeDerivedGhost &&
      ghostOverride.matchup_id === timeDerivedGhost.matchup_id
    ) {
      setGhostOverride(null);
    }
  }, [ghostOverride, timeDerivedGhost]);

  /** The active ghost: optimistic override wins, falls back to time-derived. */
  const activeGhost = ghostOverride ?? timeDerivedGhost;

  /**
   * Set the active ghost optimistically. Call this at user-triggered ghost
   * changes (row click, arrow nav, timeline click) for instant UI feedback.
   */
  const setActiveGhost = useCallback((ghost: EmbedGhost | null) => {
    setGhostOverride(ghost);
  }, []);

  // ---- Public API ----
  const seek = useCallback((seconds: number) => {
    seekTargetRef.current = seconds; // suppress poll until player catches up
    setCurrentTime(seconds); // optimistic update
    const loaded = loadedVideoRef.current === videoIdRef.current;
    const p = playerRef.current;
    if (loaded && readyRef.current && playerPlatformRef.current === "twitch" && p) {
      p.seek(seconds);
    } else if (loaded && playerPlatformRef.current === "youtube" && youtubeReadyRef.current) {
      youtubeCommand("seekTo", [seconds, true]);
    } else if (loaded && playerPlatformRef.current === "bilibili") {
      // Bilibili has no seek API: reload, only ever on explicit user seeks
      pendingSeekRef.current = seconds;
      setReloadNonce((n) => n + 1);
    } else {
      pendingSeekRef.current = seconds;
    }
  }, [youtubeCommand]);

  const setEmbed = useCallback(
    (videoId: string, timestamp: number, meta?: EmbedMeta) => {
      const changed = videoIdRef.current !== videoId;
      videoIdRef.current = videoId;
      setState((prev) => ({
        ...prev,
        videoId,
        timestamp,
        meta: meta ?? (changed ? null : prev.meta),
      }));
      if (changed) {
        setGhostOverride(null);
        setError(null);
      }
      setIsVisible(true);
      seek(timestamp);
      if (!changed) {
        try {
          if (playerPlatformRef.current === "twitch" && readyRef.current) playerRef.current?.play();
        } catch {
          // ignore
        }
      }
    },
    [seek]
  );

  const hideEmbed = useCallback(() => {
    pause();
    setIsVisible(false);
  }, [pause]);

  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (p.isPaused()) p.play();
      else p.pause();
    } catch {
      // ignore
    }
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.setMuted(!p.getMuted());
      setIsMuted(p.getMuted());
    } catch {
      // ignore
    }
  }, []);

  return (
    <EmbedContext.Provider
      value={{
        ...state,
        setEmbed,
        hideEmbed,
        isVisible,
        isReady,
        error: error ?? playback.error,
      playback: playback.data,
        containerId: CONTAINER_ID,
        registerSlot,
        play,
        pause,
        togglePlay,
        toggleMute,
        seek,
        isPaused,
        isMuted,
        currentTime,
        duration,
        ghosts: sortedGhosts,
        activeGhost,
        setActiveGhost,
        ghostIsOptimistic: ghostOverride !== null,
        bazaarChapters,
      }}
    >
      {children}
      <PlayerHost
        containerId={CONTAINER_ID}
        slotRef={slotRef}
        show={isVisible && !!state.videoId}
        error={error ?? playback.error}
        onExpand={() => {
          const url = activeGhost?.matchup_id ? `/matchups/${activeGhost.matchup_id}` : state.videoId?.startsWith("v:") ? `/videos/${state.videoId.slice(2)}` : null;
          if (url) router.push(url, { scroll: false });
        }}
        onClose={hideEmbed}
      />
    </EmbedContext.Provider>
  );
}
