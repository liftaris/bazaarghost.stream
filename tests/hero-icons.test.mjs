import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  elements,
  hooks,
  jsxRuntime,
  sourceModules,
} from "./helpers/source-harness.mjs";

function setup() {
  const h = hooks();
  const load = sourceModules({
    react: {
      ...h.react,
      memo: (component) => component,
    },
    "react/jsx-runtime": jsxRuntime,
    "next/image": { default: "Image" },
    "next/link": { default: "Link" },
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "lucide-react": {
      Ghost: "Ghost",
      Radio: "Radio",
      ChevronDown: "ChevronDown",
      Check: "Check",
      Copy: "Copy",
      Search: "Search",
    },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "@/lib/api-cache": { prefetch() {} },
    "@/components/embed-provider": {
      useEmbedActions: () => ({}),
      useEmbedState: () => ({}),
    },
    "@/components/ui/avatar": {
      Avatar: "Avatar",
      AvatarImage: "AvatarImage",
      AvatarFallback: "AvatarFallback",
    },
    "@/components/source-stack": { SourceStack: "SourceStack" },
    "@/components/ui/button": { Button: "Button" },
    "@/components/social/bookmark-button": { BookmarkButton: "BookmarkButton" },
    "@tanstack/react-virtual": {
      defaultRangeExtractor() {},
      useVirtualizer: () => ({
        getTotalSize: () => 144,
        getVirtualItems: () => [{ index: 0, start: 0 }],
      }),
    },
  });
  return { h, load, HeroIcon: load("@/components/hero-icon").HeroIcon };
}

const match = {
  id: 1,
  opponent: { username: "Ghost", nameState: "complete", rank: "gold" },
  encounter: { streamerHero: "karnok", ghostHero: "the_dragons", igd: 1 },
  sources: [
    { kind: "recording", available: true, recording: { id: 1 }, at: 100 },
  ],
};

test("every hero has its exact name as alt text and a shipped asset", () => {
  const { load, HeroIcon } = setup();
  const { HERO_LABELS } = load("@/lib/session-summary");
  const manifest = JSON.parse(
    readFileSync(new URL("../public/heroes/manifest.json", import.meta.url))
  );
  assert.deepEqual(
    Object.keys(manifest.heroes).sort(),
    Object.keys(HERO_LABELS).sort()
  );
  for (const [hero, label] of Object.entries(HERO_LABELS)) {
    const icon = HeroIcon({ hero });
    assert.equal(icon.props.alt, label);
    assert.equal(icon.props.src, `/heroes/${hero}.webp`);
    assert.ok(
      existsSync(new URL(`../public${icon.props.src}`, import.meta.url))
    );
  }
});

test("unknown heroes render an accessible question mark, not a broken image", () => {
  const { HeroIcon } = setup();
  for (const hero of [null, undefined, "not-a-hero"]) {
    const icon = HeroIcon({ hero });
    assert.equal(icon.type, "span");
    assert.equal(icon.props.children, "?");
    assert.equal(icon.props.role, "img");
    assert.equal(icon.props["aria-label"], "Unknown hero");
    assert.match(icon.props.className, /text-hero-muted/);
  }
});

test("search hero insets belong to their usernames without consuming row space", () => {
  const { h, load, HeroIcon } = setup();
  const { GhostResultRow } = load("@/components/ghost-result-row");
  const tree = h.render(() =>
    GhostResultRow({
      ghost: {
        matchup: match,
        matchup_id: 1,
        username: "Ghost",
        streamer_display_name: "Streamer",
        streamer_id: "1",
        rank: "gold",
      },
      onNavigateToStreamer() {},
    })
  );
  const nodes = elements(tree);
  const icons = nodes.filter((node) => node.type === HeroIcon);
  assert.deepEqual(
    icons.map((node) => node.props.hero),
    ["karnok", "the_dragons"]
  );
  const streamer = nodes.find(
    (node) => node.props?.["data-result-streamer"] === true
  );
  const rank = nodes.find((node) => node.props?.src === "/gold.webp");
  const opponent = nodes.find((node) => node.props?.href === "/matchups/1");
  assert.ok(nodes.indexOf(icons[0]) < nodes.indexOf(streamer));
  assert.ok(nodes.indexOf(streamer) < nodes.indexOf(rank));
  assert.ok(nodes.indexOf(rank) < nodes.indexOf(icons[1]));
  assert.ok(elements(opponent).includes(icons[1]));
  for (const icon of icons) {
    assert.match(icon.props.className, /absolute/);
    assert.match(icon.props.className, /size-\[104px\]/);
    assert.match(icon.props.className, /pointer-events-none/);
  }
});

test("search results omit each missing hero without a placeholder or divider", () => {
  for (const [streamerHero, ghostHero] of [
    [null, null],
    ["karnok", null],
    [null, "the_dragons"],
  ]) {
    const { h, load, HeroIcon } = setup();
    const { GhostResultRow } = load("@/components/ghost-result-row");
    const tree = h.render(() =>
      GhostResultRow({
        ghost: {
          matchup: {
            ...match,
            encounter: { ...match.encounter, streamerHero, ghostHero },
          },
          matchup_id: 1,
          username: "Ghost",
          streamer_display_name: "Streamer",
          streamer_id: "1",
        },
        onNavigateToStreamer() {},
      })
    );
    const nodes = elements(tree);
    assert.deepEqual(
      nodes
        .filter((node) => node.type === HeroIcon)
        .map((node) => node.props.hero),
      [streamerHero, ghostHero].filter(Boolean)
    );
    assert.ok(
      !nodes.some(
        (node) => node.props?.children === "/" || node.props?.children === "?"
      )
    );
  }
});

test("companion tiles show the ghost icon and run headers show the streamer icon", () => {
  const { h, load, HeroIcon } = setup();
  const { MatchupTile } = load("@/components/companion/matchup-tile");
  const tile = h.render(() =>
    MatchupTile({ match, recordingId: null, session: null, onSelect() {} })
  );
  assert.equal(
    elements(tile).find((node) => node.type === HeroIcon).props.hero,
    "the_dragons"
  );
  const { MatchupList } = load("@/components/companion/matchup-list");
  const list = h.render(() =>
    MatchupList({
      matches: [match],
      selectedId: null,
      activeId: null,
      recordingId: null,
      session: null,
      onSelect() {},
    })
  );
  assert.equal(
    elements(list).find((node) => node.type === HeroIcon).props.hero,
    "karnok"
  );
});
