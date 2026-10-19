import { getGlobalStats } from "@/lib/server-utils";

/** Catalog size in one line, for the How It Works page. */
export async function GlobalStats() {
  const stats = await getGlobalStats();
  if (!stats) return null;
  return (
    <p className="font-mono text-sm text-muted-foreground">
      {stats.streamers} creators · {stats.vods} videos · {stats.matchups} matchups
    </p>
  );
}
