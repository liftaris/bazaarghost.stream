import type { Metadata } from "next";
import type { MatchupDetail } from "./api-contract";
import { matchupOwner } from "./result-models";
import { opponentLabel } from "./opponent-name";

/** Canonical title, description and share-card metadata for a matchup. */
export function buildMatchupMetadata(detail: MatchupDetail): Metadata {
  const owner = matchupOwner(detail).name;
  const title = `${owner} vs ${opponentLabel(detail.opponent)}`;
  const description = `Watch ${title} in The Bazaar${
    detail.opponent.rank ? ` (${detail.opponent.rank})` : ""
  } on BazaarGhost.`;
  const url = `/matchups/${detail.id}`;
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
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
