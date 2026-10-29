import assert from "node:assert/strict";
import test from "node:test";
import { sourceModules, hooks, jsxRuntime } from "./helpers/source-harness.mjs";

const load = sourceModules();
const { isConsoleQuery, updateConsoleQuery } = load("@/components/admin/lib/console-query");
const url = (path) => new URL(path, "https://console.test");

test("only same-path console-owned query changes bypass RSC", () => {
  assert.ok(isConsoleQuery(url("/admin/activity?q=a&inspect=chunk:x"), url("/admin/activity?q=b")));
  assert.ok(isConsoleQuery(url("/admin/streamers/1?show=all&future=x&future=y"), url("/admin/streamers/1?show=missing&future=x&future=y")));
  for (const [from, to] of [
    ["/admin", "/admin/activity"], ["/search?q=a", "/search?q=b"],
    ["/admin/activity", "https://other.test/admin/activity?q=b"],
    ["/admin/activity", "/admin/activity?future=x"],
    ["/admin/activity?future=x&future=y", "/admin/activity?future=y&future=x"],
    ["/admin/activity#one", "/admin/activity#two"],
  ]) assert.equal(isConsoleQuery(url(from), url(to)), false, `${from} -> ${to}`);
});

function browser(t, href) {
  const writes = [];
  const old = globalThis.window;
  globalThis.window = {
    location: url(href),
    history: Object.fromEntries(["pushState", "replaceState"].map((method) => [method, (data, unused, href) => {
      writes.push({ method, data, href: String(href) });
      window.location = new URL(href, window.location);
    }])),
  };
  t.after(() => { globalThis.window = old; });
  return writes;
}

test("history updates use native metadata preservation and avoid duplicate entries", (t) => {
  const writes = browser(t, "/admin/activity?q=a");
  assert.equal(updateConsoleQuery("?q=b", "push"), true);
  assert.equal(updateConsoleQuery("?q=b", "push"), true);
  assert.equal(writes.length, 2);
  assert.equal(writes[0].data, null);
  assert.equal(writes[0].method, "pushState");
  assert.equal(writes[1].method, "replaceState");
  assert.equal(writes[1].data, null);
  assert.equal(writes[1].href, writes[0].href);
  assert.equal(updateConsoleQuery("?q=c", "replace"), true);
  assert.equal(writes[2].method, "replaceState");
  assert.equal(updateConsoleQuery("/admin/streamers", "push"), false);
  assert.equal(writes.length, 3);
});

test("close and filter setters merge into the current URL rather than stale render snapshots", (t) => {
  browser(t, "/admin/activity?status=failed&inspect=chunk:old#keep");
  const h = hooks();
  const modules = sourceModules({ react: h.react, "next/navigation": {
    usePathname: () => "/admin/activity",
    useSearchParams: () => new URLSearchParams("status=failed&inspect=chunk:old"),
  } });
  const { useInspectParam } = modules("@/components/admin/hooks/use-inspect-param");
  const { useUrlFilters } = modules("@/components/admin/hooks/use-url-filters");
  const { inspector, filters } = h.render(() => ({
    inspector: useInspectParam(),
    filters: useUrlFilters((search) => Object.fromEntries(new URLSearchParams(search)), ["status", "q"]),
  }));
  window.history.replaceState(null, "", "/admin/activity?status=completed&inspect=chunk:new&platform=twitch#keep");
  filters.setFilters({ status: "failed", q: "new" });
  assert.equal(window.location.searchParams.get("inspect"), "chunk:new");
  inspector.close();
  assert.equal(window.location.searchParams.get("q"), "new");
  assert.equal(window.location.searchParams.get("platform"), "twitch");
  assert.equal(window.location.searchParams.has("inspect"), false);
  assert.equal(window.location.hash, "#keep");
});

test("console anchors keep modified clicks, downloads, cross-path links and user handlers", (t) => {
  const writes = browser(t, "/admin/activity");
  const modules = sourceModules({ "next/link": { default: "next-link" }, "react/jsx-runtime": jsxRuntime });
  const ConsoleLink = modules("@/components/admin/console-link").default;
  const event = (overrides = {}) => ({
    defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    currentTarget: { href: "https://console.test/admin/activity?inspect=chunk:x", target: "", hasAttribute: () => false },
    preventDefault() { this.defaultPrevented = true; }, ...overrides,
  });
  const node = ConsoleLink({ href: "/admin/activity?inspect=chunk:x" });
  assert.equal(node.props.prefetch, false);
  for (const change of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 },
    { currentTarget: { href: "https://console.test/admin/activity?q=x", target: "_blank", hasAttribute: () => false } },
    { currentTarget: { href: "https://console.test/admin/activity?q=x", target: "", hasAttribute: () => true } },
    { currentTarget: { href: "https://console.test/admin/streamers", target: "", hasAttribute: () => false } },
  ]) { const e = event(change); node.props.onClick(e); assert.equal(e.defaultPrevented, false); }
  ConsoleLink({ href: "?q=x", onClick: (e) => e.preventDefault() }).props.onClick(event());
  assert.equal(writes.length, 0);
  const e = event(); node.props.onClick(e);
  assert.equal(e.defaultPrevented, true);
  assert.equal(writes.length, 1);
});
