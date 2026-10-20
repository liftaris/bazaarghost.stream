"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { PlayerHost, SLOT_EVENT } from "@/components/player/player-host";
import { usePlayback } from "@/hooks/use-playback";
import type { Playback } from "@/lib/api-contract";
import {
  createPlayerAdapter,
  getPlatform,
  type PlatformCapabilities,
  type PlayerAdapter,
  type PlayerSnapshot,
} from "@/lib/platforms";

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

interface EmbedActions {
  /** Load a VOD (or seek if already loaded). Pass meta for the info bar. */
  setEmbed: (videoId: string, timestamp: number, meta?: EmbedMeta) => void;
  hideEmbed: () => void;
  /** Stable container ID the platform adapters mount into. */
  containerId: string;
  /** Register the PlayerSlot element the persistent host should cover. */
  registerSlot: (el: HTMLElement | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  seek: (seconds: number) => void;
  /** Optimistically set the active ghost (e.g. on result row click, arrow nav). */
  setActiveGhost: (ghost: EmbedGhost | null) => void;
  /** Read the latest playback time without subscribing to ticks. */
  getTime: () => { currentTime: number; duration: number };
}

/** Slow-changing state: does not change while playback time advances. */
interface EmbedSlowState extends EmbedState {
  playback: Playback | null;
  isVisible: boolean;
  isReady: boolean;
  error: string | null;
  /** All ghost markers for the current VOD, sorted by time ascending. */
  ghosts: EmbedGhost[];
  /**
   * The currently-active ghost. Derived from playback position during normal
   * playback, but can be set optimistically via setActiveGhost for instant UI
   * feedback before the player seek lands.
   */
  activeGhost: EmbedGhost | null;
  /** True while activeGhost is an optimistic (user-initiated) override. */
  ghostIsOptimistic: boolean;
  bazaarChapters: number[] | null;
  /** Capabilities of the current video's platform; null until playback loads. */
  capabilities: PlatformCapabilities | null;
}

/** Fast-changing player state (polled every 500ms while playing). */
export interface EmbedTimeState {
  /** Current playback position in seconds (polled). */
  currentTime: number;
  /** Total VOD duration in seconds. */
  duration: number;
  isPaused: boolean;
  isMuted: boolean;
}

type EmbedContextValue = EmbedSlowState & EmbedActions & EmbedTimeState;

class TimeStore {
  private state: EmbedTimeState = { currentTime: 0, duration: 0, isPaused: true, isMuted: false };
  private listeners = new Set<() => void>();
  get = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };
  set(patch: Partial<EmbedTimeState>) {
    const k = Object.keys(patch) as (keyof EmbedTimeState)[];
    if (k.every((key) => this.state[key] === patch[key])) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
}

const ActionsContext = createContext<EmbedActions | null>(null);
const SlowContext = createContext<EmbedSlowState | null>(null);
const TimeContext = createContext<TimeStore | null>(null);

/** Stable callbacks; never re-renders its consumer. */
export function useEmbedActions(): EmbedActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useEmbedActions must be used within EmbedProvider");
  return ctx;
}

/** Slow state (video, ghosts, activeGhost, visibility, ...); excludes playback time. */
export function useEmbedState(): EmbedSlowState {
  const ctx = useContext(SlowContext);
  if (!ctx) throw new Error("useEmbedState must be used within EmbedProvider");
  return ctx;
}

/** Subscribe to a slice of the fast time state; re-renders only when the selected value changes. */
export function useEmbedTime<T>(selector: (s: EmbedTimeState) => T): T {
  const store = useContext(TimeContext);
  if (!store) throw new Error("useEmbedTime must be used within EmbedProvider");
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(store.get()));
}

