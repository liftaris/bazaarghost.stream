import type { Metadata } from "next";
import type { MatchupDetail } from "./api-contract";

/** Canonical title, description and share-card metadata for a matchup. */
export function buildMatchupMetadata(detail: MatchupDetail): Metadata {
  const { matchup } = detail;
  const title = `${matchup.video.creator.name} vs ${matchup.detection.username}`;
  const description = `Watch ${title} in The Bazaar${
    matchup.detection.rank ? ` (${matchup.detection.rank})` : ""
  } on BazaarGhost.`;
  const url = `/matchups/${matchup.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "BazaarGhost",
      type: "website",
      images: [{ url: "/logo.png", width: 512, height: 512, alt: "BazaarGhost" }],
    },
    twitter: { card: "summary", title, description, images: ["/logo.png"] },
  };
}
