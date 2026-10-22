import assert from "node:assert/strict";
import test from "node:test";
import {
  sourceModules,
  hooks,
  jsxRuntime,
  elements,
} from "./helpers/source-harness.mjs";

const { observedRuns, summarizeSession, heroLabel } = sourceModules()(
  "@/lib/session-summary"
);
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
});

test("run rows use explicit recording-scoped segments, not day resets or hero changes", () => {
  const missing = observedRuns([
    match(1, { day: 12, hero: "vanessa" }),
    match(2, { day: 1, hero: "dooley" }),
  ]);
  assert.equal(missing.length, 1);
  assert.equal(missing[0].number, null);
  assert.equal(
    missing[0].hero,
    null,
    "conflicting heroes must not be silently picked"
  );
  const known = observedRuns([
    match(1, { segment: "a", hero: "vanessa" }),
    match(2, { segment: "a", hero: "vanessa" }),
    match(3, { segment: "a", recording: 2, hero: "dooley" }),
    match(4),
    match(5, { segment: "a", recording: 2 }),
  ]);
  assert.deepEqual(
    known.map((run) => run.number),
    [1, 2, null, 2]
  );
  assert.deepEqual(
    known.map((run) => run.hero),
    ["vanessa", "dooley", null, null]
  );
  assert.deepEqual(
    known.map((run) => run.matches.map((match) => match.id)),
    [[1, 2], [3], [4], [5]]
  );
});

test("pagination appends retain run keys and numbering; duplicate matchups never add observations", () => {
  const first = [match(1, { segment: "a" }), match(2, { segment: "a" })];
  const before = observedRuns(first);
  const after = observedRuns([
    ...first,
    first[1],
    match(3, { segment: "a" }),
    match(4, { segment: "b" }),
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

test("outcomes remain unavailable even with zero wins remaining or lethal observations", () => {
  const summary = summarizeSession([
    match(1, { winsRemaining: 0, lethal: true }),
    match(2, { winsRemaining: 2, lethal: false }),
  ]);
  assert.equal(summary.wins, null);
  assert.equal(summary.losses, null);
  assert.equal(summarizeSession([]).count, 0);
  assert.equal(summarizeSession([]).heroes.length, 0);
});

test("selected player metadata uses dashes but preserves observed zero and false", () => {
  const h = hooks();
  const load = sourceModules({
    react: h.react,
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { useRouter: () => ({}) },
    "next/image": { default: "Image" },
    "lucide-react": {},
    "@/components/ui/button": { Button: "Button" },
    "@/components/social/bookmark-button": { BookmarkButton: "BookmarkButton" },
  });
  const { MatchupDetail } = load("@/components/companion/matchup-detail");
  const value = match(1, { day: 0, winsRemaining: 0, lethal: false });
  value.opponent = { ...value.opponent, username: null, nameState: "masked" };
  const nodes = elements(h.render(() => MatchupDetail({ match: value })));
  assert.deepEqual(
    nodes
      .filter((node) => node.type === "dd")
      .map((node) => node.props.children),
    ["-", "-", 0, "-", 0, "No"]
  );
  assert.equal(
    nodes.find(
      (node) => node.type === "Button" && node.props.variant === "outline"
    ).props.disabled,
    true
  );
});

test("run collapse survives appended pages but a new selection reveals its run", () => {
  const h = hooks();
  const load = sourceModules({
    react: h.react,
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": {},
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "./matchup-detail": { MatchupDetail: "MatchupDetail" },
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
  const entry = (id, segment) => ({ ...match(id, { segment }), sources: [] });
  let matches = [entry(1, "a"), entry(2, "b")];
  let selectedId = 1;
  const render = () => {
    let tree = h.render(() =>
      MatchupList({
        matches,
        selectedId,
        activeId: null,
        recordingId: null,
        session: null,
        onSelect() {},
      })
    );
    h.flushEffects();
    tree = h.render(() =>
      MatchupList({
        matches,
        selectedId,
        activeId: null,
        recordingId: null,
        session: null,
        onSelect() {},
      })
    );
    return elements(tree).filter(
      (node) => node.type === "button" && !node.props["aria-label"]
    );
  };
  let rows = render();
  assert.equal(rows[0].props["aria-expanded"], true);
  rows[0].props.onClick();
  assert.equal(render()[0].props["aria-expanded"], false);
  matches = [...matches, entry(3, "b")];
  assert.equal(
    render()[0].props["aria-expanded"],
    false,
    "pagination must not override a deliberate collapse"
  );
  selectedId = 2;
  assert.equal(render()[1].props["aria-expanded"], true);
  selectedId = 1;
  assert.equal(
    render()[0].props["aria-expanded"],
    true,
    "a new explicit selection reveals its run"
  );
  selectedId = 4;
  render();
  matches = [...matches, entry(4, "c")];
  assert.equal(
    render()[2].props["aria-expanded"],
    true,
    "a selection opens when its metadata arrives later"
  );
});
