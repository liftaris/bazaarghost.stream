import assert from "node:assert/strict";
import test from "node:test";
import {
  sourceModules,
  hooks,
  jsxRuntime,
  elements,
} from "./helpers/source-harness.mjs";

const { observedRuns, summarizeSession, heroLabel, sessionMatchupTable } =
  sourceModules()("@/lib/session-summary");
const match = (
  id,
  {
    day = null,
    hero = null,
    opponentHero = null,
    rank = null,
    segment = null,
    recording = 1,
    winsRemaining = null,
    lethal = null,
  } = {}
) => ({
  id,
  opponent: { rank },
  encounter: {
    igd: day,
    streamerHero: hero,
    ghostHero: opponentHero,
    winsRemaining,
    lethal,
    fieldEvidence: {},
  },
  fieldEvidence: segment
    ? { encounter: { recordingId: recording, runSegmentId: segment } }
    : {},
  sources: [
    {
      kind: "recording",
      recording: { id: recording },
      at: id * 100,
      available: true,
    },
  ],
});

test("runs follow increasing days in one VOD and restart at day one", () => {
  const missing = observedRuns([
    match(1, { day: 12, hero: "vanessa" }),
    match(2, { day: 1, hero: "dooley" }),
  ]);
  assert.equal(missing.length, 2);
  assert.equal(missing[0].number, 1);
  assert.equal(missing[0].hero, "vanessa");
  const known = observedRuns([
    match(1, { day: 1, segment: "a", hero: "vanessa" }),
    match(2, { day: 3, segment: "b", hero: "vanessa" }),
    match(3, { day: 4, recording: 2, hero: "dooley" }),
    match(4, { recording: 2 }),
    match(5, { day: 1, recording: 2 }),
  ]);
  assert.deepEqual(
    known.map((run) => run.number),
    [1, 2, 3]
  );
  assert.deepEqual(
    known.map((run) => run.hero),
    ["vanessa", "dooley", null]
  );
  assert.deepEqual(
    known.map((run) => run.matches.map((match) => match.id)),
    [[1, 2], [3, 4], [5]]
  );
});

test("pagination appends retain run keys and numbering; duplicate matchups never add observations", () => {
  const first = [match(1, { day: 1 }), match(2, { day: 2 })];
  const before = observedRuns(first);
  const after = observedRuns([
    ...first,
    first[1],
    match(3, { day: 3 }),
    match(4, { day: 1 }),
  ]);
  assert.equal(after[0].key, before[0].key);
  assert.deepEqual(
    after.map((run) => run.number),
    [1, 2]
  );
  assert.deepEqual(
    after[0].matches.map((match) => match.id),
    [1, 2, 3]
  );
});

test("charts count supported observed ranks and opposing heroes, preserving missing values", () => {
  const first = match(1, {
    rank: " SILVER ",
    hero: "vanessa",
    opponentHero: "dooley",
  });
  const summary = summarizeSession([
    first,
    first,
    match(2, { rank: "future-rank", opponentHero: "future-hero" }),
    match(3),
  ]);
  assert.equal(summary.count, 3);
  assert.deepEqual(
    summary.ranks.map((entry) => entry.count),
    [0, 1, 0, 0, 0]
  );
  assert.deepEqual(summary.heroes, [{ hero: "dooley", count: 1 }]);
  assert.equal(summary.unknownRanks, 2);
  assert.equal(summary.unknownHeroes, 2);
  assert.equal(heroLabel(null), "-");
  assert.equal(heroLabel("future-hero"), "-");
  assert.equal(heroLabel("the_dragons"), "The Dragons");
});

test("session scores sum latest cumulative wins per run and derive losses from day", () => {
  const summary = summarizeSession([
    match(1, { day: 3, winsRemaining: 8 }),
    match(2, { day: 5, winsRemaining: 6 }),
    match(3, { day: 1, winsRemaining: 10 }),
    match(4, { day: 4, winsRemaining: 7 }),
  ]);
  assert.equal(summary.wins, 7);
  assert.equal(summary.losses, 2);
  assert.equal(summary.runCount, 2);
  assert.equal(summarizeSession([]).runCount, 0);
  assert.equal(
    summarizeSession([match(1, { day: 10, winsRemaining: 0 })]).wins,
    10
  );
  assert.equal(
    summarizeSession([match(1, { day: 10, winsRemaining: 0 })]).losses,
    0
  );
  assert.equal(summarizeSession([match(1)]).wins, null);
  assert.equal(
    summarizeSession([match(1, { day: 1, winsRemaining: 0 })]).losses,
    null
  );
  assert.equal(summarizeSession([]).count, 0);
  assert.equal(summarizeSession([]).heroes.length, 0);
});

test("run/day table aligns sparse days, deduplicates encounters and retains every unknown day", () => {
  const first = match(1, { day: 2 });
  const table = sessionMatchupTable([
    first,
    first,
    match(1, { day: 99 }),
    match(2, { day: 4 }),
    match(3),
    match(4),
    match(5, { day: 1 }),
  ]);
  assert.deepEqual(table.days, [1, 2, 3, 4, null]);
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[0].cells.has(1), false);
  assert.equal(table.rows[0].cells.has(3), false);
  assert.deepEqual(
    table.rows[0].cells.get(2).map((m) => m.id),
    [1]
  );
  assert.deepEqual(
    table.rows[0].cells.get(null).map((m) => m.id),
    [3, 4]
  );
  assert.deepEqual(
    table.rows[1].cells.get(1).map((m) => m.id),
    [5]
  );
  assert.deepEqual(sessionMatchupTable([match(1, { day: 0 })]).days, [0]);
  assert.deepEqual(sessionMatchupTable([match(1)]).days, [null]);
  assert.deepEqual(sessionMatchupTable([]), { days: [], rows: [] });
});

