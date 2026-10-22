import assert from "node:assert/strict";
import test from "node:test";
import {
  elements,
  hooks,
  jsxRuntime,
  settle,
  sourceModules,
} from "./helpers/source-harness.mjs";

test("resizable groups persist only deliberate desktop changes, using the requested layout", () => {
  const h = hooks();
  let compact = false;
  const changes = [];
  let commits = 0;
  const load = sourceModules({
    react: h.react,
    "./use-mobile": { useIsMobile: () => compact },
    "./use-stored-split": {
      useStoredSplit: () => ({
        ratio: 0.28,
        change: (ratio) => changes.push(ratio),
        commit: () => commits++,
        restore() {},
      }),
    },
  });
  const { useResizableSplit } = load("@/hooks/use-resizable-split");
  const render = () =>
    h.render(() => useResizableSplit("results", 0.28, "results", "workspace"));
  let split = render();
  const layouts = [];
  split.groupRef.current = { setLayout: (layout) => layouts.push(layout) };
  h.flushEffects();
  assert.deepEqual(layouts, [{ results: 28.000000000000004, workspace: 72 }]);
  split.onLayoutChanged(
    { results: 40, workspace: 60 },
    { isUserInteraction: false }
  );
  assert.equal(commits, 0);
  split.onLayoutChanged(
    { results: 40, workspace: 60 },
    { isUserInteraction: true, requestedLayout: { results: 35, workspace: 65 } }
  );
  assert.deepEqual(changes, [0.35]);
  assert.equal(commits, 1);
  split.onLayoutChange({ results: 0, workspace: 100 });
  split = render();
  assert.equal(split.leadingCollapsed, true);
  assert.equal(split.trailingCollapsed, false);
  compact = true;
  split = render();
  h.flushEffects();
  assert.equal(
    split.leadingCollapsed,
    false,
    "compact panes must be interactive even after desktop collapse"
  );
  split.onLayoutChanged(
    { results: 100, workspace: 0 },
    { isUserInteraction: true }
  );
  assert.equal(
    commits,
    1,
    "compact reflow must not rewrite desktop preference"
  );
});

test("single source mark describes the playing recording, not an unmapped selected matchup source", () => {
  const load = sourceModules({
    "react/jsx-runtime": jsxRuntime,
    "@/components/platform-icon": { PlatformIcon: "PlatformIcon" },
    "@/components/ui/toggle-group": {},
    "@/components/ui/tooltip": {
      Tooltip: "Tooltip",
      TooltipTrigger: "TooltipTrigger",
      TooltipContent: "TooltipContent",
    },
    "@/lib/platforms": { getPlatform: (id) => ({ name: id }) },
  });
  const { SourceSwitcher } = load("@/components/source-switcher");
  const nodes = elements(
    SourceSwitcher({
      sources: [
        {
          platform: "youtube",
          recording: { id: 72 },
          channel: { displayName: "Fixture" },
        },
      ],
      videoId: "v:71",
      recording: { platform: "twitch", channel: { displayName: "Fixture" } },
      onSelect() {},
    })
  );
  assert.equal(
    nodes.find((e) => e.type === "PlatformIcon").props.platform,
    "twitch"
  );
});

test("vertical split restores when video and context arrive after initial render", () => {
  const h = hooks();
  const applied = [];
  const load = sourceModules({
    react: h.react,
    "./use-mobile": { useIsMobile: () => false },
    "./use-stored-split": {
      useStoredSplit: () => ({
        ratio: 0.65,
        change() {},
        commit() {},
        restore() {},
      }),
    },
  });
  const { useResizableSplit } = load("@/hooks/use-resizable-split");
  let split = h.render(() =>
    useResizableSplit("video-context", 0.58, "video", "context", false)
  );
  h.flushEffects();
  split.groupRef.current = { setLayout: (layout) => applied.push(layout) };
  split = h.render(() =>
    useResizableSplit("video-context", 0.58, "video", "context", true)
  );
  h.flushEffects();
  assert.deepEqual(applied, [{ video: 65, context: 35 }]);
});

test("player split-copy action keeps canonical sharing separate from source pins", async () => {
  const h = hooks();
  const clipboard = [];
  const originalWindow = globalThis.window;
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
  );
  globalThis.window = {
    location: new URL("https://fixture.test/matchups/501?q=private-filter"),
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { clipboard: { writeText: async (text) => clipboard.push(text) } },
  });
  try {
    const load = sourceModules({
      react: h.react,
      "react/jsx-runtime": jsxRuntime,
      "lucide-react": {},
      "@/components/embed-provider": {
        useEmbedState: () => ({
          selectedGhost: {
            matchup_id: 501,
            username: "Fixture",
            name_state: "complete",
          },
          ghosts: [],
          sources: [{ recording: { id: 71 } }],
          videoId: "v:71",
          navigationIds: [501],
          capabilities: { navigate: true },
        }),
        useEmbedActions: () => ({}),
      },
      "@/components/ui/button": { Button: "Button" },
      "@/components/ui/button-group": { ButtonGroup: "ButtonGroup" },
      "@/components/ui/dropdown-menu": {
        DropdownMenu: "DropdownMenu",
        DropdownMenuContent: "DropdownMenuContent",
        DropdownMenuGroup: "DropdownMenuGroup",
        DropdownMenuItem: "DropdownMenuItem",
        DropdownMenuTrigger: "DropdownMenuTrigger",
      },
      "@/components/ui/tooltip": {},
      "@/components/social/bookmark-button": {
        BookmarkButton: "BookmarkButton",
      },
      "@/components/source-switcher": { SourceSwitcher: "SourceSwitcher" },
      "@/lib/sources": { sourcePin: (id) => `r${id}` },
    });
    const { PlayerControls } = load("@/components/player/player-controls");
    const nodes = elements(h.render(PlayerControls));
    nodes
      .find((e) => e.type === "Button" && e.props["aria-label"] === "Copy link")
      .props.onClick();
    await settle();
    nodes.find((e) => e.type === "DropdownMenuItem").props.onSelect();
    await settle();
    assert.deepEqual(clipboard, [
      "https://fixture.test/matchups/501",
      "https://fixture.test/matchups/501?source=r71",
    ]);
    assert(!nodes.some((e) => e.props?.label === "Search opponent"));
    assert.equal(nodes.filter((e) => e.type === "SourceSwitcher").length, 1);
  } finally {
    globalThis.window = originalWindow;
    if (originalNavigator)
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    else delete globalThis.navigator;
  }
});
