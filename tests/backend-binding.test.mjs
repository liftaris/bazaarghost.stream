import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Miniflare } from "miniflare";
import ts from "typescript";

test("workerd binding forwards timeout, body, cookies, redirects and upstream timing", async () => {
  const adapter = ts.transpileModule(readFileSync("lib/backend-server.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mf = new Miniflare({ workers: [
    { config: { name: "frontend", compatibilityDate: "2026-08-22",
      env: { BACKEND: { type: "worker", worker: "backend" } },
      manifest: { mainModule: "index.js", modules: { "index.js": { type: "esm", contents: `${adapter}
        export default { async fetch(request) {
          const start = Date.now();
          try {
            const response = await backendFetch(new Request(request, { signal: AbortSignal.timeout(40) }));
            if (new URL(request.url).pathname === '/slow-body') await response.text();
            return response;
          } catch (error) {
            return Response.json({ name: error.name, ms: Date.now() - start }, { status: 504 });
          }
        } };` } } } } },
    { config: { name: "backend", compatibilityDate: "2026-08-22",
      manifest: { mainModule: "index.js", modules: { "index.js": { type: "esm", contents: `export default { async fetch(request) {
        if (new URL(request.url).pathname === '/slow-body') return new Response(new ReadableStream({ async start(controller) {
          await new Promise(resolve => setTimeout(resolve, 250));
          controller.enqueue(new TextEncoder().encode('delayed body'));
          controller.close();
        } }));
        if (new URL(request.url).pathname === '/slow') await new Promise(resolve => setTimeout(resolve, 250));
        return Response.json({ method: request.method, cookie: request.headers.get('cookie'), body: await request.text() },
          { status: 302, headers: { 'Location': '/elsewhere', 'Set-Cookie': 'session=test; HttpOnly', 'Server-Timing': 'total;dur=2' } });
      } };` } } } } },
  ] });
  try {
    const timeout = await mf.dispatchFetch("http://test/slow");
    assert.equal(timeout.status, 504);
    const timed = await timeout.json();
    assert.equal(timed.name, "TimeoutError");
    assert.ok(timed.ms < 200, JSON.stringify(timed));
    const slowBody = await mf.dispatchFetch("http://test/slow-body");
    assert.equal(slowBody.status, 504);
    assert.equal((await slowBody.json()).name, "TimeoutError");
    const response = await mf.dispatchFetch("http://test/fast", {
      method: "POST", body: "payload", headers: { cookie: "session=caller" }, redirect: "manual",
    });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/elsewhere");
    assert.equal(response.headers.get("set-cookie"), "session=test; HttpOnly");
    assert.match(response.headers.get("server-timing"), /total;dur=2, binding;dur=\d/);
    assert.deepEqual(await response.json(), { method: "POST", cookie: "session=caller", body: "payload" });
  } finally { await mf.dispose(); }
});