test("square matchup tiles select a fight using its timestamp without any run end", () => {
  const selected = [];
  const load = sourceModules({
    "react/jsx-runtime": jsxRuntime,
    "next/image": { default: "Image" },
    "@/components/hero-icon": { HeroIcon: "HeroIcon" },
    "lucide-react": { Ghost: "Ghost", Play: "Play", Radio: "Radio" },
    "@/components/ui/button": { Button: "Button" },
  });
  const { MatchupTile } = load("@/components/companion/matchup-tile");
  const value = {
    ...match(12, { day: 7, rank: "gold", opponentHero: "dooley" }),
    opponent: { username: "Opponent", nameState: "complete", rank: "gold" },
    sources: [
      {
        kind: "recording",
        platform: "twitch",
        available: true,
        recording: { id: 71 },
        at: 0,
      },
    ],
  };
  let tile = MatchupTile({
    match: value,
    selected: true,
    active: true,
    recordingId: 71,
    session: null,
    onSelect: (match) => selected.push(match.id),
  });
  assert.equal(tile.props.variant, "matchup");
  assert.match(tile.props.className, /h-20 w-full/);
  assert.ok(
    elements(tile).some(
      (node) => node.type === "HeroIcon" && node.props.hero === "dooley"
    )
  );
  assert.equal(tile.props["aria-current"], "time");
  assert.equal(tile.props["aria-pressed"], true);
  assert.equal(tile.props["aria-controls"], undefined);
  assert.equal(tile.props["aria-expanded"], undefined);
  assert.ok(!elements(tile).some((node) => node.type === "Radio"));
  assert.match(
    tile.props["aria-label"],
    /day 7, Dooley, gold, 0:00, at playhead/
  );
  assert.equal(tile.props.disabled, false);
  tile.props.onClick();
  assert.deepEqual(selected, [12]);
  const playing = MatchupTile({
    match: value,
    selected: false,
    active: true,
    recordingId: 71,
    session: null,
    onSelect() {},
  });
  assert.equal(playing.props["aria-current"], "time");
  assert.equal(playing.props["aria-pressed"], false);
  const pinned = MatchupTile({
    match: value,
    selected: true,
    active: false,
    recordingId: 71,
    session: null,
    onSelect() {},
  });
  assert.equal(pinned.props["aria-current"], undefined);
  assert.equal(pinned.props["aria-pressed"], true);
  tile = MatchupTile({
    match: {
      ...value,
      encounter: { ...value.encounter, igd: null },
      sources: [],
    },
    selected: false,
    active: false,
    recordingId: null,
    session: null,
    onSelect() {},
  });
  assert.equal(tile.props.disabled, true);
  assert.match(tile.props["aria-label"], /day unknown.*time unknown/);
  assert.ok(
    elements(tile).some(
      (node) => node.type === "HeroIcon" && node.props.hero === "dooley"
    )
  );
});

test("table pagination preserves day alignment and independent selected/playing encounters", () => {
  const h = hooks();
  const load = sourceModules({
    react: h.react,
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": {},
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "@/components/hero-icon": { HeroIcon: "HeroIcon" },
    "./matchup-tile": { MatchupTile: "MatchupTile" },
    "@tanstack/react-virtual": {
      useVirtualizer: ({ count }) => ({
        getTotalSize: () => count * 64,
        getVirtualItems: () =>
          Array.from({ length: count }, (_, index) => ({
            index,
            start: index * 64,
          })),
        measureElement() {},
        scrollToIndex() {},
      }),
    },
  });
  const { MatchupList } = load("@/components/companion/matchup-list");
  const entry = (id, segment) =>
    match(id, {
      recording: segment === "a" ? 1 : segment === "b" ? 2 : 3,
      day: id,
    });
  let matches = [entry(1, "a"), entry(2, "b")];
  const render = () =>
    elements(
      h.render(() =>
        MatchupList({
          matches,
          selectedId: 1,
          activeId: 2,
          recordingId: null,
          session: null,
          onSelect() {},
        })
      )
    );
  let nodes = render();
  assert.deepEqual(
    nodes
      .filter((n) => n.props.role === "columnheader")
      .map((n) => n.props.children),
    ["Run", "Day 1", "Day 2"]
  );
  const initial = nodes.filter((n) => n.type === "MatchupTile");
  assert.deepEqual(
    initial.map((n) => [n.props.selected, n.props.active]),
    [
      [true, false],
      [false, true],
    ]
  );
  matches = [...matches, entry(3, "b")];
  nodes = render();
  assert.deepEqual(
    nodes
      .filter((n) => n.props.role === "columnheader")
      .map((n) => n.props.children),
    ["Run", "Day 1", "Day 2", "Day 3"]
  );
  assert.deepEqual(
    nodes
      .filter((node) => node.type === "MatchupTile")
      .map((node) => node.props.match.id),
    [1, 2, 3],
    "table retains the canonical matchup order within runs"
  );
  const secondRun = nodes.find((node) => node.props?.["data-run"] === "run:2");
  assert.deepEqual(
    elements(secondRun)
      .filter((node) => node.type === "MatchupTile")
      .map((node) => node.props.match.id),
    [2, 3]
  );
  assert.ok(!nodes.some((n) => n.props["data-matchup-detail"]));
});
