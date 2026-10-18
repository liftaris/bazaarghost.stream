import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GhostLoader } from "@/components/ghost-loader";
import { getMatchup } from "@/lib/api-server";
import { buildMatchupMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ id: string }> };

/** Share previews follow the current published evidence at a stable URL. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getMatchup(Number((await params).id));
  if (!detail) return { title: "Matchup unavailable" };
  return buildMatchupMetadata(detail);
}

/** Open a durable video anchor; recheck visibility rather than caching its rendered evidence. */
export default async function MatchupPage({ params }: Props) {
  const id = Number((await params).id);
  const detail = await getMatchup(id);
  if (!detail) notFound();
  return <GhostLoader matchupId={id} initialMatchup={detail.matchup} />;
}
