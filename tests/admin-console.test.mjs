import assert from "node:assert/strict";
import test from "node:test";
import { sourceModules } from "./helpers/source-harness.mjs";

const load = sourceModules({
  "simple-icons": { siTwitch: {}, siYoutube: {}, siBilibili: {} },
  "date-fns": { format: () => "", formatDistanceToNowStrict: () => "" },
});
const { parseJump, jumpHref } = load("@/components/admin/lib/jump");
const { parseInspect, formatInspect, withInspect } = load("@/components/admin/lib/inspect");
const { chapterSpans, timelineExtent, placeSpan, placeTick } = load("@/components/admin/lib/timeline");
const { parseActivityFilters, activityHref } = load("@/components/admin/lib/activity-filters");
const { formatTimecode, formatSeconds } = load("@/components/admin/lib/format");

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
});

test("timecodes and durations read the way operators scrub", () => {
  assert.equal(formatTimecode(59), "0:59");
  assert.equal(formatTimecode(3723), "1:02:03");
  assert.equal(formatSeconds(42), "42s");
  assert.equal(formatSeconds(252), "4m 12s");
  assert.equal(formatSeconds(3780), "1h 03m");
  assert.equal(formatSeconds(null), "-");
});
