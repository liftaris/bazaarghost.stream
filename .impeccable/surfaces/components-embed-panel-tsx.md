---
version: 1
slug: "components-embed-panel-tsx"
primary_target: "components/embed-panel.tsx"
related_targets: ["components/companion/session-companion.tsx","components/search/desktop-layout.tsx","components/embed-timeline.tsx"]
---

# Session companion

Operate extension of the existing search/player workspace. Browse surrounding matchups without losing left search or restarting video. Follow the user's reattached wireframe (1000013144.png), with the confirmed day-based run and score rules in PRODUCT.md.

## Direction contract

THESIS: Collapsible session stats lead into run rows with square matchup buttons; the selected player box sits immediately below its run, aligned with the squares. Selection stays pinned while playback moves.

OWN-WORLD: Inherit incumbent cream/charcoal surfaces, orange selected states, compact typography, existing borders, buttons and platform marks. No system redesign.

STORY: Read collapsible win/loss, rank and opponent-hero stats, then scan square matchups inside runs labelled with the streamer's hero. Squares show day, rank emblem, ghost hero and opponent name. A selection seeks its matchup time and opens the compact name/rank and run/day/time player box beneath that run. No confidence display or Sessions toggle.

FIRST VIEWPORT: Persistent video above streamer/session identity, collapsible stats, and run rows. At wider container sizes a narrow run-label column sits beside wrapping squares; the selected player box aligns with the squares. Narrow containers stack labels above squares. Standard shadcn mobile Search Results/Details tabs preserve the mounted player while their contents scroll within the available viewport.

FORM: User-pinned wireframe as a loose guide, corrected to square matchups grouped by run rather than a vertical fight list. Signature interaction: a square seeks its observed matchup timestamp and reveals its player box without replacing the mounted video. Run endings and durations are not prerequisites. seed: none (user-pinned extension).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

No new visual world or shipping raster is planned. Existing system documentation is preserved; parent owns the independent final finish review and hosted acceptance. No unresolved product choices remain for this slice.

## Previous pass handoff and evidence (superseded)

- **Disposition:** scoped ship. The independent finish reviewer reported the sole required collapse-on-pagination fix resolved. Deliberately collapsed runs remain collapsed when another page arrives; a new selection can reveal its containing run.
- **Incumbent preserved:** source and supplied light/dark screenshots retain cream/charcoal surfaces, orange selection/focus, semantic background/foreground/muted/border tokens, and chart color derived from existing chart/foreground tokens. Compact existing typography, tabular counts, bordered rounded containers and shared controls continue unchanged in character; no new font or global palette is introduced.
- **Delivered hierarchy:** top win/loss, rank-emblem counts and opponent-hero distribution precede expandable observed run segments labelled with supported streamer hero, followed by an inline selected-player box. Container queries adapt the summary from three columns to two plus a full-width hero panel; metadata/actions wrap. Selection remains separate from the playhead, with the persistent player and independent search retained.
- **Missing-data contract:** distinct loaded Matchup IDs define counts, not estimated session totals. Wins/losses remain "-" because no outcome field exists; wins remaining and lethal are displayed literally, never interpreted as results. Only explicit processor continuity supports numbered segments; unknown boundaries and missing/conflicting heroes remain "-". No runner-up hero fallback is exposed by the contract or reported live samples, so none is invented. Partial/hidden names retain their identity caveats and search restrictions.
- **Evidence checked:** `PRODUCT.md`, `app/globals.css`, the four companion components, `lib/session-summary.ts`, incumbent diffs and the API encounter fields; `/tmp/opencode/bazaar-companion-rich-evidence.json` and `/tmp/opencode/bazaar-companion-sparse-evidence.json` record synthetic API/player checks in both themes at widths 320, 390, 640, 800, 1024 and 1440, including overflow, summary visibility, player retention, selection, independent query and pagination collapse, with no uncaught errors. Visually inspected rich light/dark 1440 and 390 captures and both selected-mobile captures. Parent reports 32 passing tests plus lint, typecheck and build; these commands were not rerun for this documentation pass. This is synthetic browser/viewport evidence, not real-device or real-media acceptance.
- **Assets and documentation boundary:** no new shipping raster assets; only preexisting rank emblems are reused. `DESIGN.md` was absent before this work and remains absent: the inherited FINISH boilerplate above does not expand this ordinary extension into global design-system creation. This pass only appends this handoff to the surface brief; implementation, `PRODUCT.md`, unrelated drift and `.impeccable/design.json` are untouched.

