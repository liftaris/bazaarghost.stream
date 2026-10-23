# BazaarGhost

BazaarGhost helps viewers find Bazaar matchups and watch their surrounding play sessions across recording sources.

## Confirmed workflow

- Search is an independent left workspace: mode, query, filters, results and scroll change only through deliberate search intent.
- The right workspace keeps video central, with a connected streamer → session → observed days/matchups → inline selected matchup hierarchy. No tabs are mandated.
- A selected matchup stays pinned during passive playback. Previous/next starts from that selection; the active playhead is separate. Timeline selection commits on release, not preview.
- Closing video expands the same context. Selecting a matchup while closed reopens video. Opening the current session alone never restarts it.
- Horizontal and vertical split sizes persist locally; compact layouts preserve a single mounted player and accessible controls.

## Evidence and boundaries

Use stable Matchup IDs, actual source/session time mappings, nullable names and supported ranks/days. Runs group a continuous increasing sequence of matchup days within one VOD; a new day 1 starts a new run. Missing days stay unknown. Wins are 10 minus extracted wins remaining; losses are day minus wins. Session totals use each run's latest available score, not the sum of cumulative scores from every matchup. Partial names are observed text, not verified identities. Nameplate evidence images are not public UI assets.

## Visual commitments

Extend the incumbent cream/charcoal/orange interface and existing component language. This is an Operate workspace, not a visual redesign. Preserve the persistent player, existing search foundation, source selection, bookmarks and clean canonical sharing. Cloudflare migration branches are not production cutover.
