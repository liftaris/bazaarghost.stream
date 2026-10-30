import type { Hero, Stats } from "@/lib/api-contract";

/** Public display data for a linked row, without API evidence or source payloads. */
export interface LandingEntry {
  href: string;
  title: string;
  detail: string;
  visual:
    | { kind: "avatar"; url: string | null }
    | { kind: "recording" }
    | { kind: "hero"; hero: Hero | null };
}

/** One shared, hourly archive snapshot; no request-specific identity is included. */
export interface LandingSnapshot {
  generatedAt: string;
  recordingsFrom: string;
  stats: Stats;
  streamers: LandingEntry[];
  recordings: LandingEntry[];
  ghosts: LandingEntry[];
}
