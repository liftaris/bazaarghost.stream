import assert from "node:assert/strict";
import test from "node:test";
import { sourceModules, hooks, jsxRuntime, deferred, settle } from "./helpers/source-harness.mjs";

function consoleFixture() {
  let active, state = { status: "anonymous" }, access;
  const requests = [], redirects = [];
  let refreshes = 0;
  const react = new Proxy({}, { get: (_, name) => {
    if (name === "useContext") return () => access;
    return (...args) => active.react[name](...args);
  } });
  const load = sourceModules({
    react, "react/jsx-runtime": { ...jsxRuntime, jsx: (type, props, key) => ({ type, props, key }) },
    "@/components/auth/auth-provider": { useAuth: () => ({ state, refresh: () => { refreshes++; } }) },
    "next/navigation": { useRouter: () => ({ replace: href => redirects.push(href) }), usePathname: () => "/admin", useSearchParams: () => new URLSearchParams() },
    "lucide-react": { ShieldX: "shield" },
    "@/components/ui/skeleton": { Skeleton: "skeleton" },
    "@/components/admin/id-chip": { IdChip: "id-chip" },
    "@/components/admin/load-states": { ErrorState: "error-state" },
    "@/components/admin/console-frame": { ConsoleFrame: "frame" },
    "@/lib/operator-client": { opsGet: (path, options, signal) => {
      const request = { path, options, signal, ...deferred() }; requests.push(request); return request.promise;
    }, toApiError: error => error },
  });
  active = hooks();
  const { OperatorSession, OperatorGate } = load("@/components/admin/operator-gate");
  const { useOpsResource, invalidateOpsResources } = load("@/components/admin/hooks/use-ops-resource");
  const sessionHooks = hooks(), gateHooks = hooks();
  let accessHooks, pageHooks, owner, key;
  const render = (h, fn) => { active = h; const value = h.render(fn); h.flushEffects(); return value; };
  function mount(next) {
    state = next;
    const session = render(sessionHooks, () => OperatorSession({ children: "selected-page" }));
    const nextKey = session.props?.children === "selected-page" ? session.key : undefined;
    if (nextKey !== key || nextKey === undefined) {
      accessHooks?.unmount(); pageHooks?.unmount();
      accessHooks = pageHooks = undefined;
    }
    key = nextKey; owner = session;
    return session;
  }
  function readAccess() {
    accessHooks ??= hooks();
    const node = render(accessHooks, () => owner.type(owner.props));
    access = node.props.value;
    if (access.error) { pageHooks?.unmount(); pageHooks = undefined; }
    return node;
  }
  function readPage() {
    pageHooks ??= hooks();
    return render(pageHooks, () => useOpsResource("/overview", {}));
  }
  const gate = () => render(gateHooks, () => OperatorGate({ children: "PRIVATE_DATA" }));
  return { mount, readAccess, readPage, gate, requests, redirects, invalidateOpsResources, refreshes: () => refreshes };
}

const authenticated = (userId = "A", sessionId = "s1") => ({ status: "authenticated", identity: { userId, sessionId, name: userId } });

test("anonymous, unresolved, and disabled sessions never mount operator request owners", () => {
  const f = consoleFixture();
  for (const status of ["anonymous", "loading", "disabled"]) {
    const node = f.mount({ status });
    assert.notEqual(node.props?.children, "selected-page");
    assert.equal(f.requests.length, 0);
  }
  assert.ok(f.redirects[0].startsWith("/login"));
});

test("selected page and access can start together but data stays gated through access loading", async () => {
  const f = consoleFixture(); f.mount(authenticated()); f.readAccess(); f.readPage();
  assert.deepEqual(f.requests.map(r => r.path), ["/me", "/overview"]);
  f.requests[1].resolve({ secret: "A" }); await settle();
  assert.equal(f.readPage().data.secret, "A");
  assert.notEqual(f.gate(), "PRIVATE_DATA");
  f.requests[0].resolve({ allowed: true }); await settle(); f.readAccess();
  assert.equal(f.gate(), "PRIVATE_DATA");
  f.mount(authenticated()); f.readAccess(); f.readPage();
  assert.equal(f.requests.length, 2, "same-session refresh does not duplicate selected reads");
  f.invalidateOpsResources(); f.readAccess(); f.readPage();
  assert.notEqual(f.gate(), "PRIVATE_DATA", "old allowed result cannot authorize during revalidation");
  assert.equal(f.requests.length, 4);
});

