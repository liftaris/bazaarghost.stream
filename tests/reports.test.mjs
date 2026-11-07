import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Miniflare } from "miniflare";
import ts from "typescript";
import { sourceModules } from "./helpers/source-harness.mjs";

const load = sourceModules();
const { parseReport } = load("@/lib/reports");
const { resolveTarget } = load("@/components/report/lib/target");

const valid = { category: "wrong-opponent", message: " it's kripp ", target: { kind: "matchup", id: "42", label: "krip" }, context: { url: "x" } };
const idle = { matchupId: null, opponent: null, sessionId: null, streamerId: null, streamerName: null };

test("parseReport accepts a quick report and rejects malformed ones", () => {
  assert.equal(parseReport(valid).message, "it's kripp");
  assert.equal(parseReport({ ...valid, category: "nope" }), null);
  assert.equal(parseReport({ ...valid, category: "other", message: "  " }), null);
  assert.equal(parseReport({ ...valid, target: { kind: "admin" } }), null);
  assert.equal(parseReport({ ...valid, context: [] }), null);
  assert.equal(parseReport({ ...valid, message: "x".repeat(2001) }), null);
});

test("resolveTarget prefers the URL resource, then the player", () => {
  assert.deepEqual(resolveTarget("/matchups/7", idle), { kind: "matchup", id: "7", label: null });
  assert.equal(resolveTarget("/recordings/abc", idle).kind, "session");
  assert.deepEqual(resolveTarget("/search", { ...idle, matchupId: 9, opponent: "bob" }), { kind: "matchup", id: "9", label: "bob" });
  assert.equal(resolveTarget("/search", { ...idle, sessionId: "s1" }).id, "s1");
  assert.deepEqual(resolveTarget("/kripp", idle), { kind: "streamer", id: "kripp", label: "kripp" });
  assert.equal(resolveTarget("/contact", idle).kind, "page");
});

test("handleReport stores one KV entry per valid report", async () => {
  const compile = (path) => ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const handler = compile("lib/reports-server.ts").replace(/^export /gm, "").replace(/^import \{ parseReport.*$/m, "");
  const shared = compile("lib/reports.ts").replace(/^export /gm, "");
  const mf = new Miniflare({ workers: [{ config: {
    name: "frontend", compatibilityDate: "2026-08-22",
    env: { REPORTS: { type: "kv", id: "reports" },
      REPORT_LIMITER: { type: "rate-limit", namespace: "1001", simple: { limit: 3, period: 60 } } },
    manifest: { mainModule: "index.js", modules: { "index.js": { type: "esm",
      contents: `import { env } from "cloudflare:workers";\n${shared}\n${handler.replace(/^import \{ env \}.*$/m, "")}\nexport default { fetch: handleReport };` } } },
  } }] });
  try {
    const post = (body, headers = {}) => mf.dispatchFetch("http://test/api/reports", { method: "POST", headers, body: JSON.stringify(body) });
    assert.equal((await post(valid)).status, 201);
    assert.equal((await post({ ...valid, category: "x" })).status, 400);
    assert.equal((await post(valid, { origin: "http://evil" })).status, 403);
    const other = { "cf-connecting-ip": "203.0.113.9" };
    assert.equal((await post(valid, other)).status, 201);
    assert.equal((await post(valid, other)).status, 201);
    assert.equal((await post(valid, other)).status, 201);
    assert.equal((await post(valid, other)).status, 429);
    assert.equal((await post(valid, { "cf-connecting-ip": "203.0.113.10" })).status, 201);
    const wide = { ...valid, message: "\u0000".repeat(200), target: { kind: "page", id: "😀".repeat(60) } };
    assert.equal((await post(wide, { "cf-connecting-ip": "203.0.113.11" })).status, 201);
    const kv = await mf.getKVNamespace("REPORTS");
    const { keys } = await kv.list({ prefix: "report:" });
    assert.equal(keys.length, 6);
    assert.equal(keys[0].metadata.target, "matchup:42");
    const stored = JSON.parse(await kv.get(keys[0].name));
    assert.equal(stored.context.url, "x");
  } finally {
    await mf.dispose();
  }
});
