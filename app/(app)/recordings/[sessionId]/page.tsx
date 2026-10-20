import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { SessionLoader } from "@/components/session-player";
import { getSession } from "@/lib/api-server";

type Props = { params: Promise<{ sessionId: string }>; searchParams: Promise<{ source?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await getSession((await params).sessionId).catch(() => null);
  const title = session?.title ?? session?.streamer?.displayName;
  return { title: title ?? "Recording", robots: { index: false } };
}

/** Play a Session (one stream, possibly several platform copies); the client picks its Recording. */
export default async function RecordingPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { source } = await searchParams;
  const session = await getSession(sessionId).catch(() => undefined);
  if (session === null) notFound();
  if (session?.redirectedFrom !== undefined) permanentRedirect(`/recordings/${session.id}${source ? `?source=${encodeURIComponent(source)}` : ""}`);
  return <SessionLoader sessionId={sessionId} source={typeof source === "string" ? source : null} />;
}
