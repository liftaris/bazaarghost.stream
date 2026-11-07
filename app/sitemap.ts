import { MetadataRoute } from "next";
import { getRecentMatchups, getStreamers } from "@/lib/api-server";
import { SITE_URL } from "@/lib/site";

const RECENT_MATCHUPS = 500;
const STREAMERS = 1000;

/** Without this, the first render is cached for good; a failed render throws so the last good copy stays. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/streamers`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/donate`, changeFrequency: "monthly", priority: 0.5 },
  ];
  const [streamers, matchups] = await Promise.all([
    getStreamers(STREAMERS),
    getRecentMatchups(RECENT_MATCHUPS),
  ]).catch((error: unknown) => {
    console.error({
      event: "sitemap_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });
  for (const s of streamers)
    routes.push({
      url: `${baseUrl}/streamers/${s.id}`,
      changeFrequency: "daily",
      priority: 0.7,
    });
  for (const m of matchups)
    routes.push({
      url: `${baseUrl}/matchups/${m.id}`,
      lastModified: m.indexedAt,
      changeFrequency: "never",
      priority: 0.6,
    });
  return routes;
}