## Previous square matchup correction (superseded)

- **Delivered correction:** square buttons (64px) show observed day, existing rank emblem and matchup time, chronologically ordered inside explicit observed run groups. Groups start expanded and remain collapsible; selection seeks the timestamp and reveals the selected-player box. No run ends or inferred segments are required; unknown metadata stays "-".
- **Incumbent comparison:** checked `PRODUCT.md`, `app/globals.css`, `components/ui/button.tsx`, `components/companion/matchup-list.tsx` and `matchup-tile.tsx`. Cream/charcoal/orange remains intact; the squares use neutral, theme-safe selected borders without changing global styling. No new shipping raster assets; existing rank emblems are reused.
- **Evidence checked:** `/tmp/opencode/bazaar-companion-{rich,sparse}-evidence.json` records passing synthetic API/player checks in both themes at 320/390/640/800/1024/1440px: square dimensions/order, no tile clipping, hover/selected text contrast, timestamp seek, retained player and preserved query. Inspected `bazaar-companion-rich-{light,dark}-selected-mobile.png` and `bazaar-companion-rich-light-selected.png` in the same directory (selected time 21:40 / 1300s); `bazaar-squares-design-scan.json` is empty. Parent reports 33 passing tests plus lint/typecheck/build; not rerun here. These are synthetic viewport checks, not real-media/device or long-session keyboard assurance.
- **Handoff boundary:** correction remains uncommitted and undeployed; validation deployment `a5123bb` is the prior version. Fresh independent finish review returned **ship**, scoped to this square-matchup correction, with no material fixes identified. The documentation pass changed only this surface brief (THESIS/STORY and this section); no implementation, global design files or unrelated drift was changed by that pass. Preexisting absence of `DESIGN.md` remains untouched.

## Current wireframe correction handoff

- **Retained system:** incumbent cream/charcoal surfaces, orange accents, compact typography and shared shadcn controls. This is an existing UI extension; no new global design system or shipping raster.
- **Changes:** square matchups show rank, ghost hero, day and name; the compact selected-player box sits beneath its run without confidence. Runs follow continuously increasing days within each VOD, resetting at day 1. User-confirmed scores are wins = 10 − winsRemaining and losses = day − wins; each run uses its latest cumulative score. Top stats collapse, mobile navigation uses standard shadcn tabs, and the Sessions toggle and explanatory observed-matchups/observed-segments copy are removed. Bounded mobile scrolling retains the mounted player.
- **Evidence and limits:** prior completed checks, reported by the parent, include 32 tests, lint, typecheck and build; rich/sparse synthetic API/player checks in both themes at 320/390/640/800/1024/1440px, plus 390×740 wheel/touch scrolling and stats collapse. Evidence: `/tmp/opencode/bazaar-companion-{rich,sparse}-evidence.json`, rich light selected and dark selected-mobile screenshots in that directory, and empty `/tmp/opencode/bazaar-wireframe-scan.json`. Checks and inspections were not repeated after the server restart. This supports synthetic viewport/player behavior, not real-media/device acceptance or long-list keyboard assurance.
- **Review and status:** fresh independent reviewer returned **ship**, with no material fixes for this wireframe correction. Review was scoped locally; supporting embed/button/collapsible code and the verification script were not independently inspected by that reviewer. Current correction remains local, uncommitted and undeployed; validation still serves the previous square-tile version `1496ec60-8996-496b-a879-8a1b5f57b2d3`. This handoff supersedes prior handoffs and changes only this surface brief.
