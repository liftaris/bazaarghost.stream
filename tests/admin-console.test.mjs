import assert from "node:assert/strict";
import test from "node:test";
import { sourceModules } from "./helpers/source-harness.mjs";

const load = sourceModules({
  "simple-icons": { siTwitch: {}, siYoutube: {}, siBilibili: {} },
  "date-fns": { format: () => "", formatDistanceToNowStrict: () => "" },
});
const { parseJump, jumpHref } = load("@/components/admin/lib/jump");
const { parseInspect, formatInspect, withInspect } = load("@/components/admin/lib/inspect");
const { chapterSpans, timelineExtent, placeSpan, placeTick, axisMarks } = load("@/components/admin/lib/timeline");
const { throughputColumns, throughputTotals } = load("@/components/admin/overview/lib/throughput");
const { detectionName, sourceUrlAt } = load("@/components/admin/lib/detection");
const { regionBox, cropFrame, groupByFrame } = load("@/components/admin/lib/evidence");
const { FIELD_ORDER, fieldsWithoutEvidence } = load("@/components/admin/lib/detection-fields");
const { parseActivityFilters, activityHref } = load("@/components/admin/lib/activity-filters");
const { ATTENTION, attentionSampleHref } = load("@/components/admin/lib/attention");
const { formatTimecode, formatSeconds } = load("@/components/admin/lib/format");
const inventory = load("@/components/admin/streamers/lib/inventory");
const { channelUrl } = load("@/components/admin/streamers/lib/channels");
const { parseStreamerSearch } = load("@/components/admin/streamers/lib/search");
const { parseJobFilters } = load("@/components/admin/ingestion/lib/job-filters");

const CHUNK = "3f2a9c4e-1b7d-4e8a-9c2f-0d1e2f3a4b5c";
const here = { pathname: "/admin/activity", search: "status=failed" };

test("jump box: a number opens that recording", () => {
  const target = parseJump(" 4182 ");
  assert.deepEqual(target, { kind: "recording", id: 4182 });
  assert.equal(jumpHref(target, here), "/admin/recordings/4182");
});

test("jump box: a UUID opens the chunk inspector over the current page", () => {
  const target = parseJump(CHUNK.toUpperCase());
  assert.deepEqual(target, { kind: "chunk", id: CHUNK });
  assert.equal(jumpHref(target, here), `/admin/activity?status=failed&inspect=chunk%3A${CHUNK}`);
});

test("jump box: explicit detection references open the detection inspector", () => {
  assert.deepEqual(parseJump(`detection:${CHUNK}`), { kind: "detection", id: CHUNK });
});

test("jump box: platform VOD links search activity by source id", () => {
  const twitch = parseJump("https://www.twitch.tv/videos/2290012345?t=1h2m");
  assert.deepEqual(twitch, { kind: "source", platform: "twitch", sourceId: "2290012345" });
  assert.equal(jumpHref(twitch, here), "/admin/activity?platform=twitch&q=2290012345");
  assert.deepEqual(parseJump("twitch.tv/videos/77"), { kind: "source", platform: "twitch", sourceId: "77" });
  assert.deepEqual(parseJump("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s"), {
    kind: "source",
    platform: "youtube",
    sourceId: "dQw4w9WgXcQ",
  });
  assert.deepEqual(parseJump("https://youtu.be/dQw4w9WgXcQ"), {
    kind: "source",
    platform: "youtube",
    sourceId: "dQw4w9WgXcQ",
  });
  assert.deepEqual(parseJump("BV1GJ411x7h7"), { kind: "source", platform: "bilibili", sourceId: "BV1GJ411x7h7" });
  assert.deepEqual(parseJump("https://www.bilibili.com/video/BV1GJ411x7h7?p=2"), {
    kind: "source",
    platform: "bilibili",
    sourceId: "BV1GJ411x7h7",
  });
});

