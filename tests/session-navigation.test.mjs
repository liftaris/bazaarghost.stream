import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Execute the actual pure TypeScript modules without a new test runner or generated fixtures.
async function moduleAt(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}
const {
  mapSessionTime,
  matchupTime,
  observedDayEntries,
  adjacentIndex,
  splitRatio,
  constrainSplit,
} = await moduleAt("../lib/session-navigation.ts");
const { listMode, resourceHref } = await moduleAt("../lib/workspace-url.ts");
const { canSearchOpponent, opponentLabel } = await moduleAt(
  "../lib/opponent-name.ts"
);
const recording = (id, segments) => ({ recording: { id }, segments });
const segment = (recStart, recEnd, offsetSeconds) => ({
  recStart,
  recEnd,
  offsetSeconds,
});
const session = {
  recordings: [
    recording(1, [segment(0, 100, 10), segment(200, 300, -50)]),
    recording(2, [segment(0, 400, 0)]),
    recording(3, [segment(0, 50, 0)]),
  ],
};
const match = (id, day, sources = []) => ({
  id,
  opponent: { username: null, nameState: "masked" },
  encounter: { igd: day },
  sources,
});
const source = (id, at, available = true) => ({
  kind: "recording",
  recording: { id },
  at,
  available,
});

test("piecewise mapping uses offsets and exclusive end boundaries, never guessed zero", () => {
  assert.equal(mapSessionTime(session, 1, 2, 10), 20);
  assert.equal(mapSessionTime(session, 1, 2, 100), null);
  assert.equal(mapSessionTime(session, 1, 2, 200), 150);
  assert.equal(mapSessionTime(session, 2, 1, 150), 200);
  assert.equal(mapSessionTime(session, 2, 3, 50), null);
  assert.equal(mapSessionTime(session, 99, 2, 0), null);
});
test("own source anchor wins; every aligned alternate is attempted", () => {
  assert.equal(
    matchupTime(match(1, 1, [source(1, 42), source(2, 90)]), 2, session),
    90
  );
  assert.equal(
    matchupTime(match(1, 1, [source(99, 20), source(1, 42)]), 2, session),
    52
  );
  assert.equal(
    matchupTime(match(1, 1, [source(1, 42, false)]), 2, session),
    null
  );
});
test("unknown days remain unknown between known observations; no interpolation or authoritative runs", () => {
  const entries = observedDayEntries([
    match(1, 7),
    match(2, null),
    match(3, 9),
  ]);
  assert.deepEqual(
    entries.filter((e) => e.kind === "day").map((e) => e.day),
    [7, null, 9]
  );
  assert.deepEqual(
    entries.filter((e) => e.kind === "matchup").map((e) => e.matchup.id),
    [1, 2, 3]
  );
  assert.deepEqual(
    observedDayEntries([match(1, 11), match(2, 12), match(3, null)])
      .filter((e) => e.kind === "day")
      .map((e) => e.day),
    [11, 12, null]
  );
});
test("reset/repeated days are local headers, while names never define identity", () => {
  const entries = observedDayEntries([
    match(1, 1),
    match(2, 2),
    match(3, 1),
    match(4, 1),
    match(4, 1),
  ]);
  assert.deepEqual(
    entries.filter((e) => e.kind === "day").map((e) => e.day),
    [1, 2, 1]
  );
  assert.equal(entries.filter((e) => e.kind === "matchup").length, 4);
  assert.deepEqual(
    observedDayEntries([match(1, null), match(2, null)]).map((e) => e.kind),
    ["day", "matchup", "matchup"]
  );
});
test("pagination append preserves ordered IDs and one adjacent day header", () => {
  const first = [match(1, 7), match(2, 7)];
  const all = observedDayEntries([...first, match(3, 7), match(4, 8)]);
  assert.deepEqual(
    all.filter((e) => e.kind === "day").map((e) => e.key),
    ["day:1", "day:4"]
  );
});
test("previous/next step from pinned fight even when active playhead differs", () => {
  assert.equal(adjacentIndex([1, 2, 3], 1, "next"), 1);
  assert.equal(adjacentIndex([1, 2, 3], 1, "prev"), -1);
  assert.equal(adjacentIndex([1, 2, 3], 3, "next"), -1);
  assert.equal(adjacentIndex([1, 2, 3], null, "next"), 0);
});
test("independent left mode is validated, including Saved and legacy direct URLs", () => {
  assert.equal(listMode("/recordings/abc", "ghosts"), "ghosts");
  assert.equal(listMode("/matchups/12", "saved"), "saved");
  assert.equal(listMode("/recordings/abc", "unknown"), "recordings");
  const link = new URL(
    resourceHref(
      "/matchups/42?source=r2",
      "/recordings/abc",
      "q=kept&platform=twitch&from=2026-01-01&recording=abc&source=r1"
    ),
    "https://example.test"
  );
  assert.equal(link.searchParams.get("list"), "recordings");
  assert.equal(link.searchParams.get("q"), "kept");
  assert.equal(link.searchParams.get("source"), "r2");
  assert.equal(link.searchParams.has("recording"), false);
  assert.equal(link.searchParams.get("from"), "2026-01-01");
});
test("masked/unknown labels are display-only and fragment text cannot launch identity search", () => {
  assert.equal(
    opponentLabel({ username: null, nameState: "masked" }),
    "Hidden opponent"
  );
  assert.equal(
    opponentLabel({ username: null, nameState: "unreadable" }),
    "Unknown opponent"
  );
  for (const nameState of ["partial", "obstructed", "masked", "unreadable"])
    assert.equal(canSearchOpponent({ username: "fragment", nameState }), false);
  assert.equal(
    canSearchOpponent({ username: "Yu-Ji-Oh", nameState: "complete" }),
    true
  );
});
test("stored ratios reject corruption, and keyboard/pointer share constrained bounds", () => {
  for (const value of [null, NaN, Infinity, -1, 2, "0.5"])
    assert.equal(splitRatio(value, 0.28), 0.28);
  assert.equal(splitRatio(0, 0.28), 0);
  assert.equal(constrainSplit(0, 1000, 220, 360), 0);
  assert.equal(constrainSplit(1, 1000, 220, 360), 1);
  assert.equal(constrainSplit(0.01, 1000, 220, 360), 0.22);
  assert.equal(constrainSplit(0.99, 1000, 220, 360), 0.64);
  assert.equal(constrainSplit(0.5, 300, 220, 360), 220 / 580);
});
