import type { Metadata } from "next";
import { SessionLoader } from "@/components/session-player";

type Props = { params: Promise<{ sessionId: string }>; searchParams: Promise<{ source?: string }> };

export const metadata: Metadata = { title: "Recording", robots: { index: false } };

/** Play a Session (one stream, possibly several platform copies); the client picks its Recording.
 * The client loads the Session itself, so navigation does not wait on a second server-side fetch. */
export default async function RecordingPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { source } = await searchParams;
  return <SessionLoader sessionId={sessionId} source={typeof source === "string" ? source : null} />;
}
