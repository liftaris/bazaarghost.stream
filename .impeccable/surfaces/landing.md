---
version: 1
slug: "landing"
primary_target: "app/(app)/page.tsx"
related_targets:
  - components/landing
---

# Landing page

Mode: Persuade. User-approved concept E's column layout with independent discovery feeds and exact requested copy. The animated instrument-panel direction is deferred.

## Direction contract

THESIS: Let visitors search immediately or discover streamers, recordings, and ghosts through independent linked feeds.

OWN-WORLD: Preserve BazaarGhost's charcoal/cream themes, orange actions, Averia Libre typography, hero emblems and existing controls.

STORY: The title is exactly "BazaarGhost"; the subtitle is exactly "Bazaar ghost data from streams". Every row opens its streamer, recording, or matchup workspace directly.

FIRST VIEWPORT: Title and subtitle left, search right, above three columns with public aggregate counts. Stack columns on compact screens. Keep errors and empty states honest, with browse links available when previews fail.

DATA: One public snapshot contains all streamers, recording sessions started in the previous 24 hours, and up to 36 unique ghost names sampled from up to 500 fights recorded within seven days. Ghost selection rotates hourly across streamer and hero groups. KV stores the snapshot, which refreshes on requests after one hour. The authenticated page itself remains request-specific.

MOTION: Streamers move at 12 CSS pixels per second, recordings at 24, and ghosts at 36. Each native list resets at its end. Hover or keyboard focus pauses that column. Manual scrolling pauses until Resume is pressed. Reduced motion, hidden tabs, and offscreen feeds stop animation. Links disable speculative prefetching.

FORM: User-selected E from the previous code-rendered concepts. Reference: .impeccable/mocks/landing-data-concepts-2026-10-30/e-follow-the-matchup.png. Code-led implementation, retaining the approved structure. seed: none (user selected).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Reuse incumbent tokens and assets. No generated mockup imagery or synthetic catalog data ships.

## Finish record

Local browser verification measured 18, 36, and 54 pixels over 1.5 seconds. It passed hover, keyboard focus and reveal, manual pause and resume, reduced motion, direct workspace links, search, and server-rendered data without JavaScript. Layouts fit at 320, 390, 768, and 1440 pixels. The selected code-rendered concept remains a user-pinned seed exemption.

Evidence: `.impeccable/review/landing-scroll/verification.json`, `desktop.png`, `mobile.png`, `desktop-light.png`, and `mobile-light.png`. Screenshots use reduced motion. The build adds no shipping raster assets. `DESIGN.md` and `.impeccable/design.json` record the existing code-defined system.
