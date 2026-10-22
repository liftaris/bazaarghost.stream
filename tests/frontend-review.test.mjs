import assert from "node:assert/strict";
import test from "node:test";
import {
  sourceModules,
  hooks,
  jsxRuntime,
  deferred,
  settle,
  elements,
} from "./helpers/source-harness.mjs";

const sid = "session-a";
const channel = { streamerId: 1, displayName: "Fixture", avatarUrl: null };
const source = (id, at = 100) => ({
  kind: "recording",
  platform: "twitch",
  available: true,
  at,
  channel,
  recording: {
    id,
    title: "Fixture",
    publishedAt: null,
    available: true,
    platform: "twitch",
    channel,
  },
});
const match = (id, sources = [source(71)]) => ({
  id,
  sources,
  session: { id: sid },
  opponent: { username: `Opponent ${id}`, nameState: "complete", rank: null },
});
const matches = [
  match(501),
  match(502, [source(72, 200)]),
  match(503),
  match(504),
];
const session = {
  id: sid,
  streamer: { id: 1 },
  recordings: [71, 72, 73].map((id) => ({
    recording: source(id).recording,
    segments: [
      { recStart: 0, recEnd: 900, offsetSeconds: id === 71 ? 0 : 100 },
    ],
  })),
};

let originalWindow, originalStorage;
test.beforeEach(() => {
  originalWindow = globalThis.window;
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  globalThis.window = {
    location: new URL("http://fixture.test/matchups/501"),
    history: { replaceState() {} },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null, setItem() {} },
  });
});
test.afterEach(() => {
  globalThis.window = originalWindow;
  if (originalStorage)
    Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
});

function provider(cachedGet) {
  const h = hooks(),
    pushed = [];
  const stubs = {
    react: h.react,
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": {
      useRouter: () => ({ push: (url) => pushed.push(url) }),
    },
    "@/components/player/player-host": { PlayerHost: "PlayerHost" },
    sonner: { toast() {} },
    "@/hooks/use-playback": {
      usePlayback: () => ({
        data: {
          player: { platform: "twitch" },
          recording: { id: 71, channel },
        },
        markers: [501, 503, 504].map((id, i) => ({
          id,
          timestampSeconds: 100 + i * 200,
        })),
      }),
    },
    "@/lib/api-cache": { cachedGet },
    "@/lib/search-filters": {
      withListParams: (url) => url,
      readUrlPlatformFilter: () => ({}),
      platformAllowed: () => true,
    },
    "@/lib/platforms": {
      getPlatform: () => ({ capabilities: { navigate: true } }),
    },
  };
  const load = sourceModules(stubs);
  const { EmbedProvider } = load("@/components/embed-provider");
  let tree;
  const render = () => {
    tree = h.render(() => EmbedProvider({ children: null }));
  };
  render();
  const p = {
    stubs,
    pushed,
    load,
    render,
    get actions() {
      return tree.props.value;
    },
    get state() {
      return tree.props.children.props.value;
    },
  };
  p.actions.setSources(matches[0].sources, sid);
  p.actions.setEmbed("v:71", 150);
  p.actions.setActiveGhost({ matchup_id: 501, frame_time_seconds: 100 });
  p.render();
  return p;
}

function consumer(p, additions = {}) {
  const h = hooks();
  const load = sourceModules({
    ...p.stubs,
    react: h.react,
    "@/components/embed-provider": {
      useEmbedActions: () => p.actions,
      useEmbedState: () => p.state,
    },
    ...additions,
  });
  return { ...h, load };
}

test("review 1: delayed Session picker cannot navigate or complete after a newer fight", async () => {
  const pending = deferred();
  const p = provider(() => pending.promise);
  p.actions.setSessionNavigation(session, matches);
  const h = consumer(p);
  const start = h.render(() =>
    h.load("@/components/session-player").useSessionPlayer()
  );
  const c = consumer(p, {
    "lucide-react": {},
    "@/components/search/streamer-recordings": {},
    "@/components/ui/button": { Button: "Button" },
    "@/components/ui/skeleton": {},
    "@/components/ui/empty": {},
    "@/components/session-player": { useSessionPlayer: () => start },
    "@/components/search/hooks/use-api-page": {
      useApiPage: () => ({ items: [{ id: "session-b", title: "Session B" }] }),
    },
    "./hooks/use-session-matchups": {
      useSessionMatchups: () => ({ session, matches }),
    },
    "./hooks/use-matchup-player": { useMatchupPlayer: () => () => {} },
    "./hooks/use-selected-matchup": {
      useSelectedMatchup: () => ({ selectedId: 501 }),
    },
    "./matchup-list": {},
    "./matchup-detail": {},
    "./session-stats": { SessionStats: "SessionStats" },
  });
  const { SessionCompanion } = c.load(
    "@/components/companion/session-companion"
  );
  let tree = c.render(SessionCompanion);
  elements(tree)
    .find((e) => e.props?.["aria-expanded"] === false)
    .props.onClick();
  tree = c.render(SessionCompanion);
  const nav = elements(tree).find(
    (e) => e.props?.["aria-label"] === "Streamer sessions"
  );
  elements(nav)
    .find((e) => e.type === "Button")
    .props.onClick();
  p.actions.goToGhost("next");
  p.render();
  pending.resolve({ ...session, id: "session-b", items: [matches[0]] });
  await settle();
  p.render();
  assert.equal(p.state.selectedGhost.matchup_id, 502);
  assert.deepEqual(p.pushed, ["/matchups/502"]);
  assert.equal(p.state.contextSessionId, sid);
  tree = c.render(SessionCompanion);
  assert(
    elements(tree).some((e) => e.props?.["aria-label"] === "Streamer sessions"),
    "canceled picker remains open"
  );
});

