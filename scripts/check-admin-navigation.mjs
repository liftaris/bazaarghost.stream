import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const helpers = process.env.OPS_QA_HELPERS;
if (!helpers || !existsSync(resolve(helpers, "credential.json"))) throw new Error("OPS_QA_HELPERS must contain the existing QA credential and cdp.mjs/auth.mjs helpers");
const { launch, emulate, sleep, VIEWPORTS } = await import(pathToFileURL(resolve(helpers, "cdp.mjs")));
const { signIn } = await import(pathToFileURL(resolve(helpers, "auth.mjs")));
const live = "https://bazaarghost-frontend-validation.kaio-8df.workers.dev";
const base = process.env.BASE ?? "http://127.0.0.1:5193";
const out = process.env.OUT ?? "/tmp/opencode/ops-perf/navigation";
const shallow = process.env.EXPECT_SHALLOW !== "0";
const cdp = await launch({ port: 9934 });
const e = cdp.evaluate;
const results = [], requests = [], errors = [];
mkdirSync(out, { recursive: true });
cdp.on("Network.requestWillBeSent", (x) => requests.push({ url: x.request.url, method: x.request.method, at: Date.now() }));
cdp.on("Runtime.exceptionThrown", (x) => errors.push(x.exceptionDetails.exception?.description ?? x.exceptionDetails.text));
const panel = "document.querySelector('[role=dialog]')||document.querySelector('aside[aria-label=Inspector]')";
async function wait(expr) {
  for (let i = 0; i < 600; i++) { if (await e(expr).catch(() => false)) return; await sleep(50); }
  throw new Error(`Timeout ${expr}`);
}
async function key(key) {
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: { Enter: 13, Escape: 27 }[key], text: key === "Enter" ? "\r" : undefined });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key });
}
async function click(expr) { await e(`(${expr}).click()`); }
async function holdResponse(pathname) {
  await e(`(() => {
    const original = window.fetch;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    window.heldResponse = { pending: false, released: false, release };
    window.fetch = async (...args) => {
      const response = await original(...args);
      if (new URL(response.url).pathname === ${JSON.stringify(pathname)}) {
        window.heldResponse.pending = true;
        await gate;
        window.heldResponse.released = true;
      }
      return response;
    };
    window.restoreFetch = () => { window.fetch = original; };
  })()`);
}
async function releaseResponse() {
  await e(`heldResponse.release();restoreFetch()`);
  await wait(`heldResponse.released`);
  await sleep(1800);
}
async function tap(expr) {
  const point = await e(`(()=>{const el=${expr};el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
async function check(name, expr, extra = {}) {
  const passed = await e(expr);
  results.push({ name, passed, ...extra });
  console.log(name, passed, extra);
  assert.equal(passed, true, name);
}
async function nav(suffix = "") {
  await cdp.send("Page.navigate", { url: base + "/admin/recordings/172013" + suffix });
  await wait(`!!document.querySelector('a[aria-label="Inspect chunk 0"]')`);
  await sleep(700);
}
try {
  assert.equal((await signIn(cdp, live)).status, 200);
  if (base !== live) {
    const { cookies } = await cdp.send("Network.getCookies", { urls: [live] });
    for (const c of cookies) await cdp.send("Network.setCookie", { name: c.name, value: c.value, url: base, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite });
  }
  for (const size of ["1280x800", "360x780", "740x360"]) {
    await emulate(cdp, VIEWPORTS.find((v) => v.name === size)); await nav();
    await e(`window.openerLink=document.querySelector('a[aria-label="Inspect chunk 0"]');openerLink.scrollIntoView({block:'center'});openerLink.focus()`);
    let start = Date.now(); await key("Enter"); await wait(`!!(${panel})`);
    await check(`${size}-open`, `new URLSearchParams(location.search).has('inspect')`, { uiMs: Date.now() - start });
    await wait(`(${panel})?.textContent.includes('Attempts')`);
    const ownRsc = requests.filter((r) => r.at >= start && r.url.includes("/admin/recordings/172013?") && r.url.includes("_rsc="));
    if (shallow) assert.equal(ownRsc.length, 0, "query changes must not request RSC");
    start = Date.now();
    if (size === "1280x800") await click(`document.querySelector('button[aria-label="Close inspector"]')`);
    else await key("Escape");
    await wait(`!(${panel})`);
    await check(`${size}-close`, `!new URLSearchParams(location.search).has('inspect')`, { uiMs: Date.now() - start });
    if (size !== "1280x800") { await sleep(100); await check(`${size}-focus`, "document.activeElement===openerLink && openerLink.isConnected"); }
    if (size !== "1280x800") {
      await tap("openerLink"); await wait(`!!document.querySelector('[role=dialog]')`); await sleep(600);
      await tap(`[...document.querySelectorAll('[role=dialog] button')].find(el=>el.textContent==='Close')`);
      await wait(`!document.querySelector('[role=dialog]')`); await sleep(100);
      await check(`${size}-touch-close-focus`, "document.activeElement===openerLink && openerLink.isConnected");
      await e(`window.detectionLink=document.querySelector('a[aria-label^="Inspect detection at"]');detectionLink.scrollIntoView({block:'center'});detectionLink.focus()`);
      await key("Enter");
      await wait(`!!document.querySelector('[role=dialog] a[href*="inspect=chunk"]')`);
      const switchStart = Date.now();
      await click(`document.querySelector('[role=dialog] a[href*="inspect=chunk"]')`);
      await wait(`new URLSearchParams(location.search).get('inspect')?.startsWith('chunk:')`);
      await check(`${size}-switch-to-chunk`, `!!document.querySelector('[role=dialog]')`, { uiMs: Date.now() - switchStart });
      await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Attempts')`);
      await key("Escape"); await wait(`!document.querySelector('[role=dialog]')`); await sleep(100);
      await check(`${size}-switch-close-focus`, "document.activeElement===detectionLink && detectionLink.isConnected");
    }
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}/${size}-closed.png`, Buffer.from(data, "base64"));
  }
  await emulate(cdp, VIEWPORTS.find((v) => v.name === "1280x800")); await nav();
  await e(`window.zero=document.querySelector('a[aria-label="Inspect chunk 0"]');window.one=document.querySelector('a[aria-label="Inspect chunk 1"]');window.first=new URL(zero.href).searchParams.get('inspect');window.second=new URL(one.href).searchParams.get('inspect')`);
  await click("zero"); await wait(`new URLSearchParams(location.search).get('inspect')===first`);
  await click("one"); await wait(`new URLSearchParams(location.search).get('inspect')===second && (${panel})?.textContent.includes('Attempts')`);
  await e("history.back()"); await wait(`new URLSearchParams(location.search).get('inspect')===first && (${panel})?.textContent.includes('Attempts')`);
  await check("back-restores-first", `(${panel}).textContent.includes(first.split(':')[1])`);
  await e("history.forward()"); await wait(`new URLSearchParams(location.search).get('inspect')===second && (${panel})?.textContent.includes('Attempts')`);
  await check("forward-restores-second", `(${panel}).textContent.includes(second.split(':')[1])`);
  await e(`zero.click();one.click()`);
  await wait(`new URLSearchParams(location.search).get('inspect')===second && (${panel})?.textContent.includes('Attempts')`);
  await check("rapid-switch-latest-wins", `(${panel}).textContent.includes(second.split(':')[1])`);
  if (shallow) {
    await e(`document.querySelector('a[href="/admin/activity"]').click();zero.click()`);
    await wait(`new URLSearchParams(location.search).get('inspect')===first && (${panel})?.textContent.includes('Attempts')`);
    await sleep(1800);
    await check("query-supersedes-pending-route", `location.pathname==='/admin/recordings/172013' && new URLSearchParams(location.search).get('inspect')===first`);
    await holdResponse("/admin/activity");
    await e(`window.savedHistoryLength=history.length;const activity=document.querySelector('a[href="/admin/activity"]');activity.href='/admin/activity?reviewRace='+Date.now();activity.click()`);
    await wait(`heldResponse.pending`);
    await check("identical-query-route-response-pending", `location.pathname==='/admin/recordings/172013' && new URLSearchParams(location.search).get('inspect')===first && !heldResponse.released`);
    await click("zero");
    await releaseResponse();
    await check("identical-query-cancels-pending-route", `location.pathname==='/admin/recordings/172013' && new URLSearchParams(location.search).get('inspect')===first && !!(${panel})`);
    await check("identical-query-keeps-history-length", `history.length===savedHistoryLength`);
    await e(`document.querySelector('a[href*="reviewRace"]').href='/admin/activity'`);
  }
  const pendingChunkPath = await e(`'/api/v1/ops/chunks/'+new URL(document.querySelector('a[aria-label="Inspect chunk 2"]').href).searchParams.get('inspect').split(':')[1]`);
  await holdResponse(pendingChunkPath);
  await click(`document.querySelector('a[aria-label="Inspect chunk 2"]')`);
  await wait(`heldResponse.pending`);
  await check("different-chunk-fetch-pending-before-close", `!!(${panel})?.querySelector('[aria-busy=true]') && !heldResponse.released`);
  await click(`document.querySelector('button[aria-label="Close inspector"]')`);
  await wait(`!(${panel})`);
  await releaseResponse();
  await check("close-during-fetch-stays-closed", `!(${panel}) && !new URLSearchParams(location.search).has('inspect')`);
  await click(`document.querySelector('a[href="/admin/activity"]')`); await wait(`location.pathname==='/admin/activity' && !!document.querySelector('table[aria-label="Recordings by latest activity"]')`);
  await e(`document.querySelector('input[aria-label="Search recordings by title, streamer or source id"]').focus()`);
  await cdp.send("Input.insertText", { text: "Asheuin" }); const searchStart = Date.now(); await key("Enter");
  await wait(`new URLSearchParams(location.search).get('q')==='Asheuin'`);
  await check("search-url-immediate", `document.querySelector('input[aria-label="Search recordings by title, streamer or source id"]').value==='Asheuin'`, { uiMs: Date.now() - searchStart });
  await click(`document.querySelector('button[aria-label="Clear search"]')`);
  await wait(`!new URLSearchParams(location.search).has('q') && !!document.querySelector('table[aria-label="Recordings by latest activity"]')`);
  await sleep(1500); await check("clear-during-search-latest-wins", `!new URLSearchParams(location.search).has('q') && document.querySelector('table[aria-label="Recordings by latest activity"]').tBodies[0].rows.length>1`);
  await emulate(cdp, VIEWPORTS.find((v) => v.name === "360x780"));
  await nav("?inspect=chunk:86ad7a5a-840a-4823-bb55-7c3cd636f468"); await wait(`!!document.querySelector('[role=dialog]')`); await sleep(400); await key("Escape"); await wait(`!document.querySelector('[role=dialog]')`); await sleep(100);
  await check("direct-entry-fallback", `document.activeElement.id==='operator-console-content'`);
  assert.equal(requests.some((r) => r.url.includes("/ops/reprocess")), false);
  assert.deepEqual(errors, []);
} catch (error) { results.push({ name: "execution", passed: false, error: String(error) }); console.error(error); process.exitCode = 1; }
finally { writeFileSync(`${out}/report.json`, JSON.stringify({ base, shallow, results, requests, errors }, null, 2)); cdp.close(); }