/** Compatibility hook returning everything. Re-renders on every time tick; prefer the narrow hooks. */
export function useEmbed(): EmbedContextValue {
  const time = useEmbedTime((s) => s);
  return { ...useEmbedState(), ...useEmbedActions(), ...time };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const CONTAINER_ID = "bazaarghost-player";
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

  // Player state (polled) lives in an external store so ticks don't re-render the tree
  const [timeStore] = useState(() => new TimeStore());
  const isPaused = useSyncExternalStore(timeStore.subscribe, () => timeStore.get().isPaused, () => true);
  const setIsPaused = useCallback((isPaused: boolean) => timeStore.set({ isPaused }), [timeStore]);
  const setIsMuted = useCallback((isMuted: boolean) => timeStore.set({ isMuted }), [timeStore]);
  const setCurrentTime = useCallback((currentTime: number) => timeStore.set({ currentTime }), [timeStore]);
  const setDuration = useCallback((duration: number) => timeStore.set({ duration }), [timeStore]);

  // Ghost markers
  const playback = usePlayback(state.videoId);
  const ghosts = useMemo(() => playback.markers.map(marker => ({matchup_id:marker.id,detection_id:String(marker.id),username:marker.username,rank:marker.rank,frame_time_seconds:marker.timestampSeconds})),[playback.markers]);

  // Optimistic ghost override — when non-null, takes precedence over time-derived.
  // Cleared once the polled currentTime catches up to the ghost's timestamp.
  const [ghostOverride, setGhostOverride] = useState<EmbedGhost | null>(null);

  // VOD data (fetched from vod_embed_info)
  const bazaarChapters = playback.data?.chapters ?? null;

  const adapterRef = useRef<PlayerAdapter | null>(null);
  const adapterOffRef = useRef<(() => void)[]>([]);
  const loadedVideoRef = useRef<string | null>(null);
  const loadedSourceRef = useRef<string | null>(null);
  const videoIdRef = useRef<string | null>(null);
  const pendingStartRef = useRef<number | null>(null);
  const seekTargetRef = useRef<number | null>(null);
  const slotRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [pageVisible, setPageVisible] = useState(true);

  const registerSlot = useCallback((el: HTMLElement | null) => {
    slotRef.current = el;
    window.dispatchEvent(new Event(SLOT_EVENT));
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  /** Fold what the adapter reports into the time store. */
  const applySnapshot = useCallback((snap: PlayerSnapshot) => {
    if (snap.time !== undefined) {
      // While a seek is in flight keep the optimistic value until it lands
      if (seekTargetRef.current !== null) {
        if (Math.abs(snap.time - seekTargetRef.current) < 2) {
          seekTargetRef.current = null;
          setCurrentTime(snap.time);
        }
      } else {
        setCurrentTime(snap.time);
      }
    }
    if (snap.duration !== undefined && snap.duration > 0) setDuration(snap.duration);
    if (snap.paused !== undefined) setIsPaused(snap.paused);
    if (snap.muted !== undefined) setIsMuted(snap.muted);
  }, [setCurrentTime, setDuration, setIsPaused, setIsMuted]);

  const syncFromPlayer = useCallback(() => {
    const snap = adapterRef.current?.snapshot();
    if (snap) applySnapshot(snap);
  }, [applySnapshot]);

  const disposeAdapter = useCallback(() => {
    adapterOffRef.current.forEach((off) => off());
    adapterOffRef.current = [];
    adapterRef.current?.destroy();
    adapterRef.current = null;
    loadedVideoRef.current = null;
    loadedSourceRef.current = null;
  }, []);

  const data = playback.data;
  const dataVideoId = data?.video.id ?? null;
  const platform = data?.player.platform ?? null;
  const sourceId = data?.player.sourceId ?? null;
  const embedUrl = data?.player.embedUrl ?? null;
  const available = data?.player.available ?? true;
  const videoTitle = data?.video.title ?? "";
  const capabilities = useMemo(() => (platform ? getPlatform(platform).capabilities : null), [platform]);
  const timeEvents = capabilities?.timeEvents ?? false;
  // Platforms that cannot pause are unmounted while the player is closed
  const unmountWhileHidden = !isVisible && capabilities?.pause === false;

  // ---- Poll only while playing and visible, for platforms that report time ----
  useEffect(() => {
    if (!isReady || isPaused || !pageVisible || !timeEvents || !adapterRef.current) return;
    syncFromPlayer();
    const id = setInterval(syncFromPlayer, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isReady, isPaused, pageVisible, timeEvents, syncFromPlayer]);

  useEffect(() => {
    if (!playback.data) return;
    const video=playback.data.video;
    setDuration(video.durationSeconds);
    setState(previous=>({...previous,meta:{streamerName:video.creator.name,streamerAvatar:video.creator.avatarUrl??"",vodTitle:video.title,date:video.publishedAt??""}}));
  },[playback.data, setDuration]);

  const pause = useCallback(() => {
    adapterRef.current?.pause();
    setIsPaused(true);
  }, [setIsPaused]);

  // ---- Create / swap the player through its adapter ----
  useEffect(() => {
    setError(null);
    if (!state.videoId || dataVideoId === null || platform === null || sourceId === null) return;
    if (dataVideoId !== Number(state.videoId.slice(2))) return;
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;
    const def = getPlatform(platform);
    let adapter = adapterRef.current;
    if (!available) {
      pause();
      if (adapter && !adapter.capabilities.swap) {
        disposeAdapter();
        setIsReady(false);
      }
      setError("This video is no longer available on its original platform.");
      return;
    }
    if (unmountWhileHidden) {
      disposeAdapter();
      setIsReady(false);
      return;
    }

    const source = `${sourceId}|${embedUrl ?? ""}`;
    const take = () => {
      const start = pendingStartRef.current ?? 0;
      pendingStartRef.current = null;
      return { sourceId, embedUrl, title: videoTitle, start };
    };

    if (adapter && adapter.platform === def.id) {
      if (adapter.swap && adapter.capabilities.swap) {
        if (loadedVideoRef.current === state.videoId) return;
        loadedVideoRef.current = state.videoId;
        loadedSourceRef.current = source;
        const src = take();
        seekTargetRef.current = src.start;
        setCurrentTime(src.start);
        adapter.swap(src);
        return;
      }
      if (loadedVideoRef.current === state.videoId && loadedSourceRef.current === source) return;
    }

    if (adapter) disposeAdapter();
    // Hold the requested start (not 0) until the player reports it, so the
    // active ghost doesn't drop out while the player boots.
    seekTargetRef.current = pendingStartRef.current;
    setCurrentTime(pendingStartRef.current ?? 0);
    setIsPaused(true);
    setIsReady(false);
    adapter = createPlayerAdapter(platform);
    adapterRef.current = adapter;
    loadedVideoRef.current = state.videoId;
    loadedSourceRef.current = source;
    adapterOffRef.current = [
      adapter.on("ready", () => setIsReady(true)),
      adapter.on("state", applySnapshot),
      adapter.on("time", applySnapshot),
      adapter.on("error", setError),
    ];
    adapter.mount(container, take());
  }, [state.videoId, dataVideoId, platform, sourceId, embedUrl, available, videoTitle, unmountWhileHidden, pause, applySnapshot, disposeAdapter, setCurrentTime, setIsPaused]);

  // Cleanup on unmount
  useEffect(() => disposeAdapter, [disposeAdapter]);

  // ---- Active ghost: optimistic override or time-derived ----
  const sortedGhosts = useMemo(
    () =>
      [...ghosts].sort((a, b) => a.frame_time_seconds - b.frame_time_seconds),
    [ghosts]
  );

  /** Derive the ghost whose timestamp is at or before current playback time. */
  const timeDerivedGhost = useSyncExternalStore(
    timeStore.subscribe,
    () => {
      const currentTime = timeStore.get().currentTime;
      let match: EmbedGhost | null = null;
      for (const g of sortedGhosts) {
        if (g.frame_time_seconds <= currentTime) match = g;
        else break;
      }
      return match;
    },
    () => null
  );

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
    const adapter = adapterRef.current;
    if (adapter && loadedVideoRef.current === videoIdRef.current) adapter.seek(seconds);
    else pendingStartRef.current = seconds;
  }, [setCurrentTime]);

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
      if (!changed) adapterRef.current?.play();
    },
    [seek]
  );

  const hideEmbed = useCallback(() => {
    pause();
    setIsVisible(false);
  }, [pause]);

  const play = useCallback(() => {
    adapterRef.current?.play();
  }, []);

  const togglePlay = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    const paused = adapter.snapshot()?.paused ?? timeStore.get().isPaused;
    if (paused) adapter.play();
    else adapter.pause();
  }, [timeStore]);

  const toggleMute = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter?.capabilities.mute) return;
    adapter.setMuted(!(adapter.snapshot()?.muted ?? timeStore.get().isMuted));
  }, [timeStore]);

  const actions = useMemo<EmbedActions>(
    () => ({ setEmbed, hideEmbed, containerId: CONTAINER_ID, registerSlot, play, pause, togglePlay, toggleMute, seek, setActiveGhost,
      getTime: () => timeStore.get() }),
    [setEmbed, hideEmbed, registerSlot, play, pause, togglePlay, toggleMute, seek, setActiveGhost, timeStore]
  );
  const mergedError = error ?? playback.error;
  const ghostIsOptimistic = ghostOverride !== null;
  const slow = useMemo<EmbedSlowState>(
    () => ({
      ...state,
      isVisible,
      isReady,
      error: mergedError,
      playback: playback.data,
      ghosts: sortedGhosts,
      activeGhost,
      ghostIsOptimistic,
      bazaarChapters,
      capabilities,
    }),
    [state, isVisible, isReady, mergedError, playback.data, sortedGhosts, activeGhost, ghostIsOptimistic, bazaarChapters, capabilities]
  );

  return (
    <ActionsContext.Provider value={actions}>
    <SlowContext.Provider value={slow}>
    <TimeContext.Provider value={timeStore}>
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
    </TimeContext.Provider>
    </SlowContext.Provider>
    </ActionsContext.Provider>
  );
}
