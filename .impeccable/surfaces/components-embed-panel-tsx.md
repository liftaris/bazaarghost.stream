---
version: 1
slug: "components-embed-panel-tsx"
primary_target: "components/embed-panel.tsx"
related_targets: ["components/companion/session-companion.tsx","components/search/desktop-layout.tsx","components/embed-timeline.tsx"]
---

# Session companion

Operate extension of the existing search/player workspace. Confirmed task: browse surrounding matchups without losing left search or restarting video. Use real canonical metadata and honest unknown/partial states. No new imagery or inferred run/outcome data.

## Direction contract

THESIS: A compact session overview leads into expandable run-segment rows and a selected opponent box; selection stays pinned while playback moves, without replacing search.

OWN-WORLD: Inherit incumbent cream/charcoal surfaces, orange selected states, compact typography, existing borders, buttons and platform marks. No system redesign.

STORY: Read observed win/loss, rank and opponent-hero coverage at the top, expand a run segment labelled with the streamer's hero, then select an opponent inline. Missing values are "-"; processing segments are never presented as verified complete runs or outcomes.

FIRST VIEWPORT: Existing header and independent left results rail; persistent right video above streamer/session identity, three compact summary boxes, and chronological expandable run rows. Rank emblems anchor a miniature count chart; hero bars describe observed opponents. The selected fight reveals a player box with supported metadata and actions. Mobile Search Results/Details tabs preserve this same tree.

FORM: User-pinned wireframe as a loose guide, local Operate extension; no concept tournament. Signature interaction: a run row opens its observed fights, and selecting a fight reveals its player box without restarting the mounted video. seed: none (user-pinned extension).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

No new visual world or shipping raster is planned. Existing system documentation is preserved; parent owns the independent final finish review and hosted acceptance. No unresolved product choices remain for this slice.

## Completed handoff and evidence

- **Disposition:** scoped ship. The independent finish reviewer reported the sole required collapse-on-pagination fix resolved. Deliberately collapsed runs remain collapsed when another page arrives; a new selection can reveal its containing run.
- **Incumbent preserved:** source and supplied light/dark screenshots retain cream/charcoal surfaces, orange selection/focus, semantic background/foreground/muted/border tokens, and chart color derived from existing chart/foreground tokens. Compact existing typography, tabular counts, bordered rounded containers and shared controls continue unchanged in character; no new font or global palette is introduced.
- **Delivered hierarchy:** top win/loss, rank-emblem counts and opponent-hero distribution precede expandable observed run segments labelled with supported streamer hero, followed by an inline selected-player box. Container queries adapt the summary from three columns to two plus a full-width hero panel; metadata/actions wrap. Selection remains separate from the playhead, with the persistent player and independent search retained.
- **Missing-data contract:** distinct loaded Matchup IDs define counts, not estimated session totals. Wins/losses remain "-" because no outcome field exists; wins remaining and lethal are displayed literally, never interpreted as results. Only explicit processor continuity supports numbered segments; unknown boundaries and missing/conflicting heroes remain "-". No runner-up hero fallback is exposed by the contract or reported live samples, so none is invented. Partial/hidden names retain their identity caveats and search restrictions.
- **Evidence checked:** `PRODUCT.md`, `app/globals.css`, the four companion components, `lib/session-summary.ts`, incumbent diffs and the API encounter fields; `/tmp/opencode/bazaar-companion-rich-evidence.json` and `/tmp/opencode/bazaar-companion-sparse-evidence.json` record synthetic API/player checks in both themes at widths 320, 390, 640, 800, 1024 and 1440, including overflow, summary visibility, player retention, selection, independent query and pagination collapse, with no uncaught errors. Visually inspected rich light/dark 1440 and 390 captures and both selected-mobile captures. Parent reports 32 passing tests plus lint, typecheck and build; these commands were not rerun for this documentation pass. This is synthetic browser/viewport evidence, not real-device or real-media acceptance.
- **Assets and documentation boundary:** no new shipping raster assets; only preexisting rank emblems are reused. `DESIGN.md` was absent before this work and remains absent: the inherited FINISH boilerplate above does not expand this ordinary extension into global design-system creation. This pass only appends this handoff to the surface brief; implementation, `PRODUCT.md`, unrelated drift and `.impeccable/design.json` are untouched.