test("review 1: concurrent Session starts have explicit canceled results; only newest applies", async () => {
  const a = deferred(),
    b = deferred();
  const p = provider(
    (path, query) =>
      (path.endsWith("session-b") || query?.sessionId === "session-b" ? b : a)
        .promise
  );
  const h = consumer(p);
  const start = h.render(() =>
    h.load("@/components/session-player").useSessionPlayer()
  );
  const old = start("session-c", null, {}),
    latest = start("session-b", null, {});
  b.resolve({ ...session, id: "session-b", items: [] });
  const result = await latest;
  a.resolve({ ...session, id: "session-c", items: [] });
  assert.equal(await old, null);
  assert.equal(result.sessionId, "session-b");
  assert(result.isCurrent());
  p.actions.seek(400);
  assert.equal(
    result.isCurrent(),
    false,
    "completed result also fences later navigation microtasks"
  );
});

test("review 2: latest of two source choices wins a shared delayed mapping", async () => {
  const mapping = deferred();
  const p = provider(() => mapping.promise);
  p.actions.switchSource(source(72));
  p.actions.switchSource(source(73));
  mapping.resolve(session);
  await settle();
  p.render();
  assert.equal(p.state.videoId, "v:73");
  assert.equal(p.actions.getTime().currentTime, 50);
  assert.equal(p.state.selectedGhost.matchup_id, 501);
});

test("review 2: failed old source mapping cannot overwrite a newer selection/context", async () => {
  const mapping = deferred();
  const p = provider(() => mapping.promise);
  p.actions.switchSource(source(72));
  p.actions.setSources([source(80)], "other-session");
  p.actions.setEmbed("v:80", 444);
  mapping.reject(new Error("mapping unavailable"));
  await settle();
  p.render();
  assert.equal(p.state.videoId, "v:80");
  assert.equal(p.actions.getTime().currentTime, 444);
});

test("review 2: failed mapping also respects a newer same-recording seek and a newer source choice", async () => {
  for (const newer of ["seek", "source"]) {
    const mapping = deferred();
    const p = provider(() => mapping.promise);
    p.actions.switchSource(source(72));
    if (newer === "seek") p.actions.seek(444);
    else p.actions.switchSource(source(73, 88));
    mapping.reject(new Error("mapping unavailable"));
    await settle();
    p.render();
    assert.equal(p.state.videoId, newer === "seek" ? "v:71" : "v:73");
    assert.equal(p.actions.getTime().currentTime, newer === "seek" ? 444 : 88);
  }
});

test("current Session remains a no-restart action and an aborted start can be retried", async () => {
  const pending = deferred();
  const p = provider(() => pending.promise);
  const h = consumer(p);
  const start = h.render(() =>
    h.load("@/components/session-player").useSessionPlayer()
  );
  assert((await start(sid, null, {})).isCurrent());
  assert.equal(p.actions.getTime().currentTime, 150);
  const controller = new AbortController();
  const old = start("session-b", null, {}, controller.signal);
  controller.abort();
  const retry = start("session-b", null, {});
  pending.resolve({ ...session, id: "session-b", items: [] });
  assert.equal(await old, null);
  assert((await retry).isCurrent());
});

