"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { listFavoritePage, setFavorite } from "@/lib/social-client";
import type { MatchupResult, Page } from "@/lib/api-contract";

const REST_DELAY_MS = 2000;

/** Plain external store so a toggle re-renders only the buttons whose ID changed. */
class BookmarkStore {
  private set = new Set<number>();
  private all = new Set<() => void>();
  private byId = new Map<number, Set<() => void>>();
  private sorted: number[] | null = null;
  private cursor: string | null | undefined = undefined;
  private pending = new Set<number>();
  private rest: Promise<void> | null = null;
  private flight: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private controller: AbortController | undefined;
  private version = 0;
  private generation = 0;
  private csrf: string | null = null;
  setCsrf(token: string | null) {
    this.csrf = token;
  }
  /** True once every saved ID is known, so `has() === false` is trustworthy. */
  ready = false;
  error = false;
  /** The first page of full cards, kept so the Saved list needs no second request. */
  firstPage: Page<MatchupResult> | null = null;

  subscribeAll = (fn: () => void) => {
    this.all.add(fn);
    return () => void this.all.delete(fn);
  };
  subscribeId(id: number, fn: () => void) {
    let fns = this.byId.get(id);
    if (!fns) this.byId.set(id, (fns = new Set()));
    fns.add(fn);
    return () => {
      fns.delete(fn);
      if (!fns.size) this.byId.delete(id);
    };
  }
  getVersion = () => this.version;
  has = (id: number) => this.set.has(id);
  get ids() {
    if (!this.ready) return null;
    return (this.sorted ??= [...this.set].sort((a, b) => b - a));
  }

  private emit(ids?: number[]) {
    this.version++;
    this.sorted = null;
    for (const id of ids ?? this.byId.keys()) this.byId.get(id)?.forEach((fn) => fn());
    this.all.forEach((fn) => fn());
  }

  /** Starts over for a new identity; `signedIn` false means an empty, ready set. */
  reset(signedIn: boolean, known: boolean) {
    this.generation++;
    this.controller?.abort();
    clearTimeout(this.timer);
    this.set = new Set();
    this.cursor = undefined;
    this.rest = null;
    this.flight = null;
    this.error = false;
    this.firstPage = null;
    this.ready = known && !signedIn;
    this.emit();
    if (signedIn) void this.run(true);
  }

  private run(first: boolean) {
    const generation = this.generation;
    const flight = (this.flight ??= this.page(first).finally(() => {
      if (generation === this.generation) this.flight = null;
    }));
    return flight;
  }

  private async page(first: boolean) {
    const generation = this.generation;
    const controller = (this.controller = new AbortController());
    try {
      while (this.cursor !== null) {
        const page = await listFavoritePage(this.cursor, controller.signal);
        if (generation !== this.generation) return;
        if (this.cursor === undefined) this.firstPage = page;
        const added: number[] = [];
        for (const { id } of page.items) {
          if (!this.set.has(id)) {
            this.set.add(id);
            added.push(id);
          }
        }
        this.cursor = page.nextCursor;
        if (this.cursor === null) this.ready = true;
        this.error = false;
        this.emit(added);
        if (first && this.cursor !== null) {
          this.timer = setTimeout(() => void this.loadRest(), REST_DELAY_MS);
          return;
        }
      }
    } catch {
      if (generation !== this.generation || controller.signal.aborted) return;
      this.error = true;
      this.emit([]);
    }
  }

  /** Loads the remaining pages (idempotent; retries after an error). */
  loadRest() {
    if (this.ready) return Promise.resolve();
    clearTimeout(this.timer);
    if (!this.rest) {
      const generation = this.generation;
      this.rest = (async () => {
        await this.flight;
        if (!this.ready && generation === this.generation) await this.run(false);
      })().finally(() => {
        if (generation === this.generation) this.rest = null;
      });
    }
    return this.rest;
  }

  toggle = async (id: number) => {
    const csrf = this.csrf;
    if (!csrf || this.pending.has(id)) return;
    if (!this.ready) await this.loadRest();
    if (!this.ready || this.csrf !== csrf) return;
    const next = !this.set.has(id);
    const apply = (on: boolean) => {
      if (on) this.set.add(id);
      else this.set.delete(id);
      this.emit([id]);
    };
    this.pending.add(id);
    apply(next);
    try {
      await setFavorite(id, next, csrf);
    } catch (error) {
      apply(!next);
      toast.error(error instanceof Error ? error.message : "Couldn't save");
    } finally {
      this.pending.delete(id);
    }
  };
}

interface BookmarksContextValue {
  store: BookmarkStore;
  /** Whether bookmarking is offered at all (auth enabled). */
  enabled: boolean;
  signedIn: boolean;
}

interface BookmarksValue {
  enabled: boolean;
  signedIn: boolean;
  /** All saved IDs are loaded; before that `has()` may return false for saved IDs. */
  ready: boolean;
  /** The list failed to load. */
  error: boolean;
  /** Saved matchup IDs, newest ID first. Null until fully loaded. */
  ids: number[] | null;
  has: (id: number) => boolean;
  toggle: (id: number) => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const [store] = useState(() => new BookmarkStore());
  const userId = state.status === "authenticated" ? state.identity.userId : null;
  const known = state.status !== "loading";
  const csrf = state.status === "authenticated" ? state.identity.csrfToken : null;

  // Layout effect so the token is set before any child effect issues a request
  useLayoutEffect(() => {
    store.setCsrf(csrf);
  }, [store, csrf]);

  useEffect(() => {
    store.reset(userId !== null, known);
  }, [store, userId, known]);

  const value = useMemo<BookmarksContextValue>(
    () => ({ store, enabled: state.status !== "disabled", signedIn: userId !== null }),
    [store, state.status, userId],
  );
  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

function useContextValue() {
  const value = useContext(BookmarksContext);
  if (!value) throw new Error("useBookmarks must be used inside <BookmarksProvider>");
  return value;
}

/** Re-renders only when this one matchup's saved state changes. */
export function useIsBookmarked(id: number) {
  const { store } = useContextValue();
  return useSyncExternalStore(
    (fn) => store.subscribeId(id, fn),
    () => store.has(id),
    () => false,
  );
}

/** Stable pieces for a save button (never re-renders on bookmark changes). */
export function useBookmarkActions() {
  const { store, enabled, signedIn } = useContextValue();
  return { enabled, signedIn, toggle: store.toggle };
}

/** The first page of saved cards the store already fetched, and a way to reload it after a failure. */
export function useFavoritesFirstPage() {
  const { store, signedIn } = useContextValue();
  useSyncExternalStore(store.subscribeAll, store.getVersion, store.getVersion);
  return { page: store.firstPage, error: store.error, reload: () => store.reset(signedIn, true) };
}

/** Whole-collection view; re-renders on any bookmark change and loads the full list. */
export function useBookmarks(): BookmarksValue {
  const { store, enabled, signedIn } = useContextValue();
  useSyncExternalStore(store.subscribeAll, store.getVersion, store.getVersion);
  useEffect(() => {
    if (signedIn) void store.loadRest();
  }, [store, signedIn]);
  return {
    enabled,
    signedIn,
    ready: store.ready,
    error: store.error,
    ids: store.ids,
    has: store.has,
    toggle: store.toggle,
  };
}