test("jump box: channel links and free text fall back to activity search", () => {
  assert.deepEqual(parseJump("twitch.tv/kripp"), { kind: "search", q: "twitch.tv/kripp" });
  const text = parseJump("reynad day 10");
  assert.equal(jumpHref(text, here), "/admin/activity?q=reynad+day+10");
  assert.equal(parseJump("   "), null);
});

test("inspect param: parses only chunk and detection targets", () => {
  assert.deepEqual(parseInspect(`chunk:${CHUNK}`), { kind: "chunk", id: CHUNK });
  assert.deepEqual(parseInspect("detection:abc"), { kind: "detection", id: "abc" });
  assert.equal(parseInspect("matchup:1"), null);
  assert.equal(parseInspect("chunk:"), null);
  assert.equal(parseInspect(null), null);
  assert.equal(formatInspect({ kind: "detection", id: "abc" }), "detection:abc");
});

test("inspect param: setting and clearing keeps every other parameter", () => {
  const opened = withInspect("status=failed&q=kripp", { kind: "chunk", id: "c1" });
  assert.equal(opened, "?status=failed&q=kripp&inspect=chunk%3Ac1");
  assert.equal(withInspect(opened, null), "?status=failed&q=kripp");
  assert.equal(withInspect("inspect=chunk%3Ac1", null), "");
});

test("activity filters: unknown statuses and blanks are dropped", () => {
  assert.deepEqual(parseActivityFilters("status=attention&platform=Twitch&q=%20kripp%20"), {
    status: "attention",
    platform: "twitch",
    q: "kripp",
  });
  assert.deepEqual(parseActivityFilters("status=archived&q="), {});
  assert.equal(activityHref({ status: "failed" }), "/admin/activity?status=failed");
  assert.equal(activityHref(), "/admin/activity");
});

test("activity filters: chunk status filters by any chunk in that status", () => {
  assert.deepEqual(parseActivityFilters("chunkStatus=failed&status=partial"), { status: "partial", chunkStatus: "failed" });
  assert.deepEqual(parseActivityFilters("chunkStatus=exploded"), {});
  assert.equal(activityHref({ chunkStatus: "queued" }), "/admin/activity?chunkStatus=queued");
});

test("attention: chunk groups open recordings with chunks in the matching status", () => {
  assert.equal(ATTENTION.exhausted_chunk.href, "/admin/activity?chunkStatus=failed");
  assert.equal(ATTENTION.expired_lease.href, "/admin/activity?chunkStatus=processing");
  assert.equal(ATTENTION.stale_queued.href, "/admin/activity?chunkStatus=queued");
});

test("attention: samples open the entity their target names", () => {
  const chunk = { kind: "chunk", id: CHUNK };
  assert.equal(attentionSampleHref({ target: chunk, recordingId: 4182 }), `/admin/recordings/4182?inspect=chunk%3A${CHUNK}`);
  assert.equal(attentionSampleHref({ target: chunk, recordingId: null }), `/admin/activity?inspect=chunk%3A${CHUNK}`);
  assert.equal(attentionSampleHref({ target: { kind: "recording", id: "4182" }, recordingId: null }), "/admin/recordings/4182");
  assert.equal(attentionSampleHref({ target: { kind: "streamer", id: "7" }, recordingId: null }), "/admin/streamers/7");
  assert.equal(attentionSampleHref({ target: { kind: "ingestion_job", id: "job_1" }, recordingId: null }), "/admin/ingestion");
  assert.equal(attentionSampleHref({ target: { kind: "dispatch", id: "1" }, recordingId: null }), "/admin/ingestion");
});

test("timeline: chapters pair up, sort, and drop inverted ranges", () => {
  assert.deepEqual(chapterSpans([600, 900, 10, 20, 50, 40, 5]), [
    { start: 10, end: 20 },
    { start: 600, end: 900 },
  ]);
});

test("timeline: extent covers chunks that run past the reported duration", () => {
  assert.equal(timelineExtent(3600, [{ start: 0, end: 3700 }]), 3700);
  assert.equal(timelineExtent(null, []), 0);
});

