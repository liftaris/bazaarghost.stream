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
  const runs = observedRuns(unique);
  const scores = runs.map((run) => {
    const latest = run.matches.findLast(
      (match) => match.encounter.winsRemaining != null
    );
    const remaining = latest?.encounter.winsRemaining;
    if (!latest || remaining == null) return { wins: null, losses: null };
    const wins = 10 - remaining;
    const day = latest.encounter.igd;
    return { wins, losses: day != null && day >= wins ? day - wins : null };
  });
  const wins = scores.flatMap((score) =>
    score.wins == null ? [] : [score.wins]
  );
  const losses = scores.flatMap((score) =>
    score.losses == null ? [] : [score.losses]
  );
  return {
    count: unique.length,
    runCount: runs.length,
    ranks,
    heroes,
    unknownRanks:
      unique.length - ranks.reduce((sum, entry) => sum + entry.count, 0),
    unknownHeroes:
      unique.length - heroes.reduce((sum, entry) => sum + entry.count, 0),
    wins: wins.length ? wins.reduce((sum, value) => sum + value, 0) : null,
    losses: losses.length
      ? losses.reduce((sum, value) => sum + value, 0)
      : null,
  };
}

export interface ObservedRun {
  key: string;
  number: number | null;
  hero: Hero | null;
  matches: Matchup[];
}

export function observedRuns(matches: Matchup[]): ObservedRun[] {
  const runs: ObservedRun[] = [];
  const seen = new Set<number>();
  let previousRecording: number | null = null;
  let previousDay: number | null = null;
  for (const match of matches) {
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    const proof =
      match.fieldEvidence?.encounter ??
      match.encounter.fieldEvidence?.encounter;
    const source = match.sources?.find((source) => source.kind === "recording");
    const recording =
      proof?.recordingId ??
      (source?.kind === "recording" ? source.recording.id : null);
    const day = match.encounter.igd;
    if (
      !runs.length ||
      recording !== previousRecording ||
      (day != null &&
        (day === 1 || (previousDay != null && day <= previousDay)))
    ) {
      runs.push({
        key: `run:${match.id}`,
        number: runs.length + 1,
        hero: null,
        matches: [],
      });
      previousDay = null;
    }
    runs[runs.length - 1].matches.push(match);
    previousRecording = recording;
    if (day != null) previousDay = day;
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

export function sessionMatchupTable(matches: Matchup[]) {
  const rows = observedRuns(matches).map((run) => {
    const cells = new Map<number | null, Matchup[]>();
    for (const match of run.matches) {
      const day = match.encounter.igd ?? null;
      const cell = cells.get(day) ?? [];
      cell.push(match);
      cells.set(day, cell);
    }
    return { ...run, cells };
  });
  const knownDays = rows.flatMap((run) =>
    [...run.cells.keys()].filter((day) => day !== null)
  );
  const firstDay = knownDays.includes(0) ? 0 : 1;
  const lastDay = Math.max(0, ...knownDays);
  const days: (number | null)[] = Array.from(
    { length: lastDay - firstDay + 1 },
    (_, i) => firstDay + i
  );
  if (rows.some((run) => run.cells.has(null))) days.push(null);
  return { days, rows };
}
