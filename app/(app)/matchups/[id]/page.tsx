import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { GhostLoader } from "@/components/ghost-loader";
import { getMatchup } from "@/lib/api-server";
import { buildMatchupMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ source?: string }> };

/** Share previews follow the current published evidence at a stable URL. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getMatchup(Number((await params).id)).catch(() => undefined);
  if (detail === undefined) return { title: "Matchup" };
  if (!detail) return { title: "Matchup unavailable" };
  return buildMatchupMetadata(detail);
}

/** Open a durable video anchor; recheck visibility rather than caching its rendered evidence. */
export default async function MatchupPage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  const { source } = await searchParams;
  const pin = typeof source === "string" ? source : null;
  let detail: Awaited<ReturnType<typeof getMatchup>>;
  try {
    detail = await getMatchup(id);
  } catch {
    // Transient backend failure: let the client load the matchup so the player shell stays up
    return <GhostLoader matchupId={id} source={pin} />;
  }
  if (!detail) notFound();
  if (detail.redirectedFrom !== undefined) permanentRedirect(`/matchups/${detail.id}${pin ? `?source=${encodeURIComponent(pin)}` : ""}`);
  return <GhostLoader matchupId={id} initialMatchup={detail} source={pin} />;
}
