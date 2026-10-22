import type { Hero, Matchup } from "./api-contract";

export const HERO_LABELS: Record<Hero, string> = {
  vanessa: "Vanessa",
  pygmalien: "Pygmalien",
  dooley: "Dooley",
  mak: "Mak",
  jules: "Jules",
  stelle: "Stelle",
  karnok: "Karnok",
  the_dragons: "The Dragons",
};
export const RANKS = ["bronze", "silver", "gold", "diamond", "legend"] as const;

export function heroLabel(hero: Hero | null | undefined): string {
  return hero && Object.hasOwn(HERO_LABELS, hero) ? HERO_LABELS[hero] : "-";
}

/** Summaries describe distinct loaded observations, never estimated session totals. */
export function summarizeSession(matches: Matchup[]) {
  const unique = [
    ...new Map(matches.map((match) => [match.id, match])).values(),
  ];
  const ranks = RANKS.map((rank) => ({
    rank,
    count: unique.filter(
      (match) => match.opponent.rank?.trim().toLowerCase() === rank
    ).length,
  }));
  const heroes = (Object.keys(HERO_LABELS) as Hero[])
    .map((hero) => ({
      hero,
      count: unique.filter((match) => match.encounter.ghostHero === hero)
        .length,
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);
  return {
    count: unique.length,
    ranks,
    heroes,
    unknownRanks:
      unique.length - ranks.reduce((sum, entry) => sum + entry.count, 0),
    unknownHeroes:
      unique.length - heroes.reduce((sum, entry) => sum + entry.count, 0),
    // Neither winsRemaining nor lethal states who won a fight. The public API has no outcome field.
    wins: null,
    losses: null,
  };
}

export interface ObservedRun {
  key: string;
  number: number | null;
  hero: Hero | null;
  matches: Matchup[];
}

/** Only explicit processor continuity segments group runs. Days and hero changes are not boundaries. */
export function observedRuns(matches: Matchup[]): ObservedRun[] {
  const runs: ObservedRun[] = [];
  const seen = new Set<number>();
  const numbers = new Map<string, number>();
  let previousSegment: string | null | undefined;
  for (const match of matches) {
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    const proof =
      match.fieldEvidence?.encounter ??
      match.encounter.fieldEvidence?.encounter;
    const segment =
      proof?.runSegmentId && Number.isFinite(proof.recordingId)
        ? `${proof.recordingId}:${proof.runSegmentId}`
        : null;
    if (segment && !numbers.has(segment))
      numbers.set(segment, numbers.size + 1);
    if (!runs.length || segment !== previousSegment) {
      runs.push({
        key: `run:${match.id}`,
        number: segment ? numbers.get(segment)! : null,
        hero: null,
        matches: [],
      });
    }
    runs[runs.length - 1].matches.push(match);
    previousSegment = segment;
  }
  for (const run of runs) {
    const heroes = new Set(
      run.matches
        .map((match) => match.encounter.streamerHero)
        .filter((hero): hero is Hero => heroLabel(hero) !== "-")
    );
    run.hero = heroes.size === 1 ? [...heroes][0] : null;
  }
  return runs;
}
