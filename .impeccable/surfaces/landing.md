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

FIRST VIEWPORT: The hero is the enlarged existing navbar, not a second header. Keep its logo, wordmark, navigation links, and menu, with the exact subtitle and a centered search form below. Three columns show public aggregate counts and linked feeds. Stack columns on compact screens. Column headings remain browse links when previews fail. No pause buttons, bottom browse links, helper/refresh section, or footer.

DATA: One public snapshot contains all streamers, recording sessions started in the previous 24 hours, and up to 36 unique ghost names sampled from up to 500 fights recorded within seven days. Ghost selection rotates hourly across streamer and hero groups. KV stores the snapshot, which refreshes on requests after one hour. The authenticated page itself remains request-specific.

MOTION: Streamers move at 12 CSS pixels per second, recordings at 24, and ghosts at 36. Each native list resets at its end. Hover or keyboard focus pauses that column; leaving resumes it. Touch pauses until two seconds after the last touch or momentum scroll. Reduced motion, hidden tabs, and offscreen feeds stop animation. Links disable speculative prefetching.

SEARCH: Two trimmed characters open `/search` with the query preserved. IME waits for composition to finish. A View Transition connects the enlarged brand and input to the workspace navbar. Reduced motion and unsupported browsers navigate directly. Preserve focus and text entered while navigation is pending.

FORM: User-selected E from the previous code-rendered concepts. Reference: .impeccable/mocks/landing-data-concepts-2026-10-30/e-follow-the-matchup.png. Code-led implementation, retaining the approved structure. seed: none (user selected).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Reuse incumbent tokens and assets. No generated mockup imagery or synthetic catalog data ships.

## Finish record

Local browser verification measured 18, 36, and 54 pixels over 1.5 seconds. It passed hover, keyboard focus and reveal, manual pause and resume, reduced motion, direct workspace links, search, and server-rendered data without JavaScript. Layouts fit at 320, 390, 768, and 1440 pixels. The selected code-rendered concept remains a user-pinned seed exemption.

Original evidence: `.impeccable/review/landing-scroll/verification.json`, `desktop.png`, `mobile.png`, `desktop-light.png`, and `mobile-light.png`. Screenshots use reduced motion. The build adds no shipping raster assets. `DESIGN.md` records the code-defined system.

2026-11-03 refinement evidence: `.ignore/landing-hero/verification.json` and its desktop, mobile, and search screenshots. `tests/browser/landing.mjs` verifies removal of the lower controls and footer, hover/leave resume, a real mobile touch hold, two-second resume, four widths, both themes, the two-character threshold, focus transfer, continued typing, IME, and fallback navigation. The landing-only run skips detail-page navigation because the backend returned 503 during the full run; feed destinations are still checked. The existing design sidecar was not regenerated.
