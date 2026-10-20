import { MetadataRoute } from "next";
import { getRecentMatchups } from "@/lib/api-server";
import { SITE_URL } from "@/lib/site";

const RECENT_MATCHUPS = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/search`, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/how-it-works`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/donate`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const matchups = await getRecentMatchups(RECENT_MATCHUPS);
    for (const m of matchups)
      routes.push({
        url: `${baseUrl}/matchups/${m.id}`,
        lastModified: m.indexedAt,
        changeFrequency: "never",
        priority: 0.6,
      });
  } catch {
    // Backend unavailable: still serve the static entries.
  }
  return routes;
}
