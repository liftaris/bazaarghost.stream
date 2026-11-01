import assert from "node:assert/strict";
import test from "node:test";
import { sourceModules } from "./helpers/source-harness.mjs";

const intro = {
  screenshotUrl: "/detections/recording/intro.jpg",
  phase: "intro",
  sourceWidth: 1280,
  sourceHeight: 720,
};

function setup(backendFetch) {
  return sourceModules({
    "node:buffer": { Buffer },
    "@/lib/backend-server": { backendFetch },
  })("@/lib/matchup-screenshot").getMatchupScreenshot;
}

test("loads the selected encounter image through the public backend route", async () => {
  let request;
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const load = setup(async (value) => {
    request = value;
    return new Response(bytes, { headers: { "Content-Type": "image/jpeg" } });
  });
  const result = await load({
    fieldEvidence: {
      encounter: intro,
      igd: { ...intro, screenshotUrl: "/detections/recording/later-clock.jpg" },
    },
  });
  assert.equal(
    request.url,
    "https://bazaarghost.stream/detections/recording/intro.jpg"
  );
  assert.equal(request.method, "GET");
  assert.equal(request.headers.has("cookie"), false);
  assert.equal(result, `data:image/jpeg;base64,${bytes.toString("base64")}`);
});

test("legacy crops, missing images and non-intro evidence use the generated card", async () => {
  const load = setup(() =>
    assert.fail("This evidence must not trigger an image fetch")
  );
  for (const encounter of [
    { fieldEvidence: {} },
    { fieldEvidence: { encounter: { ...intro, screenshotUrl: null } } },
    {
      fieldEvidence: {
        encounter: {
          ...intro,
          phase: "unknown",
          sourceWidth: null,
          sourceHeight: null,
        },
      },
    },
    { fieldEvidence: { encounter: { ...intro, phase: "post_fight" } } },
    { fieldEvidence: { encounter: { ...intro, sourceWidth: null } } },
  ])
    assert.equal(await load(encounter), null);
});

test("image fetches cannot bypass the public screenshot route", async () => {
  const load = setup(() =>
    assert.fail("Non-public image URLs must not be fetched")
  );
  for (const screenshotUrl of [
    "https://example.com/image.jpg",
    "//example.com/detections/intro.jpg",
    "/api/v1/ops/images/private.jpg",
    "/detections/../api/v1/ops/images/private.jpg",
  ])
    assert.equal(
      await load({ fieldEvidence: { encounter: { ...intro, screenshotUrl } } }),
      null
    );
});

test("unavailable, redirected and non-image responses fall back", async () => {
  for (const response of [
    new Response(null, { status: 404 }),
    new Response(null, { status: 503 }),
    new Response(null, { status: 302, headers: { Location: "/login" } }),
    new Response("not an image", { headers: { "Content-Type": "text/html" } }),
  ]) {
    const load = setup(async () => response);
    assert.equal(await load({ fieldEvidence: { encounter: intro } }), null);
  }
});

test("network and body-read failures fall back", async () => {
  for (const backendFetch of [
    async () => {
      throw new DOMException("Timed out", "TimeoutError");
    },
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new Error("Image stream interrupted"));
          },
        }),
        { headers: { "Content-Type": "image/jpeg" } }
      ),
  ]) {
    assert.equal(
      await setup(backendFetch)({ fieldEvidence: { encounter: intro } }),
      null
    );
  }
});
