import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionLoader } from "@/components/session-player";
import { getStreamer } from "@/lib/api-server";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ recording?: string; source?: string }> };

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

/** The Streamers-mode selection URL; `?recording=` plays one of the Streamer's Sessions. */
export default async function StreamerPage({ params, searchParams }: Props) {
  if (!(await getStreamer(Number((await params).id)))) notFound();
  const { recording, source } = await searchParams;
  return typeof recording === "string" ? <SessionLoader sessionId={recording} source={typeof source === "string" ? source : null} /> : null;
}