test("timeline: spans place as percentages with a visible minimum width", () => {
  assert.deepEqual(placeSpan({ start: 900, end: 1800 }, 3600), { left: 25, width: 25 });
  const tiny = placeSpan({ start: 3599, end: 3600 }, 3600);
  assert.equal(tiny.width, 0.4);
  assert.ok(tiny.left + tiny.width <= 100);
  assert.deepEqual(placeSpan({ start: 0, end: 10 }, 0), { left: 0, width: 0 });
  assert.equal(placeTick(1800, 3600), 50);
  assert.equal(placeTick(5000, 3600), 100);
  assert.deepEqual(axisMarks(3600), [0, 900, 1800, 2700, 3600]);
  assert.deepEqual(axisMarks(0), [0]);
});

test("throughput: every hour scales against the busiest one", () => {
  const buckets = [
    { hour: "2026-10-28T00:00:00Z", completed: 6, failed: 2 },
    { hour: "2026-10-28T01:00:00Z", completed: 2, failed: 0 },
    { hour: "2026-10-28T02:00:00Z", completed: 0, failed: 0 },
  ];
  const [busiest, quiet, idle] = throughputColumns(buckets);
  assert.equal(busiest.completedHeight + busiest.failedHeight, 100);
  assert.equal(quiet.completedHeight, 25);
  assert.equal(idle.completedHeight + idle.failedHeight, 0);
  assert.deepEqual(throughputTotals(buckets), { completed: 8, failed: 2 });
  assert.equal(throughputColumns([{ hour: "x", completed: 0, failed: 0 }])[0].completedHeight, 0);
});

test("detection names keep partial reads marked as observed text", () => {
  assert.deepEqual(detectionName({ username: "kripp", nameState: "complete" }), { text: "kripp", note: null });
  assert.deepEqual(detectionName({ username: "kri", nameState: "partial" }), { text: "kri", note: "partial" });
  assert.deepEqual(detectionName({ username: null, nameState: "unreadable" }), { text: "Unread name", note: "unreadable" });
});

test("timecodes and durations read the way operators scrub", () => {
  assert.equal(formatTimecode(59), "0:59");
  assert.equal(formatTimecode(3723), "1:02:03");
  assert.equal(formatSeconds(42), "42s");
  assert.equal(formatSeconds(252), "4m 12s");
  assert.equal(formatSeconds(3780), "1h 03m");
  assert.equal(formatSeconds(null), "-");
});

const read = (overrides) => ({
  detectionId: "d1",
  recordingId: 7,
  atMs: 60_000,
  confidence: 0.9,
  method: "vlm",
  screenshotUrl: "/api/v1/ops/images/a.jpg",
  phase: "pre_fight",
  frameSha256: null,
  sourceWidth: 1920,
  sourceHeight: 1080,
  region: null,
  selectionReason: null,
  ...overrides,
});

test("evidence: a source-pixel region becomes a percent box on its frame", () => {
  assert.deepEqual(regionBox({ region: [192, 108, 384, 216], sourceWidth: 1920, sourceHeight: 1080 }), {
    left: 10,
    top: 10,
    width: 20,
    height: 20,
  });
  assert.equal(regionBox({ region: [1800, 1000, 240, 160], sourceWidth: 2000, sourceHeight: 1000 }), null);
  assert.deepEqual(regionBox({ region: [-100, 0, 300, 500], sourceWidth: 1000, sourceHeight: 1000 }), {
    left: 0,
    top: 0,
    width: 20,
    height: 50,
  });
  assert.equal(regionBox({ region: [0, 0, 10, 10], sourceWidth: null, sourceHeight: 1080 }), null);
  assert.equal(regionBox({ region: null, sourceWidth: 1920, sourceHeight: 1080 }), null);
});

test("evidence: the crop sizes the frame so only the region fills its box", () => {
  assert.deepEqual(cropFrame({ region: [100, 50, 200, 100], sourceWidth: 1000, sourceHeight: 500 }), {
    aspectRatio: 2,
    width: 500,
    left: -50,
    top: -50,
  });
  assert.equal(cropFrame({ region: [0, 0, 0, 40], sourceWidth: 1000, sourceHeight: 500 }), null);
});