test("access denial unmounts the pending page, rejects late data, and retries without old authorization", async () => {
  for (const status of [401, 403, 500]) {
    const f = consoleFixture(); f.mount(authenticated()); f.readAccess(); f.readPage();
    f.requests[0].reject({ status, message: "denied" }); await settle();
    const node = f.readAccess();
    assert.notEqual(node.props.children.props.children, "selected-page");
    assert.equal(f.requests[1].signal.aborted, true);
    f.requests[1].resolve({ secret: "late" }); await settle();
    assert.notEqual(f.gate(), "PRIVATE_DATA");
    assert.equal(f.refreshes(), status === 401 ? 1 : 0);
    node.props.value.reload(); f.readAccess();
    assert.notEqual(f.gate(), "PRIVATE_DATA");
  }
});

test("page denial is not hidden by earlier detail data", async () => {
  const f = consoleFixture(); f.mount(authenticated()); f.readAccess(); f.readPage();
  f.requests[0].resolve({ allowed: true }); f.requests[1].resolve({ secret: "old" }); await settle();
  f.readAccess(); assert.equal(f.readPage().data.secret, "old");
  f.invalidateOpsResources(); f.readAccess(); f.readPage();
  f.requests[2].resolve({ allowed: true }); f.requests[3].reject({ status: 403, message: "revoked" }); await settle();
  f.readAccess(); const page = f.readPage();
  assert.equal(page.data, null);
  assert.equal(page.error.status, 403);
});

test("revoked access hides previously visible data and aborts the selected refresh", async () => {
  const f = consoleFixture(); f.mount(authenticated()); f.readAccess(); f.readPage();
  f.requests[0].resolve({ allowed: true }); f.requests[1].resolve({ secret: "old" }); await settle();
  f.readAccess(); f.readPage(); assert.equal(f.gate(), "PRIVATE_DATA");
  f.invalidateOpsResources(); f.readAccess(); f.readPage();
  assert.notEqual(f.gate(), "PRIVATE_DATA");
  f.requests[2].reject({ status: 403, message: "revoked" }); await settle(); f.readAccess();
  assert.equal(f.requests[3].signal.aborted, true);
  f.requests[3].resolve({ secret: "new" }); await settle();
  assert.notEqual(f.gate(), "PRIVATE_DATA");
});

test("account changes, session changes and signout abort both reads and discard old identity data", async () => {
  const f = consoleFixture();
  const first = f.mount(authenticated()); f.readAccess(); f.readPage();
  f.requests[0].resolve({ allowed: true }); f.requests[1].resolve({ secret: "A" }); await settle(); f.readAccess();
  assert.equal(f.gate(), "PRIVATE_DATA");
  const second = f.mount(authenticated("B")); assert.notEqual(first.key, second.key);
  assert.ok(f.requests.slice(0, 2).every(r => r.signal.aborted));
  f.readAccess(); assert.equal(f.readPage().data, null); assert.notEqual(f.gate(), "PRIVATE_DATA");
  const third = f.mount(authenticated("B", "s2")); assert.notEqual(second.key, third.key);
  assert.ok(f.requests.slice(2, 4).every(r => r.signal.aborted));
  f.readAccess(); f.readPage(); f.mount({ status: "anonymous" });
  assert.ok(f.requests.every(r => r.signal.aborted));
  const count = f.requests.length;
  for (const r of f.requests) r.resolve({ secret: "stale" }); await settle();
  f.mount(authenticated("B", "s2")); f.readAccess(); assert.equal(f.readPage().data, null);
  assert.equal(f.requests.length, count + 2);
});
