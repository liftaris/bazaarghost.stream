import { BUILTIN_PLATFORMS, genericPlatform } from "./definitions";
import { IframePlayer } from "./players/base";
import type { PlayerAdapter } from "./players/types";
import type { PlatformDefinition, PlatformDefinitionInput, PlatformRefKind } from "./types";

const registry = new Map<string, PlatformDefinition>(BUILTIN_PLATFORMS.map((p) => [p.id, p]));
const fallbacks = new Map<string, PlatformDefinition>();
const listeners = new Set<() => void>();

/** Look up a platform; unknown ids get a stable generic definition (never null, never throws). */
export function getPlatform(id: string | null | undefined): PlatformDefinition {
  const key = (id ?? "").toLowerCase();
  const known = registry.get(key);
  if (known) return known;
  let fallback = fallbacks.get(key);
  if (!fallback) fallbacks.set(key, (fallback = genericPlatform(key)));
  return fallback;
}

export function isKnownPlatform(id: string): boolean {
  return registry.has(id.toLowerCase());
}

export function listPlatforms(): PlatformDefinition[] {
  return [...registry.values()];
}

/**
 * Add or extend platforms (e.g. from backend-provided definitions). Fields
 * given override the existing definition; capabilities merge per key.
 */
export function registerPlatforms(inputs: PlatformDefinitionInput[]) {
  for (const input of inputs) {
    const id = input.id.toLowerCase();
    const base = registry.get(id) ?? genericPlatform(id);
    const { capabilities, ...rest } = input;
    registry.set(id, { ...base, ...rest, id, capabilities: { ...base.capabilities, ...capabilities } });
    fallbacks.delete(id);
  }
  listeners.forEach((fn) => fn());
}

export function subscribePlatforms(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Find which platform a pasted URL belongs to. */
export function parsePlatformUrl(url: string): { platform: string; kind: PlatformRefKind; id: string } | null {
  for (const p of registry.values()) {
    const ref = p.parseUrl(url);
    if (ref) return { platform: p.id, ...ref };
  }
  return null;
}

export function createPlayerAdapter(platform: string | null | undefined): PlayerAdapter {
  const def = getPlatform(platform);
  return def.createPlayer?.(def.capabilities) ?? new IframePlayer(def.id, def.capabilities);
}