test("evidence: reads that share a frame group together, earliest frame first", () => {
  const clock = { frameSha256: "sha-clock", atMs: 90_000, screenshotUrl: "/api/v1/ops/images/clock.jpg" };
  const groups = groupByFrame(
    {
      winsRemaining: read({ ...clock, region: [10, 10, 20, 20] }),
      igd: read({ ...clock, region: [40, 10, 20, 20] }),
      username: read({ atMs: 30_000, screenshotUrl: "/api/v1/ops/images/name.jpg" }),
      rank: read({ atMs: 30_000, screenshotUrl: "/api/v1/ops/images/name.jpg" }),
      lethal: read({ atMs: 120_000, screenshotUrl: null }),
      gameMode: read({ atMs: 120_000, screenshotUrl: null }),
    },
    FIELD_ORDER,
  );
  assert.deepEqual(
    groups.map((group) => [group.key, group.reads.map((r) => r.field)]),
    [
      ["/api/v1/ops/images/name.jpg", ["username", "rank"]],
      ["sha-clock", ["igd", "winsRemaining"]],
      ["field:gameMode", ["gameMode"]],
      ["field:lethal", ["lethal"]],
    ],
  );
  assert.equal(groups[1].screenshotUrl, "/api/v1/ops/images/clock.jpg");
  assert.deepEqual(groupByFrame({}, FIELD_ORDER), []);
});

test("evidence: valued fields without evidence are listed so legacy reads stay visible", () => {
  const detection = {
    username: null,
    nameState: "legacy",
    rank: "gold",
    igd: 4,
    winsRemaining: null,
    ghostHero: null,
    streamerHero: "mak",
    lethal: null,
    gameMode: null,
    tournamentWins: null,
    tournamentLosses: null,
    fieldEvidence: { igd: read({}) },
  };
  assert.deepEqual(fieldsWithoutEvidence(detection), ["username", "rank", "streamerHero"]);
});

test("source links move to the frame time in each platform's format", () => {
  assert.equal(
    sourceUrlAt("https://www.twitch.tv/videos/2290012345?t=1h0m0s", 3723),
    "https://www.twitch.tv/videos/2290012345?t=1h2m3s",
  );
  assert.equal(
    sourceUrlAt("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", 95.6),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=95s",
  );
  assert.equal(
    sourceUrlAt("https://www.bilibili.com/video/BV1GJ411x7h7?p=2&t=5", 61),
    "https://www.bilibili.com/video/BV1GJ411x7h7?p=2&t=61",
  );
  assert.equal(sourceUrlAt("https://example.com/v/1?t=5", 61), "https://example.com/v/1?t=5");
});

const rows = (...states) => states.map((state, i) => ({ sourceId: String(i), state }));

test("inventory: not scanned keeps only archives with no recording or job", () => {
  const items = rows("not_seen", "processed", "not_seen", "skipped");
  const shown = items.filter((item) => inventory.matchesInventoryFilter(item, "not_seen"));
  assert.deepEqual(shown.map((item) => item.sourceId), ["0", "2"]);
  assert.equal(items.filter((item) => inventory.matchesInventoryFilter(item, "all")).length, 4);
});

test("inventory: scanned-not-processed and partial-or-failed group their states", () => {
  const items = rows("waiting", "cataloged", "processing", "partial", "failed", "processed", "skipped");
  const under = (filter) => items.filter((item) => inventory.matchesInventoryFilter(item, filter)).map((item) => item.state);
  assert.deepEqual(under("scanned"), ["waiting", "cataloged", "processing"]);
  assert.deepEqual(under("attention"), ["partial", "failed"]);
  assert.deepEqual(under("processed"), ["processed"]);
  assert.deepEqual(under("skipped"), ["skipped"]);
});

