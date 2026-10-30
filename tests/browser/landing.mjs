import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright-core"
);
const [
  origin = "http://127.0.0.1:4740",
  output = ".impeccable/review/landing-scroll",
] = process.argv.slice(2);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  colorScheme: "dark",
});
const checks = [],
  requests = [],
  errors = [];
await page.exposeBinding("recordLandingError", ({ frame }, message) => {
  if (new URL(frame.url()).origin === origin) errors.push(message);
});
await page.addInitScript(() => {
  window.addEventListener("error", (event) =>
    window.recordLandingError(event.message)
  );
  window.addEventListener("unhandledrejection", (event) =>
    window.recordLandingError(String(event.reason))
  );
});
page.on("request", (request) => requests.push(request.url()));
const feed = (name) =>
  page.getByRole("region", { name: `${name} feed`, exact: true });
const ready = async () => {
  await feed("Ghosts").getByRole("link").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const movement = async (ms = 1000) =>
  page.evaluate(async (ms) => {
    const nodes = [...document.querySelectorAll('[aria-label$=" feed"]')];
    const start = nodes.map((node) => node.scrollTop);
    await new Promise((resolve) => setTimeout(resolve, ms));
    return nodes.map((node, i) => node.scrollTop - start[i]);
  }, ms);
const release = async () => {
  await page.getByRole("searchbox", { name: "Your in-game name" }).focus();
  await page.mouse.move(10, 10);
};

try {
  await page.goto(origin);
  await ready();
  assert.equal(await page.title(), "BazaarGhost");
  assert.equal(
    await page.getByRole("heading", { level: 1 }).innerText(),
    "BazaarGhost"
  );
  assert.equal(
    await page
      .getByText("Bazaar ghost data from streams", { exact: true })
      .count(),
    1
  );
  const generatedAt = await page.locator("time").getAttribute("datetime");
  const counts = await page
    .locator('[aria-label$=" feed"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.querySelectorAll("li").length)
    );
  assert.ok(
    counts.every((count) => count > 4),
    `Live datasets must overflow to verify motion: ${counts}`
  );
  checks.push({
    check: "Exact copy and server-provided datasets",
    generatedAt,
    counts,
  });

  await page.mouse.move(10, 10);
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[aria-label$=" feed"]')].every(
      (node) => node.scrollTop > 5
    )
  );
  const delta = await movement(1500);
  assert.ok(delta[0] >= 10, JSON.stringify(delta));
  assert.ok(Math.abs(delta[1] - delta[0] * 2) <= 3, JSON.stringify(delta));
  assert.ok(Math.abs(delta[2] - delta[0] * 3) <= 3, JSON.stringify(delta));
  checks.push({
    check: "Independent 1:2:3 displacement on unequal list lengths",
    delta,
  });

  await page.getByRole("heading", { name: "Recordings", exact: true }).hover();
  const hover = await movement();
  assert.equal(hover[1], 0);
  assert.ok(hover[0] > 0 && hover[2] > 0);
  await page.mouse.move(10, 10);
  const distant = feed("Recordings").getByRole("link").nth(15);
  await distant.focus();
  assert.equal((await movement(500))[1], 0);
  const bounds = await distant.boundingBox(),
    viewport = await feed("Recordings").boundingBox();
  assert.ok(
    bounds.y >= viewport.y &&
      bounds.y + bounds.height <= viewport.y + viewport.height + 1
  );
  await release();
  await feed("Recordings").hover();
  await page.mouse.wheel(0, 100);
  await page
    .getByRole("button", { name: "Resume recordings scrolling" })
    .waitFor();
  await release();
  assert.equal((await movement(500))[1], 0);
  await page
    .getByRole("button", { name: "Resume recordings scrolling" })
    .click();
  await release();
  assert.ok((await movement(500))[1] > 0);
  checks.push({
    check:
      "Whole-column hover, keyboard focus/reveal, manual pause and explicit resume",
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.deepEqual(await movement(500), [0, 0, 0]);
  assert.ok(
    !requests.some((url) =>
      /\/api\/v1\/(stats|streamers|sessions|search)(\?|$)/.test(url)
    )
  );
  checks.push({
    check: "Reduced motion stops feeds; no browser catalog API requests",
  });

  await page.evaluate(() =>
    document.querySelectorAll('[aria-label$=" feed"]').forEach((node) => {
      node.scrollTop = 0;
    })
  );
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true
    );
    if (width === 1440 || width === 390)
      await page.screenshot({
        path: `${output}/${width === 1440 ? "desktop" : "mobile"}.png`,
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light")
  );
  await page.screenshot({ path: `${output}/mobile-light.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: `${output}/desktop-light.png`,
    fullPage: true,
  });
  checks.push({
    check: "Four widths fit, dark/light desktop and mobile captures",
  });

  for (const [name, prefix, placeholder] of [
    ["Streamers", "/streamers/", "Streamer name…"],
    ["Recordings", "/recordings/", "Recording title…"],
    ["Ghosts", "/matchups/", "Ghost username…"],
  ]) {
    const row = feed(name).getByRole("link").first();
    const href = await row.getAttribute("href");
    assert.ok(href.startsWith(prefix));
    await row.click();
    await page.waitForURL(
      (url) => url.pathname === new URL(href, origin).pathname
    );
    await page.getByPlaceholder(placeholder).waitFor();
    await page.getByRole("link", { name: "BazaarGhost home" }).click();
    await page.waitForURL(origin + "/");
    await ready();
    assert.equal(
      await page.locator("time").getAttribute("datetime"),
      generatedAt
    );
  }
  await page
    .getByRole("searchbox", { name: "Your in-game name" })
    .fill("  Sash & test  ");
  await page
    .getByRole("searchbox", { name: "Your in-game name" })
    .press("Enter");
  await page.waitForURL(
    (url) =>
      url.pathname === "/search" && url.searchParams.get("q") === "Sash & test"
  );
  assert.equal(
    await page.getByPlaceholder("Ghost username…").inputValue(),
    "Sash & test"
  );
  checks.push({
    check:
      "Each feed opens its workspace; cached snapshot survives navigation; keyboard search encodes input",
  });

  const staticPage = await browser.newPage({ javaScriptEnabled: false });
  await staticPage.goto(origin);
  assert.equal(
    await staticPage
      .getByRole("region", { name: "Streamers feed", exact: true })
      .getByRole("link")
      .count(),
    counts[0]
  );
  assert.equal(
    await staticPage.locator("time").getAttribute("datetime"),
    generatedAt
  );
  await staticPage.close();
  checks.push({
    check:
      "Complete snapshot present without JavaScript and reused across a fresh browser session",
  });
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/verification.json`,
    JSON.stringify({ checks, errors, requests }, null, 2)
  );
  console.log(JSON.stringify(checks, null, 2));
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  await writeFile(
    `${output}/failure.json`,
    JSON.stringify(
      {
        error: String(error),
        checks,
        errors,
        url: page.url(),
        body: await page.locator("body").innerText(),
      },
      null,
      2
    )
  );
  throw error;
} finally {
  await browser.close();
}