test("review 3: successful initial SSR detail keeps mapped-only current source; valid pin still wins", async () => {
  const p = provider(async () => session);
  p.actions.setEmbed("v:71", 300);
  p.actions.setActiveGhost({ matchup_id: 502, frame_time_seconds: 300 });
  p.render();
  const h = consumer(p);
  const { GhostLoader } = h.load("@/components/ghost-loader");
  const previousWindow = globalThis.window;
  globalThis.window = { location: { pathname: "/matchups/502" } };
  try {
    h.render(() => GhostLoader({ matchupId: 502, initialMatchup: matches[1] }));
    h.flushEffects();
    await settle();
    p.render();
    assert.equal(p.state.videoId, "v:71");
    assert.equal(p.actions.getTime().currentTime, 300);
    assert.equal(p.state.selectedMatchup.id, 502);
    h.render(() =>
      GhostLoader({ matchupId: 502, initialMatchup: matches[1], source: "r72" })
    );
    h.flushEffects();
    await settle();
    p.render();
    assert.equal(p.state.videoId, "v:72");
    assert.equal(p.actions.getTime().currentTime, 200);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("review 4: canonical first page controls Next while page two is pending and after failure", async () => {
  const later = deferred();
  const p = provider((path, query) =>
    Promise.resolve(
      path.startsWith("/sessions/")
        ? session
        : query.cursor
          ? later.promise
          : { items: matches.slice(0, 3), nextCursor: "next" }
    )
  );
  const h = consumer(p, {
    "@/lib/api-client": { ApiError: class extends Error {} },
  });
  const { useSessionMatchups } = h.load(
    "@/components/companion/hooks/use-session-matchups"
  );
  h.render(() => useSessionMatchups(sid));
  h.flushEffects();
  await settle();
  p.render();
  assert.deepEqual(p.state.navigationIds, [501, 502, 503]);
  p.actions.goToGhost("next");
  p.render();
  assert.equal(p.state.selectedGhost.matchup_id, 502);
  assert.equal(p.state.videoId, "v:71");
  assert.equal(p.actions.getTime().currentTime, 300);
  later.reject(new Error("page two failed"));
  await settle();
  const state = h.render(() => useSessionMatchups(sid));
  assert.equal(state.error, "page two failed");
  p.actions.goToGhost("prev");
  p.render();
  assert.equal(p.state.selectedGhost.matchup_id, 501);
  assert.deepEqual(p.state.navigationIds, [501, 502, 503]);
});

test("review 4: authoritative empty/prefix order never falls back to recording-only markers", () => {
  const p = provider(async () => session);
  p.actions.setSessionNavigation(session, []);
  p.actions.goToGhost("next");
  p.render();
  assert.equal(p.state.selectedGhost.matchup_id, 501);
  p.actions.setSessionNavigation(session, [matches[2]]);
  p.actions.goToGhost("next");
  p.render();
  assert.equal(p.state.selectedGhost.matchup_id, 501);
  assert.deepEqual(p.pushed, []);
});

test("review 6: compact and constrained bounds never rewrite desktop preference, on either axis", () => {
  for (const axis of ["x", "y"]) {
    const h = hooks();
    let notify;
    const Observer = class {
      constructor(callback) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    };
    const handle = { offsetWidth: 8, offsetHeight: 8 };
    const element = {
      clientWidth: 1440,
      clientHeight: 1000,
      querySelector: () => handle,
    };
    const ref = { current: element },
      preferred = axis === "x" ? 0.28 : 0.58;
    const load = sourceModules({ react: h.react });
    const { useSplitBounds } = load("@/hooks/use-split-bounds");
    const old = globalThis.ResizeObserver;
    globalThis.ResizeObserver = Observer;
    const render = () =>
      h.render(() => useSplitBounds(ref, axis, preferred, 220, 360));
    try {
      render();
      h.flushEffects();
      notify();
      assert.equal(render(), preferred);
      element.clientWidth = 390;
      element.clientHeight = 300;
      notify();
      assert.notEqual(
        render(),
        preferred,
        "small desktop area temporarily constrains render"
      );
      handle.offsetWidth = handle.offsetHeight = 0;
      notify();
      assert.equal(
        render(),
        preferred,
        "compact hidden handle cannot clamp preference"
      );
      handle.offsetWidth = handle.offsetHeight = 8;
      element.clientWidth = 1440;
      element.clientHeight = 1000;
      notify();
      assert.equal(render(), preferred);
    } finally {
      globalThis.ResizeObserver = old;
    }
  }
});

test("review 5: collapsed splitter double-click does not move between clicks; actual dragging still resizes", () => {
  const h = hooks(),
    changes = [];
  let restored = false;
  const load = sourceModules({
    react: h.react,
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": {},
    "@/lib/utils": { cn: (...values) => values.join(" ") },
  });
  const { SplitHandle } = load("@/components/split-handle");
  const node = h.render(() =>
    SplitHandle({
      axis: "x",
      label: "Resize",
      ratio: 1,
      onChange: (n) => changes.push(n),
      onCommit() {},
      onRestore: () => {
        restored = true;
      },
      before: 220,
      after: 360,
    })
  );
  const event = {
    clientX: 1436,
    pointerId: 1,
    currentTarget: {
      setPointerCapture() {},
      releasePointerCapture() {},
      getBoundingClientRect: () => ({ width: 8 }),
      parentElement: {
        getBoundingClientRect: () => ({ left: 0, width: 1440 }),
      },
    },
  };
  for (let i = 0; i < 2; i++) {
    node.props.onPointerDown(event);
    node.props.onPointerUp(event);
  }
  assert.deepEqual(changes, []);
  node.props.onDoubleClick();
  assert(restored);
  node.props.onPointerDown(event);
  node.props.onPointerMove({ ...event, clientX: 800 });
  node.props.onPointerUp({ ...event, clientX: 800 });
  assert.equal(changes.at(-1), 800 / 1432);
});