test("inventory: every state has one chip, so chip counts add up to all", () => {
  const items = rows(...inventory.INVENTORY_STATES, "not_seen", "failed");
  const counts = inventory.countInventoryFilters(items);
  assert.deepEqual(counts, { all: 10, not_seen: 2, skipped: 1, scanned: 3, attention: 3, processed: 1 });
  const { all, ...groups } = counts;
  assert.equal(Object.values(groups).reduce((sum, n) => sum + n, 0), all);
  assert.deepEqual(Object.keys(inventory.INVENTORY_GROUP).sort(), [...inventory.INVENTORY_STATES].sort());
});

test("inventory: state counts are zero-filled", () => {
  const counts = inventory.countInventoryStates(rows("partial", "partial"));
  assert.equal(counts.partial, 2);
  assert.equal(counts.not_seen, 0);
  assert.equal(Object.keys(counts).length, 8);
});

test("inventory: the show parameter accepts only chip groups", () => {
  assert.deepEqual(inventory.parseInventoryFilter("show=attention&inspect=chunk%3Ac1"), { show: "attention" });
  assert.deepEqual(inventory.parseInventoryFilter("show=failed"), {});
  assert.deepEqual(inventory.parseInventoryFilter("show=all"), {});
  assert.deepEqual(inventory.parseInventoryFilter(""), {});
});

test("channel links come from what the operator contract carries", () => {
  const channel = (platform, sourceId, displayName) => ({ id: "c", platform, sourceId, displayName });
  assert.equal(channelUrl(channel("twitch", "71092938", "Kripparrian")), "https://www.twitch.tv/kripparrian");
  assert.equal(channelUrl(channel("twitch", "71092938", "\u738b\u8005")), null);
  assert.equal(channelUrl(channel("twitch", "71092938", null)), null);
  assert.equal(channelUrl(channel("youtube", "UCabc", "Retro")), "https://www.youtube.com/channel/UCabc");
  assert.equal(channelUrl(channel("bilibili", "4182", null)), "https://space.bilibili.com/4182");
  assert.equal(channelUrl(channel("kick", "x", "x")), null);
});

test("streamer search and job filters drop blanks and unknown values", () => {
  assert.deepEqual(parseStreamerSearch("q=%20kripp%20"), { q: "kripp" });
  assert.deepEqual(parseStreamerSearch("q=%20"), {});
  assert.deepEqual(parseJobFilters("platform=Bilibili&kind=video&status=skipped"), {
    platform: "bilibili",
    kind: "video",
    status: "skipped",
  });
  assert.deepEqual(parseJobFilters("kind=clip&status=failed&platform="), {});
});

const reprocess = load("@/components/admin/lib/reprocess");
const { runOrigin } = load("@/components/admin/lib/runs");
const { ApiError } = load("@/lib/api-client");
const { OpsMutationError } = load("@/lib/operator-client");

const chunk = (index, status) => ({ id: `c${index}`, index, status });

test("reprocess: a new run starts from the backend's defaults, which follow the latest run", () => {
  const defaults = { inputs: { mode: "next", quality: "720p60", runtime_image: "ghcr.io/x@sha256:ab" }, allowedModes: ["next", "legacy"] };
  assert.deepEqual(reprocess.startingInputs(defaults), { mode: "next", quality: "720p60" });
  assert.equal(reprocess.runInputsLabel({ mode: "legacy", quality: "480p60" }), "Legacy · 480p · 60 fps");
  assert.equal(reprocess.RUN_QUALITIES.length, 8);
});

test("reprocess: bulk defaults come from the earliest selected chunk in table order", () => {
  const chunks = [chunk(0, "completed"), chunk(1, "failed"), chunk(2, "failed")];
  assert.equal(reprocess.defaultsChunk(chunks, new Set(["c2", "c1"])), "c1");
  assert.equal(reprocess.defaultsChunk(chunks, new Set()), null);
});

test("reprocess: only pending, completed and failed chunks can be selected", () => {
  for (const status of ["queued", "processing", "archived"]) {
    assert.equal(reprocess.canReprocess(status), false);
    const untouched = new Set();
    assert.equal(reprocess.toggleChunk(untouched, chunk(0, status)), untouched);
  }
  const ticked = reprocess.toggleChunk(new Set(), chunk(0, "failed"));
  assert.deepEqual([...ticked], ["c0"]);
  assert.deepEqual([...reprocess.toggleChunk(ticked, chunk(0, "failed"))], []);
});

