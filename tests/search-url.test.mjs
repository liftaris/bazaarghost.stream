import assert from "node:assert/strict";
import test from "node:test";
import { hooks, sourceModules } from "./helpers/source-harness.mjs";

function setup(path = "/search?q=old&platform=twitch&from=2026-01-01&channel=abc") {
  const state = hooks();
  let live = new URL(path, "https://test");
  const pushes = [], listeners = new Map();
  let active = true;
  globalThis.window = {
    get location() { return live; },
    history: { replaceState(_a, _b, url) { live = new URL(url, live); } },
    addEventListener: (event, fn) => listeners.set(event, fn),
    removeEventListener: (event) => listeners.delete(event),
  };
  const router = { push: (url) => pushes.push(url) };
  const load = sourceModules({ react: state.react, "@/lib/platforms": { isKnownPlatform: id => ["twitch", "youtube", "bilibili"].includes(id) }, "next/navigation": {
    useRouter: () => router, usePathname: () => live.pathname, useSearchParams: () => live.searchParams,
  }, "@/components/workspace-context": { useWorkspaceActive: () => active } });
  const { useSearchUrl } = load("@/components/search/hooks/use-search-url");
  const render = () => { let result; for (let i = 0; i < 3; i++) result = state.render(useSearchUrl); state.flushEffects(); return result; };
  return { render, pushes, commit: (url) => { live = new URL(url, live); },
    pop: (url) => { live = new URL(url, live); listeners.get("popstate")?.(); },
    hide: () => { active = false; }, get location() { return live; } };
}

test("target mode and filters activate before navigation, with latest rapid target winning", () => {
  const app = setup();
  app.render().switchMode("recordings");
  let url = app.render();
  assert.equal(url.mode, "recordings");
  assert.equal(app.location.pathname, "/search");
  assert.equal(url.filters.q, "");
  assert.equal(url.filters.from, "2026-01-01");
  url.switchMode("streamers");
  url = app.render();
  assert.equal(url.mode, "streamers");
  assert.equal(url.filters.from, null);
  assert.deepEqual(url.filters.include, ["twitch"]);
  app.commit(app.pushes.at(-1));
  assert.equal(app.render().mode, "streamers");
});

test("pending filter edits target the new route rather than overwriting the old URL", () => {
  const app = setup();
  app.render().switchMode("recordings");
  app.render().setParams({ from: "2026-02-01" });
  assert.equal(app.render().filters.from, "2026-02-01");
  assert.match(app.pushes.at(-1), /^\/recordings\?/);
  assert.equal(app.location.searchParams.get("from"), "2026-01-01");
});

test("mode switch and Back cancel stale debounced text", async () => {
  const app = setup();
  let url = app.render();
  url.handleInputChange("stale");
  url.switchMode("streamers");
  url = app.render();
  app.commit(app.pushes.at(-1));
  app.render();
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.equal(app.location.searchParams.has("q"), false);
  app.render().handleInputChange("also stale");
  app.pop("/search?q=restored");
  assert.equal(app.render().inputValue, "restored");
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.equal(app.location.searchParams.get("q"), "restored");
});

test("detail navigation and leaving the workspace interrupt pending mode", () => {
  const app = setup();
  app.render().switchMode("streamers");
  app.commit("/matchups/42?list=ghosts");
  const url = app.render();
  assert.equal(url.mode, "ghosts");
  assert.deepEqual(url.selection, { kind: "matchup", id: "42" });
  url.switchMode("recordings");
  app.hide();
  app.commit("/account");
  assert.equal(app.render().mode, "ghosts");
});

test("returning to the origin cancels pending state and keeps shallow filter updates", () => {
  const app = setup("/search?platform=twitch");
  app.render().switchMode("recordings");
  app.render().switchMode("ghosts");
  app.render().setParams({ q: "new" });
  assert.equal(app.pushes.length, 2);
  assert.equal(app.location.searchParams.get("q"), "new");
});

test("text typed in the target survives its router commit", async () => {
  const app = setup();
  app.render().switchMode("streamers");
  app.render().handleInputChange("new target query");
  app.commit(app.pushes.at(-1));
  app.render();
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.equal(app.pushes.length, 1);
  assert.equal(app.location.searchParams.get("q"), "new target query");
});

test("Back clears uncommitted input even when both routes have an empty query", () => {
  const app = setup("/streamers");
  app.render().handleInputChange("discard");
  app.pop("/search");
  assert.equal(app.render().inputValue, "");
});
