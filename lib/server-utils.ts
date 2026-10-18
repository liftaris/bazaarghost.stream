import { backendFetch } from "./backend-server";
import type { Stats } from "./api-contract";
export type { StreamerOption as StreamerWithDetections } from "./result-models";
/** Public counters for the application shell; null means temporarily unavailable. */
export async function getGlobalStats() {
 try {
  const response=await backendFetch(new Request("https://bazaarghost.stream/api/v1/stats"));
  if(!response.ok)return null;
  const value:Stats=await response.json();
  return {streamers:value.creators,vods:value.videos,matchups:value.matchups};
 } catch { return null; }
}
