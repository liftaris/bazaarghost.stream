import type { MatchupResult } from "@/lib/api-contract";
import { opponentLabel } from "@/lib/opponent-name";

function rank(seed: number, id: number) {
  let value = (id ^ Math.imul(seed, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return (value ^ (value >>> 15)) >>> 0;
}

/** Rotate recent fights hourly, spreading the sample across streamers and heroes. */
export function sampleGhosts(pool: MatchupResult[], hour: number, limit = 36) {
  const ordered = [...pool].sort(
    (a, b) => rank(hour, a.id) - rank(hour, b.id) || a.id - b.id
  );
  const groups = new Map<string, MatchupResult[]>();
  for (const matchup of ordered) {
    const key = `${matchup.streamer?.id ?? "unknown"}:${matchup.encounter.ghostHero ?? "unknown"}`;
    const group = groups.get(key) ?? [];
    group.push(matchup);
    groups.set(key, group);
  }

  const selected: MatchupResult[] = [];
  const names = new Set<string>();
  let remaining = true;
  while (selected.length < limit && remaining) {
    remaining = false;
    for (const group of groups.values()) {
      let candidate = group.shift();
      while (
        candidate &&
        names.has(opponentLabel(candidate.opponent).toLowerCase())
      ) {
        candidate = group.shift();
      }
      if (!candidate) continue;
      remaining = true;
      names.add(opponentLabel(candidate.opponent).toLowerCase());
      selected.push(candidate);
      if (selected.length === limit) break;
    }
  }
  return selected;
}
