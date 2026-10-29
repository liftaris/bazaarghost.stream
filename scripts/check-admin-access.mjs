import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const helpers = process.env.OPS_QA_HELPERS;
assert.ok(helpers, "OPS_QA_HELPERS must contain the existing QA credential and browser helpers");
const { launch, sleep } = await import(pathToFileURL(resolve(helpers, "cdp.mjs")));
const { signIn } = await import(pathToFileURL(resolve(helpers, "auth.mjs")));
const base = process.env.BASE ?? "http://127.0.0.1:5201";
const out = process.env.OUT ?? "/tmp/opencode/ops-perf-waterfall/access";
const live = "https://bazaarghost-frontend-validation.kaio-8df.workers.dev";
const cdp = await launch({ port: 9941 });
const e = cdp.evaluate;
const results = [], requests = [], errors = [];
let phase = "auth";
mkdirSync(out, { recursive: true });
cdp.on("Network.requestWillBeSent", x => requests.push({ phase, url: x.request.url, method: x.request.method }));
cdp.on("Runtime.exceptionThrown", x => errors.push(x.exceptionDetails.text));
async function wait(expr) {
  for (let i = 0; i < 1200; i++) { if (await e(expr).catch(() => false)) return; await sleep(25); }
  throw new Error(`Timeout ${expr}`);
}
async function check(name, expr) {
  const passed = await e(expr); results.push({ name, passed }); assert.equal(passed, true, name);
}
async function screenshot(name) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${out}/${name}.png`, Buffer.from(data, "base64"));
}
const routes = [
  ["overview", "/admin", "/overview", "main time"],
  ["activity", "/admin/activity", "/recordings", 'table[aria-label="Recordings by latest activity"]'],
  ["streamers", "/admin/streamers", "/streamers", 'table[aria-label="Streamers"]'],
  ["ingestion", "/admin/ingestion", "/ingestion", "#switches-heading"],
  ["recording", "/admin/recordings/172013", "/recordings/172013", 'a[aria-label="Inspect chunk 0"]'],
  ["inventory", "/admin/streamers/19198298", "/streamers/19198298/inventory", 'main ul[aria-label="Channels"]'],
];
try {
  assert.equal((await signIn(cdp, live)).status, 200);
  const { cookies } = await cdp.send("Network.getCookies", { urls: [live] });
  for (const c of cookies) await cdp.send("Network.setCookie", { name: c.name, value: c.value, url: base, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite });
  const { identifier } = await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: `
    const originalFetch = window.fetch;
    window.operatorReads = {};
    const accessGate = new Promise(resolve => { window.releaseAccess = resolve; });
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const path = new URL(response.url).pathname;
      if (path.startsWith('/api/v1/ops/')) window.operatorReads[path] = response.status;
      if (path === '/api/v1/ops/me') { window.accessHeld = true; await accessGate; }
      return response;
    };
  ` });
  for (const [name, path, endpoint, selector] of routes) {
    phase = name; await cdp.send("Page.navigate", { url: base + path });
    await wait(`accessHeld && operatorReads[${JSON.stringify("/api/v1/ops" + endpoint)}]===200`);
    await check(`${name}-data-hidden-before-access`, `!document.querySelector(${JSON.stringify(selector)}) && !document.querySelector('aside[aria-label=Inspector]') && !document.querySelector('input[aria-label^="Jump to"]')`);
    await screenshot(`${name}-pending`);
    await e("releaseAccess()"); await wait(`!!document.querySelector(${JSON.stringify(selector)})`);
    await check(`${name}-data-visible-after-access`, `operatorReads['/api/v1/ops/me']===200`);
    const ops = requests.filter(r => r.phase === phase && r.url.includes("/api/v1/ops/"));
    assert.deepEqual(ops.map(r => new URL(r.url).pathname).sort(), ["/api/v1/ops/me", "/api/v1/ops" + endpoint].sort(), `${name}: only access and selected page reads`);
    await screenshot(`${name}-allowed`);
  }
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: `
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const path = new URL(args[0] instanceof Request ? args[0].url : args[0], location.href).pathname;
      if (path === '/api/v1/ops/me') return originalFetch(args[0], { ...args[1], credentials: 'omit' });
      return originalFetch(...args);
    };
  ` });
  phase = "denied"; await cdp.send("Page.navigate", { url: base + "/admin" });
  await wait(`document.body.textContent.includes('Could not check operator access')`);
  await sleep(700);
  await check("real-401-keeps-data-hidden", `!document.querySelector('main time') && !document.querySelector('input[aria-label^="Jump to"]')`);
  await screenshot("denied");
  assert.deepEqual(errors, []);
  assert.equal(requests.some(r => r.phase !== "auth" && r.url.includes("/api/v1/ops/") && r.method !== "GET"), false);
} catch (error) {
  errors.push(String(error)); console.error(error); process.exitCode = 1;
} finally {
  writeFileSync(`${out}/report.json`, JSON.stringify({ base, results, requests, errors }, null, 2)); cdp.close();
}
