import assert from "node:assert/strict";
import test from "node:test";
import {
  MemoryCacheHandler,
  setDataCacheHandler,
  unstable_cache,
} from "../node_modules/vinext/dist/shims/cache.js";
import { sourceModules } from "./helpers/source-harness.mjs";

const streamer = (id) => ({
  id,
  displayName: `Streamer ${id}`,
  avatarUrl: null,
  sessionCount: 2,
  matchupCount: 8,
});
const session = (id) => ({
  id: String(id).padStart(32, "0"),
  title: `Recording ${id}`,
  streamer: streamer(id),
  channel: { displayName: "Channel" },
  matchupCount: 3,
  defaultRecording: { id },
});
const ghost = (id, streamerId = id % 4, hero = "dooley") => ({
  id,
  streamer: streamer(streamerId),
  opponent: { username: `Ghost ${id}`, igd: 2 },
  encounter: { ghostHero: hero, igd: 2 },
  sources: [],
});

function loader(fetch) {
  setDataCacheHandler(new MemoryCacheHandler());
  return sourceModules({
    "next/cache": { unstable_cache },
    "@/lib/backend-server": { backendFetch: fetch },
    "@/lib/platforms": {},
  })("@/lib/landing/snapshot").getLandingSnapshot;
}

test("snapshot exhausts streamers/recordings with fixed 24h bounds and sends no identity", async (t) => {
  const now = Date.parse("2026-10-30T14:00:00Z");
  t.mock.method(Date, "now", () => now);
  const requests = [];
  const getSnapshot = loader(async (request) => {
    assert.equal(request.headers.has("cookie"), false);
    assert.equal(request.headers.has("authorization"), false);
    const url = new URL(request.url);
    requests.push(url);
    const next = url.searchParams.get("cursor") === "next";
    if (url.pathname.endsWith("/stats"))
      return Response.json({ streamers: 101, recordings: 101, matchups: 500 });
    if (url.pathname.endsWith("/streamers"))
      return Response.json({
        items: next
          ? [streamer(101)]
          : Array.from({ length: 100 }, (_, i) => streamer(i + 1)),
        nextCursor: next ? null : "next",
      });
    if (url.pathname.endsWith("/sessions"))
      return Response.json({
        items: [session(next ? 2 : 1)],
        nextCursor: next ? null : "next",
      });
    const offset = Number(url.searchParams.get("cursor") ?? 0);
    return Response.json({
      items: Array.from({ length: 100 }, (_, i) => ghost(offset + i)),
      nextCursor: String(offset + 100),
    });
  });
  const snapshot = await getSnapshot();
  assert.equal(snapshot.streamers.length, 101);
  assert.equal(snapshot.recordings.length, 2);
  assert.equal(snapshot.ghosts.length, 36);
  assert.equal(snapshot.generatedAt, "2026-10-30T14:00:00.000Z");
  for (const url of requests.filter((url) =>
    url.pathname.endsWith("/sessions")
  )) {
    assert.equal(url.searchParams.get("from"), "2026-10-29T14:00:00.000Z");
    assert.equal(url.searchParams.get("to"), snapshot.generatedAt);
    assert.equal(url.searchParams.get("limit"), "100");
  }
  const searches = requests.filter((url) => url.pathname.endsWith("/search"));
  assert.equal(searches.length, 5);
  for (const url of searches) {
    assert.equal(url.searchParams.get("from"), "2026-10-23T14:00:00.000Z");
    assert.equal(url.searchParams.get("to"), snapshot.generatedAt);
    assert.equal(url.searchParams.get("representation"), "summary");
    assert.equal(url.searchParams.get("limit"), "100");
  }
  assert.equal(
    snapshot.recordings[0].href,
    `/recordings/${"1".padStart(32, "0")}?source=r1`
  );
  assert.equal(snapshot.streamers[100].href, "/streamers/101");
  assert.equal("sources" in snapshot.ghosts[0], false);
  assert.equal("channel" in snapshot.recordings[0], false);
});

test("hourly runtime cache reuses data and never publishes a failed refresh", async (t) => {
  let now = Date.parse("2026-10-30T14:00:00Z");
  t.mock.method(Date, "now", () => now);
  let calls = 0,
    fail = false;
  const getSnapshot = loader(async (request) => {
    calls++;
    if (fail) return Response.json({ error: "Unavailable" }, { status: 503 });
    if (request.url.endsWith("/stats"))
      return Response.json({ streamers: 0, recordings: 0, matchups: 0 });
    return Response.json({ items: [], nextCursor: null });
  });
  const first = await getSnapshot();
  assert.equal(calls, 4);
  now += 3_599_000;
  assert.deepEqual(await getSnapshot(), first);
  assert.equal(calls, 4);
  now += 2000;
  fail = true;
  await assert.rejects(getSnapshot(), /503/);
  now -= 2000;
  assert.deepEqual(await getSnapshot(), first);
  fail = false;
  now += 2000;
  assert.notEqual((await getSnapshot()).generatedAt, first.generatedAt);
});

test("cursor revision restarts the whole list once rather than publishing partial results", async () => {
  let starts = 0,
    continuations = 0;
  const getSnapshot = loader(async (request) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/stats"))
      return Response.json({ streamers: 2, recordings: 0, matchups: 0 });
    if (!url.pathname.endsWith("/streamers"))
      return Response.json({ items: [], nextCursor: null });
    if (!url.searchParams.has("cursor")) {
      starts++;
      return Response.json({
        items: [streamer(starts === 1 ? 99 : 1)],
        nextCursor: "next",
      });
    }
    if (++continuations === 1) return Response.json({}, { status: 409 });
    return Response.json({ items: [streamer(2)], nextCursor: null });
  });
  assert.deepEqual(
    (await getSnapshot()).streamers.map((row) => row.title),
    ["Streamer 1", "Streamer 2"]
  );
  assert.equal(starts, 2);
});

test("repeating cursors fail the snapshot instead of claiming a complete archive", async () => {
  const getSnapshot = loader(async (request) =>
    request.url.endsWith("/stats")
      ? Response.json({ streamers: 2, recordings: 0, matchups: 0 })
      : Response.json({ items: [], nextCursor: "same" })
  );
  await assert.rejects(getSnapshot(), /cursor repeated/);
});

test("hourly ghost selection varies, avoids repeated names and spreads heroes/streamers", () => {
  const { sampleGhosts } = sourceModules()("@/lib/landing/sample-ghosts");
  const pool = Array.from({ length: 200 }, (_, i) =>
    ghost(i, i < 150 ? 1 : i % 8, i % 2 ? "dooley" : "vanessa")
  );
  pool.push({ ...ghost(500, 3), opponent: { username: "GHOST 1", igd: 3 } });
  const first = sampleGhosts(pool, 100, 24);
  assert.deepEqual(sampleGhosts(pool, 100, 24), first);
  assert.notDeepEqual(sampleGhosts(pool, 101, 24), first);
  assert.equal(
    new Set(first.map((item) => item.opponent.username.toLowerCase())).size,
    24
  );
  assert.ok(new Set(first.map((item) => item.streamer.id)).size >= 6);
  assert.equal(new Set(first.map((item) => item.encounter.ghostHero)).size, 2);
  assert.deepEqual(sampleGhosts([], 100), []);
  assert.equal(sampleGhosts([ghost(1)], 100).length, 1);
});
