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
  const currentVideoRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekTargetRef = useRef<number | null>(null);
  const containerElRef = useRef<HTMLElement | null>(null);
  const slotRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const registerSlot = useCallback((el: HTMLElement | null) => {
    slotRef.current = el;
  }, []);

  // ---- Poll player state ----
  useEffect(() => {
    if (!isReady || !playerRef.current) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const polledTime = p.getCurrentTime() ?? 0;
        // If we're waiting for a seek to land, only resume polling currentTime
        // once the player is within 2s of the target
        if (seekTargetRef.current !== null) {
          if (Math.abs(polledTime - seekTargetRef.current) < 2) {
            seekTargetRef.current = null;
            setCurrentTime(polledTime);
          }
          // otherwise skip — keep the optimistic value
        } else {
          setCurrentTime(polledTime);
        }
        setDuration(p.getDuration() ?? 0);
        setIsPaused(p.isPaused() ?? true);
        setIsMuted(p.getMuted() ?? false);
      } catch {
        // Player may not be ready yet
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isReady]);

  useEffect(() => {
    if (!playback.data) return;
    const video=playback.data.video;
    setDuration(video.durationSeconds);
    setState(previous=>({...previous,meta:{streamerName:video.creator.name,streamerAvatar:video.creator.avatarUrl??"",vodTitle:video.title,date:video.publishedAt??""}}));
  },[playback.data]);

  // ---- Create / update the Twitch player ----
  useEffect(() => {
    if (!state.videoId || !playback.data) return;
    if (playback.data.video.id !== Number(state.videoId.slice(2))) return;
    if (!playback.data.player.available) {setError("This video is no longer available on its original platform.");return;}
    if (playback.data.player.platform !== "twitch") {
      const container=document.getElementById(CONTAINER_ID);
      if (!container || !playback.data.player.embedUrl) return;
      playerRef.current=null; container.replaceChildren();
      const frame=document.createElement("iframe");
      const url=new URL(playback.data.player.embedUrl);
      url.searchParams.set(playback.data.player.platform==="youtube"?"start":"t",String(Math.floor(state.timestamp??0)));
      frame.src=url.href;frame.title=playback.data.video.title;
      frame.allow="autoplay; fullscreen; picture-in-picture";frame.allowFullscreen=true;
      frame.style.width="100%";frame.style.height="100%";frame.style.border="0";
      container.appendChild(frame);setIsReady(true);setError(null);
      return ()=>frame.remove();
    }
    let cancelled=false;
    // The player lives in a persistent host, but if its container ever changes
    // or the iframe is gone, drop stale refs so this load re-inits.
    const liveContainer=document.getElementById(CONTAINER_ID);
    if (liveContainer!==containerElRef.current || (playerRef.current && !liveContainer?.querySelector("iframe"))) {
      containerElRef.current=liveContainer;
      playerRef.current=null;
      currentVideoRef.current=null;
    }
    const sameVideo = state.videoId === currentVideoRef.current;

    if (sameVideo && playerRef.current && state.timestamp != null) {
      // Same VOD — just seek
      playerRef.current.seek(state.timestamp);
      playerRef.current.play();
      return;
    }

    // Different VOD — create new player
    currentVideoRef.current = state.videoId;
    setIsReady(false);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPaused(true);

    const init = async () => {
      try {
        await loadTwitchScript();
        if(cancelled)return;

        const container = document.getElementById(CONTAINER_ID);
        if (!container) return;

        // Destroy previous
        if (playerRef.current) {
          playerRef.current = null;
          container.innerHTML = "";
        }

        const hours = Math.floor((state.timestamp ?? 0) / 3600);
        const minutes = Math.floor(((state.timestamp ?? 0) % 3600) / 60);
        const seconds = Math.floor((state.timestamp ?? 0) % 60);

        playerRef.current = new window.Twitch!.Player(CONTAINER_ID, {
          video: playback.data!.player.sourceId,
          width: "100%",
          height: "100%",
          autoplay: true,
          time: `${hours}h${minutes}m${seconds}s`,
          parent: [window.location.hostname],
        });

        playerRef.current.addEventListener("ready", () => setIsReady(true));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize player"
        );
      }
    };

    void init();
    return ()=>{cancelled=true;};
  }, [state.videoId, state.timestamp, playback.data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
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
  const setEmbed = useCallback(
    (videoId: string, timestamp: number, meta?: EmbedMeta) => {
      setState((prev) => ({
        ...prev,
        videoId,
        timestamp,
        meta: meta ?? prev.meta,
      }));
      setIsVisible(true);
    },
    []
  );

  const hideEmbed = useCallback(() => {
    setIsVisible(false);
  }, []);

  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
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
    } catch {
      // ignore
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    seekTargetRef.current = seconds; // suppress poll until player catches up
    setCurrentTime(seconds); // optimistic update
    if (playback.data?.player.platform !== "twitch") setState(previous=>({...previous,timestamp:seconds}));
    else playerRef.current?.seek(seconds);
  }, [playback.data?.player.platform]);

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
        onClose={() => {
          pause();
          hideEmbed();
        }}
      />
    </EmbedContext.Provider>
  );
}
