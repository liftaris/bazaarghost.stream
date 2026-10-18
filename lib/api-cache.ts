import { apiGet } from "./api-client";
import type { PublicRoutes } from "./api-contract";

type Params = Record<string, string | number | boolean | null | undefined>;
interface Entry { data?: unknown; at: number; flight?: Promise<unknown> }
export interface CacheOptions { signal?: AbortSignal; ttl?: number; swr?: number }

/** Fresh for `ttl`; then served stale (and refreshed in the background) for `swr` more. */
const TTL = 30_000, SWR = 5 * 60_000, MAX = 300;
const store = new Map<string, Entry>();

const keyOf = (path: string, params: Params = {}) =>
  `${path}?${Object.entries(params).filter(([, v]) => v != null && v !== "").sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("&")}`;

function withSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

function load<P extends keyof PublicRoutes>(key: string, entry: Entry, path: P, params: Params) {
  // The shared request carries no signal: one caller aborting must not cancel it for the others.
  const flight = apiGet(path, params).then(
    (data) => { entry.data = data; entry.at = Date.now(); entry.flight = undefined; return data; },
    (error) => { entry.flight = undefined; if (entry.data === undefined) store.delete(key); throw error; },
  );
  entry.flight = flight;
  return flight;
}

/** Cached, deduplicated GET. Callers' abort signals only detach that caller. */
export function cachedGet<P extends keyof PublicRoutes>(path: P, params: Params = {}, { signal, ttl = TTL, swr = SWR }: CacheOptions = {}): Promise<PublicRoutes[P]> {
  const key = keyOf(path, params);
  let entry = store.get(key);
  if (!entry) {
    if (store.size >= MAX) store.delete(store.keys().next().value!);
    entry = { at: 0 }; store.set(key, entry);
  }
  const age = Date.now() - entry.at;
  if (entry.data !== undefined && age < ttl + swr) {
    if (age >= ttl && !entry.flight) load(key, entry, path, params).catch(() => {});
    return withSignal(Promise.resolve(entry.data as PublicRoutes[P]), signal);
  }
  return withSignal((entry.flight ?? load(key, entry, path, params)) as Promise<PublicRoutes[P]>, signal);
}

/** Cached value (fresh or stale) without any request. */
export function peek<P extends keyof PublicRoutes>(path: P, params: Params = {}): PublicRoutes[P] | undefined {
  return store.get(keyOf(path, params))?.data as PublicRoutes[P] | undefined;
}

/** Warm the cache (e.g. on hover); errors are swallowed. */
export function prefetch<P extends keyof PublicRoutes>(path: P, params: Params = {}) {
  void cachedGet(path, params).catch(() => {});
}

/** Drop entries whose path starts with `prefix` (everything when omitted). */
export function invalidate(prefix = "") {
  for (const key of [...store.keys()]) if (key.startsWith(prefix)) store.delete(key);
}
