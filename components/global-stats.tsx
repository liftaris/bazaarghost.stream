import { getGlobalStats } from "@/lib/server-utils";

const STATS_LINE_CLASS =
  "shrink-0 border-b border-sidebar-border py-1 text-center font-mono text-xs text-muted-foreground";

/** Same box as the resolved line, so streaming it in causes no layout shift. */
export function GlobalStatsFallback() {
  return <p className={STATS_LINE_CLASS}>&nbsp;</p>;
}

export async function GlobalStats() {
  const stats = await getGlobalStats();
  return (
    <p className={STATS_LINE_CLASS}>
      {stats ? `tracking ${stats.streamers} creators · ${stats.vods} videos · ${stats.matchups} matchups` : "Statistics temporarily unavailable"}
    </p>
  );
}