test("reprocess: select all takes eligible chunks up to the request limit, then clears", () => {
  const chunks = Array.from({ length: 60 }, (_, i) => chunk(i, i === 3 ? "processing" : "failed"));
  const all = reprocess.toggleAll(new Set(), chunks);
  assert.equal(all.size, reprocess.MAX_REPROCESS);
  assert.equal(all.has("c3"), false);
  assert.equal(reprocess.toggleAll(all, chunks).size, 0);
  const full = new Set(all);
  assert.equal(reprocess.toggleChunk(full, chunk(59, "failed")), full);
});

test("reprocess: selection drops chunks that were queued or left the list", () => {
  const selection = new Set(["c0", "c1", "gone"]);
  const pruned = reprocess.pruneSelection(selection, [chunk(0, "queued"), chunk(1, "failed")]);
  assert.deepEqual([...pruned], ["c1"]);
  assert.equal(reprocess.pruneSelection(pruned, [chunk(1, "failed")]), pruned);
});

test("reprocess: results sum queued, skipped and failed recordings", () => {
  const response = {
    dispatched: true,
    recordings: [
      { recordingId: 1, chunkIds: ["a", "b"], runIds: ["r1", "r2"], payload: null, skipped: [{ chunkId: "c", reason: "Chunk is queued" }] },
      { recordingId: 2, chunkIds: [], runIds: [], payload: null, skipped: [{ chunkId: "d", reason: "GitHub refused" }], error: "GitHub refused" },
    ],
  };
  const summary = reprocess.summariseReprocess(response);
  assert.deepEqual(summary, { queued: 2, skipped: 2, failed: 1 });
  assert.equal(reprocess.describeReprocess(summary, false), "Queued 2 chunks, 2 skipped, 1 recording failed");
  assert.equal(reprocess.describeReprocess({ queued: 1, skipped: 0, failed: 0 }, true), "1 chunk would queue");
});

test("reprocess: failures split into sign-in, refusals with results, and other errors", () => {
  assert.deepEqual(reprocess.classifyReprocessFailure(new OpsMutationError(403, "Invalid CSRF token", null)), {
    kind: "session",
    message: "Invalid CSRF token",
  });
  assert.equal(reprocess.classifyReprocessFailure(new ApiError(401, "Sign in")).kind, "session");
  const body = { dispatched: true, recordings: [], error: "No chunk was queued" };
  const refused = reprocess.classifyReprocessFailure(new OpsMutationError(502, "No chunk was queued", body));
  assert.equal(refused.kind, "refused");
  assert.equal(refused.status, 502);
  assert.equal(refused.response, body);
  const conflict = reprocess.classifyReprocessFailure(new OpsMutationError(409, "Chunks cannot be reprocessed", null));
  assert.equal(conflict.response, null);
  assert.equal(reprocess.classifyReprocessFailure(new ApiError(503, "GitHub dispatch is not configured")).kind, "error");
  assert.equal(reprocess.classifyReprocessFailure(new Error("offline")).error.status, 0);
});

test("runs: origin names the viewer, falls back to the operator id, and labels the rest", () => {
  const viewer = { userId: "usr_1", name: "Kaio" };
  assert.deepEqual(runOrigin({ origin: "operator", requestedBy: "usr_1" }, viewer), { label: "Operator · Kaio", userId: null });
  assert.deepEqual(runOrigin({ origin: "operator", requestedBy: "usr_2" }, viewer), { label: "Operator", userId: "usr_2" });
  assert.deepEqual(runOrigin({ origin: "automatic", requestedBy: null }, viewer), { label: "Automatic", userId: null });
  assert.deepEqual(runOrigin({ origin: "manual", requestedBy: null }, null), { label: "Manual", userId: null });
});
