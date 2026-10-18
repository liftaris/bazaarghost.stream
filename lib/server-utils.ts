import { backendFetch } from "./backend-server";
import type { Stats } from "./api-contract";
export type { StreamerOption as StreamerWithDetections } from "./result-models";

const STATS_TIMEOUT_MS = 1500;
const STATS_TTL_MS = 300_000;
const STATS_FAILURE_TTL_MS = 30_000;
type GlobalStats = { streamers: number; vods: number; matchups: number };
let statsCache: { value: GlobalStats | null; expires: number } | null = null;
let statsInflight: Promise<GlobalStats | null> | null = null;

async function fetchGlobalStats(): Promise<GlobalStats | null> {
 try {
  const response=await backendFetch(new Request("https://bazaarghost.stream/api/v1/stats",{signal:AbortSignal.timeout(STATS_TIMEOUT_MS)}));
  if(!response.ok)return null;
  const value:Stats=await response.json();
  return {streamers:value.creators,vods:value.videos,matchups:value.matchups};
 } catch { return null; }
}

/** Public counters for the application shell; null means temporarily unavailable. Cached per isolate. */
export async function getGlobalStats(): Promise<GlobalStats | null> {
 if(statsCache && statsCache.expires>Date.now())return statsCache.value;
 statsInflight??=Promise.race([fetchGlobalStats(),new Promise<null>(resolve=>setTimeout(()=>resolve(null),STATS_TIMEOUT_MS))]).then(value=>{
  // Keep serving the last good numbers when a refresh fails.
  const kept=value??statsCache?.value??null;
  statsCache={value:kept,expires:Date.now()+(value?STATS_TTL_MS:STATS_FAILURE_TTL_MS)};
  return kept;
 }).finally(()=>{statsInflight=null;});
 return statsInflight;
}
