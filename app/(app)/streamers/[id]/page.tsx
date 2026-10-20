import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStreamer } from "@/lib/api-server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const streamer = await getStreamer(Number((await params).id));
  if (!streamer) return { title: "Streamer unavailable" };
  const description = `Browse ghost matchups and sessions from ${streamer.displayName} on BazaarGhost.`;
  return {
    title: streamer.displayName,
    description,
    alternates: { canonical: `/streamers/${streamer.id}` },
    openGraph: { title: streamer.displayName, description, url: `/streamers/${streamer.id}`, siteName: "BazaarGhost", type: "profile" },
    twitter: { card: "summary", title: streamer.displayName, description },
  };
}

/** A Streamer's Channels, Matchups and Sessions, rendered by the search workspace. */
export default async function StreamerPage({ params }: Props) {
  if (!(await getStreamer(Number((await params).id)))) notFound();
  return null;
}
