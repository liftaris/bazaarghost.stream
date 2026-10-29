import assert from "node:assert/strict";
import test from "node:test";
import { sourceModules, hooks, deferred, settle } from "./helpers/source-harness.mjs";

function resources() {
  const h = hooks();
  const requests = [];
  const load = sourceModules({
    react: h.react,
    "@/lib/operator-client": {
      opsGet: (path, options, signal) => {
        const request = { path, options, signal, ...deferred() };
        requests.push(request);
        return request.promise;
      },
      toApiError: (error) => error,
    },
  });
  return { h, requests, load };
}

test("inspector reads abort superseded requests and ignore late results", async () => {
  const { h, requests, load } = resources();
  const { useOpsResource } = load("@/components/admin/hooks/use-ops-resource");
  const render = (id) => h.render(() => useOpsResource("/chunks/:id", { id }));
  assert.equal(render("first").loading, true); h.flushEffects();
  assert.equal(render("second").data, null); h.flushEffects();
  assert.equal(requests[0].signal.aborted, true);
  requests[1].resolve({ id: "second" }); await settle();
  requests[0].resolve({ id: "first" }); await settle();
  assert.equal(render("second").data.id, "second");
  render("third"); h.flushEffects();
  requests[2].reject(new Error("denied")); await settle();
  assert.equal(render("third").data, null);
  assert.equal(render("third").error.message, "denied");
});

test("invalidation refetches mounted detail without a persistent cache", async () => {
  const { h, requests, load } = resources();
  const { useOpsResource, invalidateOpsResources } = load("@/components/admin/hooks/use-ops-resource");
  const render = () => h.render(() => useOpsResource("/chunks/:id", { id: "chunk" }));
  render(); h.flushEffects(); requests[0].resolve({ status: "old" }); await settle();
  invalidateOpsResources();
  assert.equal(render().data.status, "old"); assert.equal(render().loading, true); h.flushEffects();
  requests[1].resolve({ status: "new" }); await settle();
  assert.equal(render().data.status, "new"); assert.equal(render().loading, false);
});

test("filter changes discard stale pages and invalidation restarts pagination", async () => {
  const { h, requests, load } = resources();
  const { useCursorPages } = load("@/components/admin/hooks/use-cursor-pages");
  const { invalidateOpsResources } = load("@/components/admin/hooks/use-ops-resource");
  const select = (response) => response;
  const render = (q = "one") => h.render(() => useCursorPages("/recordings", { q, limit: 2 }, select));
  render(); h.flushEffects(); requests[0].resolve({ items: [1, 2], nextCursor: "next" }); await settle();
  render().loadMore();
  assert.equal(requests[1].options.params.cursor, "next");
  render("two"); h.flushEffects(); assert.equal(requests[1].signal.aborted, true);
  requests[2].resolve({ items: [7], nextCursor: "second" }); await settle();
  requests[1].resolve({ items: [3, 4], nextCursor: null }); await settle();
  assert.deepEqual(render("two").items, [7]);
  render("two").loadMore();
  invalidateOpsResources(); assert.equal(render("two").loading, true); h.flushEffects();
  assert.equal(requests[3].signal.aborted, true);
  assert.equal(requests[4].options.params.cursor, undefined);
  requests[4].resolve({ items: [8], nextCursor: null }); await settle();
  requests[3].resolve({ items: [9], nextCursor: null }); await settle();
  assert.deepEqual(render("two").items, [8]);
});

test("authorization failure clears paginated headers and rows instead of retaining protected data", async () => {
  for (const status of [401, 403]) {
    const { h, requests, load } = resources();
    const { useCursorPages } = load("@/components/admin/hooks/use-cursor-pages");
    const { invalidateOpsResources } = load("@/components/admin/hooks/use-ops-resource");
    const select = response => response;
    const render = () => h.render(() => useCursorPages("/ingestion", { limit: 2 }, select));
    render(); h.flushEffects();
    requests[0].resolve({ items: ["private"], nextCursor: "next", platforms: ["private"] }); await settle();
    assert.deepEqual(render().items, ["private"]);
    invalidateOpsResources(); render(); h.flushEffects();
    requests[1].reject({ status, message: "denied" }); await settle();
    const page = render();
    assert.equal(page.latest, null);
    assert.deepEqual(page.items, []);
    assert.equal(page.hasMore, false);
    assert.equal(page.error.status, status);
  }
});
