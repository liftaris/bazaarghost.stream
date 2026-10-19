/** Ghosts closer than this to the playhead count as "the current one". */
const GHOST_NAV_BUFFER = 2;

interface TimedGhost {
  frame_time_seconds: number;
}

/** Ghost before the playhead (first ghost if none). `ghosts` sorted ascending. */
export function findPrevGhost<T extends TimedGhost>(ghosts: T[], currentTime: number): T | null {
  if (ghosts.length === 0) return null;
  for (let i = ghosts.length - 1; i >= 0; i--) {
    if (ghosts[i].frame_time_seconds < currentTime - GHOST_NAV_BUFFER) return ghosts[i];
  }
  return ghosts[0];
}

/** Ghost after the playhead (last ghost if none). `ghosts` sorted ascending. */
export function findNextGhost<T extends TimedGhost>(ghosts: T[], currentTime: number): T | null {
  if (ghosts.length === 0) return null;
  for (const g of ghosts) {
    if (g.frame_time_seconds > currentTime + GHOST_NAV_BUFFER) return g;
  }
  return ghosts[ghosts.length - 1];
}
